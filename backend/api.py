"""FastAPI Backend Server for Offline Signature Verification Pipeline (SignaLCS)"""
import json
import logging
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.pipeline.image_to_matrix import ImageToMatrixConverter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("signalcs-api")

app = FastAPI(
    title="SignaLCS Backend API",
    description="Offline Handwritten Signature Verification Pipeline using LCS Algorithm",
    version="0.1.0",
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load benchmark mock template as contract baseline for stages pending Phase 3-6
MOCK_FILE_PATH = Path(__file__).resolve().parent.parent / "frontend" / "src" / "data" / "mockResponse.json"


def get_mock_template() -> dict:
    """Load mock reference response contract."""
    if MOCK_FILE_PATH.exists():
        with open(MOCK_FILE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "signature_a": {
            "binary_matrix": ["0" * 64 for _ in range(64)],
            "compressed_matrix": ["0" * 16 for _ in range(16)],
            "row_density": [0] * 16,
            "col_density": [0] * 16,
            "fingerprint_string": "0" * 16,
        },
        "signature_b": {
            "binary_matrix": ["0" * 64 for _ in range(64)],
            "compressed_matrix": ["0" * 16 for _ in range(16)],
            "row_density": [0] * 16,
            "col_density": [0] * 16,
            "fingerprint_string": "0" * 16,
        },
        "comparison": {
            "lcs_length": 16,
            "lcs_string": "0" * 16,
            "similarity_percent": 100.0,
            "dp_table": [[0] * 17 for _ in range(17)],
            "traceback_path": [[i, i] for i in range(17)],
            "verdict": "likely match",
        },
    }


@app.get("/")
@app.get("/api/health")
async def health_check():
    """Health check endpoint for server ping and status discovery."""
    return {
        "status": "ok",
        "service": "SignaLCS Verification API",
        "version": "0.1.0",
        "active_stages": ["Stage 1: Acquisition", "Stage 2: ImageToMatrixConverter"],
    }


@app.post("/api/compare-signatures")
async def compare_signatures(
    signature_a: UploadFile = File(...),
    signature_b: UploadFile = File(...),
    threshold: Optional[int] = Form(128),
    block_size: Optional[int] = Form(4),
    ink_ratio: Optional[float] = Form(0.10),
    quantization_levels: Optional[int] = Form(16),
    working_resolution: Optional[int] = Form(64),
):
    """Compare two signature files through the verification pipeline."""
    # Validate files presence
    if not signature_a or not signature_b:
        raise HTTPException(status_code=400, detail="Both signature_a and signature_b are required.")

    # Read uploaded bytes
    try:
        bytes_a = await signature_a.read()
        bytes_b = await signature_b.read()
    except Exception as e:
        logger.error("Failed to read uploaded files: %s", e)
        raise HTTPException(status_code=400, detail=f"Failed to read image files: {str(e)}")

    if len(bytes_a) == 0 or len(bytes_b) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

    # Execute Stage 2: ImageToMatrixConverter on both signatures
    try:
        converter = ImageToMatrixConverter(
            threshold=threshold,
            working_resolution=working_resolution,
        )
        binary_matrix_a = converter.convert(bytes_a)
        binary_matrix_b = converter.convert(bytes_b)
    except Exception as e:
        logger.error("Stage 2 ImageToMatrixConverter failed: %s", e)
        raise HTTPException(status_code=422, detail=f"Invalid image format or corrupt file: {str(e)}")

    # Assemble contract response
    template = get_mock_template()

    # Embed real Stage 2 live computed matrices
    template["signature_a"]["binary_matrix"] = binary_matrix_a
    template["signature_b"]["binary_matrix"] = binary_matrix_b

    # Update parameters used in response
    template["params_used"] = {
        "threshold": threshold,
        "block_size": block_size,
        "ink_ratio": ink_ratio,
        "quantization_levels": quantization_levels,
        "working_resolution": working_resolution,
    }

    logger.info(
        "Successfully processed Stage 2 for files '%s' and '%s' (T=%d, Res=%d)",
        signature_a.filename,
        signature_b.filename,
        threshold,
        working_resolution,
    )

    return JSONResponse(content=template)
