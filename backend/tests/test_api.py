"""Unit and integration tests for FastAPI backend API endpoints (Phases 7 & 8)"""
import io
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw
from backend.api import app

client = TestClient(app)


def generate_png_bytes(color=255) -> bytes:
    """Helper to create dummy PNG bytes."""
    img = Image.new("L", (64, 64), color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def generate_drawn_signature(diag=True) -> bytes:
    """Helper to generate synthetic signature lines."""
    img = Image.new("L", (64, 64), color=255)
    draw = ImageDraw.Draw(img)
    if diag:
        draw.line([(5, 5), (55, 55)], fill=0, width=3)
    else:
        draw.line([(5, 55), (55, 5)], fill=0, width=3)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_health_check_endpoint():
    """Verify /api/health returns 200 OK and all pipeline stages active."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "SignaLCS" in data["service"]
    assert len(data["active_stages"]) >= 6
    assert "Stage 6" in data["active_stages"][5]



def test_root_endpoint():
    """Verify / returns 200 OK."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_compare_signatures_identical_images_100_pct_match():
    """Verify identical images yield 100% similarity and 'likely match'."""
    sig_bytes = generate_drawn_signature(diag=True)

    response = client.post(
        "/api/compare-signatures",
        files={
            "signature_a": ("sig_a.png", sig_bytes, "image/png"),
            "signature_b": ("sig_b.png", sig_bytes, "image/png"),
        },
        data={"threshold": "128", "block_size": "4"},
    )

    assert response.status_code == 200
    data = response.json()

    # Stage 6 Dynamic DP LCS Output Verification
    comparison = data["comparison"]
    assert comparison["lcs_length"] == 16
    assert comparison["similarity_percent"] == 100.0
    assert comparison["verdict"] == "likely match"
    assert len(comparison["dp_table"]) == 17
    assert len(comparison["dp_table"][0]) == 17
    assert len(comparison["traceback_path"]) > 0
    assert comparison["traceback_path"][0] == [0, 0]
    assert comparison["traceback_path"][-1] == [16, 16]


def test_compare_signatures_completely_dissimilar_images_0_pct():
    """Verify solid black vs solid white yields 0% similarity and 'likely different'."""
    png_black = generate_png_bytes(color=0)    # Fingerprint: "FFFFFFFFFFFFFFFF"
    png_white = generate_png_bytes(color=255)  # Fingerprint: "0000000000000000"

    response = client.post(
        "/api/compare-signatures",
        files={
            "signature_a": ("sig_a.png", png_black, "image/png"),
            "signature_b": ("sig_b.png", png_white, "image/png"),
        },
    )

    assert response.status_code == 200
    data = response.json()

    assert data["signature_a"]["fingerprint_string"] == "F" * 16
    assert data["signature_b"]["fingerprint_string"] == "0" * 16

    comparison = data["comparison"]
    assert comparison["lcs_length"] == 0
    assert comparison["lcs_string"] == ""
    assert comparison["similarity_percent"] == 0.0
    assert comparison["verdict"] == "likely different"


def test_compare_signatures_configurable_match_threshold():
    """Verify custom match_threshold_pct overrides the verdict decision."""
    sig_1 = generate_drawn_signature(diag=True)
    sig_2 = generate_drawn_signature(diag=False)

    # First with default 60% threshold
    res_default = client.post(
        "/api/compare-signatures",
        files={
            "signature_a": ("sig_a.png", sig_1, "image/png"),
            "signature_b": ("sig_b.png", sig_2, "image/png"),
        },
        data={"match_threshold_pct": "95.0"},
    )
    assert res_default.status_code == 200
    data = res_default.json()
    assert data["params_used"]["match_threshold_pct"] == 95.0


def test_compare_signatures_empty_file_400():
    """Verify uploading an empty file returns 400 with clean error JSON."""
    png_valid = generate_png_bytes(color=0)
    response = client.post(
        "/api/compare-signatures",
        files={
            "signature_a": ("sig_a.png", png_valid, "image/png"),
            "signature_b": ("empty.png", b"", "image/png"),
        },
    )
    assert response.status_code == 400
    data = response.json()
    assert "error" in data
    assert "empty" in data["error"].lower()


def test_compare_signatures_includes_levenshtein_extension():
    """Verify comparison block includes Levenshtein distance and similarity."""
    png_a = generate_png_bytes(color=0)
    png_b = generate_png_bytes(color=0)

    response = client.post(
        "/api/compare-signatures",
        files={
            "signature_a": ("sig_a.png", png_a, "image/png"),
            "signature_b": ("sig_b.png", png_b, "image/png"),
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "levenshtein" in data["comparison"]
    lev = data["comparison"]["levenshtein"]
    assert lev["distance"] == 0
    assert lev["similarity_percent"] == 100.0
    assert lev["verdict"] == "likely match"
    assert len(lev["operations"]) == 16


def test_validation_error_handler_returns_clean_error_json():
    """Verify invalid parameter type returns 422 with clean { 'error': ... } format."""
    png_a = generate_png_bytes(color=0)
    png_b = generate_png_bytes(color=0)

    response = client.post(
        "/api/compare-signatures",
        files={
            "signature_a": ("sig_a.png", png_a, "image/png"),
            "signature_b": ("sig_b.png", png_b, "image/png"),
        },
        data={"threshold": "NOT_AN_INTEGER"},
    )

    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert "validation" in data["error"].lower()


def test_compare_signatures_corrupt_file_422():
    """Verify corrupt image upload returns 422 with clean error JSON."""
    png_valid = generate_png_bytes(color=0)
    response = client.post(
        "/api/compare-signatures",
        files={
            "signature_a": ("sig_a.png", png_valid, "image/png"),
            "signature_b": ("corrupt.png", b"NOT_A_VALID_IMAGE_DATA", "image/png"),
        },
    )
    assert response.status_code == 422
    data = response.json()
    assert "error" in data



