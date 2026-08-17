"""FastAPI Backend Server for Offline Signature Verification Pipeline (SignaLCS)"""
import json
import logging
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.pipeline.image_to_matrix import ImageToMatrixConverter
from backend.pipeline.matrix_compressor import MatrixCompressor
from backend.pipeline.row_col_converter import MatrixToRowColConverter
from backend.pipeline.row_col_compressor import RowColCompressor
from backend.pipeline.lcs_comparator import LCSComparator

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


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    """Return clean { "error": ... } JSON format matching the API contract."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail},
    )


def process_signature_pipeline(
    image_bytes: bytes,
    threshold: int = 128,
    working_resolution: int = 64,
    block_size: int = 4,
    ink_ratio: float = 0.10,
    quantization_levels: int = 16,
) -> dict:
    """Execute Stages 2, 3, 4, 5 of the pipeline on a single signature."""
    # Stage 2: Image to Binary Matrix (64x64)
    img_converter = ImageToMatrixConverter(
        threshold=threshold,
        working_resolution=working_resolution,
    )
    binary_matrix = img_converter.convert(image_bytes)

    # Stage 3: Sub-Block Matrix Compression (16x16)
    compressor = MatrixCompressor(
        block_size=block_size,
        ink_ratio=ink_ratio,
    )
    compressed_matrix = compressor.compress(binary_matrix)

    # Stage 4: Row/Column Density Profiling
    rc_converter = MatrixToRowColConverter(size=len(compressed_matrix))
    row_density, col_density = rc_converter.convert(compressed_matrix)

    # Stage 5: Final Hex Fingerprint String (16 chars)
    rc_compressor = RowColCompressor(quantization_levels=quantization_levels)
    fingerprint_string = rc_compressor.compress(row_density, col_density)

    return {
        "binary_matrix": binary_matrix,
        "compressed_matrix": compressed_matrix,
        "row_density": row_density,
        "col_density": col_density,
        "fingerprint_string": fingerprint_string,
    }


@app.get("/")
@app.get("/api/health")
async def health_check():
    """Health check endpoint for server ping and status discovery."""
    return {
        "status": "ok",
        "service": "SignaLCS Verification API",
        "version": "0.1.0",
        "active_stages": [
            "Stage 1: Acquisition",
            "Stage 2: ImageToMatrixConverter (64x64)",
            "Stage 3: MatrixCompressor (16x16)",
            "Stage 4: MatrixToRowColConverter (Projections)",
            "Stage 5: RowColCompressor (Hex Fingerprint)",
            "Stage 6: LCSComparator (DP Table & Traceback)",
        ],
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
    match_threshold_pct: Optional[float] = Form(60.0),
):
    """Compare two signature files through the 6-stage verification pipeline."""
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

    # Execute Stages 2, 3, 4, 5 on both signatures
    try:
        sig_a_data = process_signature_pipeline(
            bytes_a,
            threshold=threshold,
            working_resolution=working_resolution,
            block_size=block_size,
            ink_ratio=ink_ratio,
            quantization_levels=quantization_levels,
        )
        sig_b_data = process_signature_pipeline(
            bytes_b,
            threshold=threshold,
            working_resolution=working_resolution,
            block_size=block_size,
            ink_ratio=ink_ratio,
            quantization_levels=quantization_levels,
        )
    except Exception as e:
        logger.error("Pipeline execution error: %s", e)
        raise HTTPException(status_code=422, detail=f"Invalid image format or corrupt file: {str(e)}")

    # Execute Stage 6: Dynamic Programming LCS Comparison
    comparator = LCSComparator(match_threshold_pct=match_threshold_pct)
    comparison_data = comparator.compare(
        sig_a_data["fingerprint_string"],
        sig_b_data["fingerprint_string"],
    )

    # Assemble complete frozen contract response
    response_payload = {
        "signature_a": sig_a_data,
        "signature_b": sig_b_data,
        "comparison": comparison_data,
        "params_used": {
            "threshold": threshold,
            "block_size": block_size,
            "ink_ratio": ink_ratio,
            "quantization_levels": quantization_levels,
            "working_resolution": working_resolution,
            "match_threshold_pct": match_threshold_pct,
        },
    }

    logger.info(
        "Processed Stages 1-6 for '%s' (FP: %s) and '%s' (FP: %s) -> LCS: %d (%s%% - %s)",
        signature_a.filename,
        sig_a_data["fingerprint_string"],
        signature_b.filename,
        sig_b_data["fingerprint_string"],
        comparison_data["lcs_length"],
        comparison_data["similarity_percent"],
        comparison_data["verdict"],
    )

    return JSONResponse(content=response_payload)
