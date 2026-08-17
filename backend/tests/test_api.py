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

    # Verify Stage 2 binary_matrix was generated for both
    assert len(data["signature_a"]["binary_matrix"]) == 64
    assert len(data["signature_b"]["binary_matrix"]) == 64

    # All black image -> all '1's
    assert data["signature_a"]["binary_matrix"][0] == "1" * 64
    # All white image -> all '0's
    assert data["signature_b"]["binary_matrix"][0] == "0" * 64


def test_compare_signatures_missing_file_422():
    """Verify missing file returns 422 Unprocessable Entity."""
    response = client.post(
        "/api/compare-signatures",
        data={"threshold": "128"},
    )
    assert response.status_code == 422
