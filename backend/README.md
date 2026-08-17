# SignaLCS — Backend API & Pipeline

FastAPI backend server implementing the 6-stage Offline Handwritten Signature Verification Pipeline using Longest Common Subsequence (LCS) alignment and Levenshtein distance metrics.

---

## 1. Pipeline Stages Overview

1. **Stage 1: Acquisition** — Accepts two uploaded signature images (PNG, JPG, BMP, WEBP, SVG).
2. **Stage 2: Image to Binary Matrix (`ImageToMatrixConverter`)** — Grayscale conversion, $N \times N$ normalization (default $64 \times 64$), and intensity thresholding into `'1'` (ink) / `'0'` (background).
3. **Stage 3: Sub-Block Compression (`MatrixCompressor`)** — Partitions into non-overlapping $B \times B$ blocks (default $4 \times 4$) downsampling from $64 \times 64 \rightarrow 16 \times 16$ based on ink ratio $R$ (default $10\%$).
4. **Stage 4: Row/Column Density Profiling (`MatrixToRowColConverter`)** — Computes horizontal and vertical ink projections across the 16 rows and 16 columns.
5. **Stage 5: Biometric Fingerprint Generation (`RowColCompressor`)** — Buckets projections into 16 quantized intensity levels mapped to hexadecimal characters (`0-9A-F`), yielding a 16-character biometric string.
6. **Stage 6: Longest Common Subsequence Alignment (`LCSComparator`)** — Constructs a $17 \times 17$ Dynamic Programming score matrix, backtracks the optimal alignment path, and calculates similarity percentage:
   $$\text{Similarity (\%)} = \frac{\text{LCS Length}}{16} \times 100$$
7. **Extension: Levenshtein Distance (`LevenshteinComparator`)** — Calculates minimum edit operations (insertions, deletions, substitutions) and complementary edit similarity metric.

---

## 2. Quickstart & Installation

### Prerequisites
- Python 3.9+

### Setup
```bash
# 1. Create and activate virtual environment (optional)
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt
```

### Running the Backend Server
```bash
# Run with auto-reload on http://127.0.0.1:8000
uvicorn backend.api:app --host 127.0.0.1 --port 8000 --reload
```

Interactive OpenAPI documentation is available at:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 3. API Endpoints

### `GET /api/health`
Health check and active stages discovery.

**Example Request:**
```bash
curl -X GET http://127.0.0.1:8000/api/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "SignaLCS Verification API",
  "version": "1.0.0",
  "active_stages": [
    "Stage 1: Acquisition",
    "Stage 2: ImageToMatrixConverter (64x64)",
    "Stage 3: MatrixCompressor (16x16)",
    "Stage 4: MatrixToRowColConverter (Projections)",
    "Stage 5: RowColCompressor (Hex Fingerprint)",
    "Stage 6: LCSComparator (DP Table & Traceback)",
    "Extension: LevenshteinComparator (Edit Distance)"
  ]
}
```

---

### `POST /api/compare-signatures`
Processes two signature images through all pipeline stages.

**Request:** `multipart/form-data`
| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `signature_a` | File | Yes | — | First signature image file |
| `signature_b` | File | Yes | — | Second signature image file |
| `threshold` | Integer | No | `128` | Luminance threshold cutoff ($0-255$) |
| `block_size` | Integer | No | `4` | Compression block dimension $B \times B$ |
| `ink_ratio` | Float | No | `0.10` | Ink fraction threshold to trigger a 1-bit |
| `quantization_levels` | Integer | No | `16` | Discrete intensity quantization bins |
| `working_resolution` | Integer | No | `64` | Square canvas dimension ($N \times N$) |
| `match_threshold_pct` | Float | No | `60.0` | Minimum similarity % for match verdict |

**cURL Example:**
```bash
curl -X POST "http://127.0.0.1:8000/api/compare-signatures" \
  -F "signature_a=@sample_sig_a.png" \
  -F "signature_b=@sample_sig_b.png" \
  -F "threshold=128" \
  -F "block_size=4" \
  -F "ink_ratio=0.10" \
  -F "match_threshold_pct=60.0"
```

**Response (200 OK):**
```json
{
  "signature_a": {
    "binary_matrix": ["11100...", "...64 rows..."],
    "compressed_matrix": ["1001...", "...16 rows..."],
    "row_density": [0, 1, 3, 5, 8, 12, 10, 8, 5, 3, 1, 0, 0, 0, 0, 0],
    "col_density": [2, 0, 1, 4, 7, 11, 9, 7, 4, 2, 0, 0, 0, 0, 0, 0],
    "fingerprint_string": "015AF87025978753"
  },
  "signature_b": {
    "binary_matrix": ["11100...", "...64 rows..."],
    "compressed_matrix": ["1001...", "...16 rows..."],
    "row_density": [0, 1, 3, 5, 8, 11, 10, 8, 5, 3, 1, 0, 0, 0, 0, 0],
    "col_density": [2, 0, 1, 4, 7, 10, 9, 7, 4, 2, 0, 0, 0, 0, 0, 0],
    "fingerprint_string": "0158F87025979853"
  },
  "comparison": {
    "lcs_length": 14,
    "lcs_string": "015F8702597853",
    "similarity_percent": 87.5,
    "dp_table": [[0, 0, 0, "...17x17..."]],
    "traceback_path": [[0, 0], [1, 1], [2, 2], "..."],
    "verdict": "likely match",
    "levenshtein": {
      "distance": 2,
      "similarity_percent": 87.5,
      "verdict": "likely match",
      "operations": ["..."]
    }
  },
  "params_used": {
    "threshold": 128,
    "block_size": 4,
    "ink_ratio": 0.10,
    "quantization_levels": 16,
    "working_resolution": 64,
    "match_threshold_pct": 60.0
  }
}
```

**Error Response Format (4xx / 5xx):**
```json
{
  "error": "Both signature_a and signature_b are required."
}
```

---

## 4. Running Automated Tests

Run the complete test suite:
```bash
pytest -v
```
