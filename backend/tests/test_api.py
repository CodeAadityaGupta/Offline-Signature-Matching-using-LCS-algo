"""Unit and integration tests for FastAPI backend API endpoints"""
import io
from fastapi.testclient import TestClient
from PIL import Image
from backend.api import app

client = TestClient(app)


def generate_png_bytes(color=255) -> bytes:
    """Helper to create dummy PNG bytes."""
    img = Image.new("L", (64, 64), color=color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_health_check_endpoint():
    """Verify /api/health returns 200 OK and status JSON."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "SignaLCS" in data["service"]
    assert len(data["active_stages"]) >= 5


def test_root_endpoint():
    """Verify / returns 200 OK."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_compare_signatures_endpoint_valid():
    """Verify POST /api/compare-signatures processes valid images and returns full contract."""
    png_a = generate_png_bytes(color=0)  # black
    png_b = generate_png_bytes(color=255)  # white

    response = client.post(
        "/api/compare-signatures",
        files={
            "signature_a": ("sig_a.png", png_a, "image/png"),
            "signature_b": ("sig_b.png", png_b, "image/png"),
        },
        data={"threshold": "128", "block_size": "4"},
    )

    assert response.status_code == 200
    data = response.json()

    # Check top-level contract keys
    assert "signature_a" in data
    assert "signature_b" in data
    assert "comparison" in data
    assert "params_used" in data

    # Verify Stage 2 binary_matrix (64x64)
    assert len(data["signature_a"]["binary_matrix"]) == 64
    assert len(data["signature_b"]["binary_matrix"]) == 64
    assert data["signature_a"]["binary_matrix"][0] == "1" * 64
    assert data["signature_b"]["binary_matrix"][0] == "0" * 64

    # Verify Stage 3 compressed_matrix (16x16)
    assert len(data["signature_a"]["compressed_matrix"]) == 16
    assert len(data["signature_a"]["compressed_matrix"][0]) == 16
    assert data["signature_a"]["compressed_matrix"][0] == "1" * 16
    assert data["signature_b"]["compressed_matrix"][0] == "0" * 16

    # Verify Stage 4 row_density & col_density (16 ints each)
    assert len(data["signature_a"]["row_density"]) == 16
    assert len(data["signature_a"]["col_density"]) == 16
    assert data["signature_a"]["row_density"] == [16] * 16
    assert data["signature_a"]["col_density"] == [16] * 16
    assert data["signature_b"]["row_density"] == [0] * 16

    # Verify Stage 5 fingerprint_string (16 chars)
    assert len(data["signature_a"]["fingerprint_string"]) == 16
    assert len(data["signature_b"]["fingerprint_string"]) == 16
    assert data["signature_a"]["fingerprint_string"] == "F" * 16
    assert data["signature_b"]["fingerprint_string"] == "0" * 16


def test_compare_signatures_missing_file_422():
    """Verify missing file returns 422 Unprocessable Entity."""
    response = client.post(
        "/api/compare-signatures",
        data={"threshold": "128"},
    )
    assert response.status_code == 422
