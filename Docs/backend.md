# Backend Plan — Signature Verification Pipeline
**Owner:** Backend Engineer
**Total time budget:** 12 hours
**Goal:** Implement the 6-stage pipeline as modular classes, expose it via one API endpoint that returns every intermediate stage (not just the final score), and validate against the case study's reference sample.

> Frontend does not need to wait for you — hand them the API contract in Phase 1 so they can build against mock JSON immediately. Sync with frontend at the end of Phase 6 and Phase 8.

---

## Phase 0 — Setup (0:00–0:30 | 30 min)
- Init project (Python, e.g. FastAPI or Flask).
- Install: Pillow, numpy (optional), python-multipart (for file upload), CORS middleware.
- Create folder structure:
  ```
  /backend
    /pipeline
      image_to_matrix.py
      matrix_compressor.py
      row_col_converter.py
      row_col_compressor.py
      lcs_comparator.py
    /tests
    api.py
  ```
- **Deliverable:** empty scaffolded project, server runs and returns `200` on a health-check route.

---

## Phase 1 — Freeze the API Contract (0:30–1:00 | 30 min)
Before writing pipeline logic, lock the request/response JSON shape and share it with frontend verbatim (this unblocks them immediately).

**Endpoint:** `POST /api/compare-signatures`
**Request:** `multipart/form-data`
- `signature_a`, `signature_b`: image files
- `threshold` (default 128), `block_size` (default 4), `ink_ratio` (default 0.10), `quantization_levels` (default 16), `working_resolution` (default 64) — all optional

**Response:**
```json
{
  "signature_a": {
    "binary_matrix": ["0000...", "..."],
    "compressed_matrix": ["0010...", "..."],
    "row_density": [0,1,3,"...16 ints"],
    "col_density": [2,0,1,"...16 ints"],
    "fingerprint_string": "015AF87025978753"
  },
  "signature_b": { "...same shape..." },
  "comparison": {
    "lcs_length": 11,
    "lcs_string": "15F025978",
    "similarity_percent": 68.75,
    "dp_table": [[0,0,"..."],["..."]],
    "traceback_path": [[0,0],[1,1],"..."],
    "verdict": "likely match"
  },
  "params_used": { "threshold": 128, "block_size": 4, "ink_ratio": 0.10, "quantization_levels": 16 }
}
```
Error response: `{ "error": "message" }` with appropriate 4xx status.

- **Deliverable:** this contract pasted into a shared doc/Slack; frontend starts mocking it immediately.

---

## Phase 2 — Stage 2: `ImageToMatrixConverter` (1:00–2:00 | 1h)
- Input: image file, `threshold`, `working_resolution`.
- Steps: open with PIL → `.convert('L')` (grayscale) → `.resize((64,64))` → per-pixel threshold → `'1'`/`'0'` matrix.
- Output: 64×64 list of strings (or 2D array).
- **Deliverable:** unit test — run on the case study's sample image (or any test image), print the 64×64 matrix, sanity-check ink appears where expected.

---

## Phase 3 — Stage 3: `MatrixCompressor` (2:00–3:00 | 1h)
- Input: 64×64 binary matrix, `block_size` (4), `ink_ratio` (0.10).
- Steps: split into non-overlapping 4×4 blocks → block is `'1'` if ≥10% of its pixels are ink, else `'0'`.
- Output: 16×16 matrix.
- **Deliverable:** unit test comparing output shape/values against the worked example in the case study (Section 6.2 sample compressed matrix).

---

## Phase 4 — Stage 4: `MatrixToRowColConverter` (3:00–4:00 | 1h)
- Input: 16×16 compressed matrix.
- Output: `row_density` (16 ints — ink count per row), `col_density` (16 ints — ink count per column).
- **Deliverable:** unit test with a hand-computed small matrix to confirm sums are correct per axis.

---

## Phase 5 — Stage 5: `RowColCompressor` (4:00–5:30 | 1.5h)
- Input: `row_density`, `col_density` (16 values each), `quantization_levels` (16).
- Steps:
  - Bucket row array into 8 groups → average each → 8 values.
  - Bucket col array into 8 groups → average each → 8 values.
  - Concatenate → 16 averages.
  - Quantize each average into 0–15 relative to max observed value → map to hex char (`0-9A-F`) via `string.hexdigits` or manual map.
- Output: 16-character string.
- **Deliverable:** run full Stage 2→5 chain on the case study's reference sample image and confirm output equals `015AF87025978753` (Section 9.6). This is your correctness gate — do not proceed until this matches or you understand why it differs.

---

## Phase 6 — Stage 6: `LCSComparator` (5:30–7:30 | 2h)
- Input: two 16-char strings.
- Steps:
  - Build 17×17 DP table: `dp[i][j] = dp[i-1][j-1]+1` if chars match, else `max(dp[i-1][j], dp[i][j-1])`.
  - Traceback from `dp[16][16]` to reconstruct the LCS string and the traceback path (list of `[i,j]` cells visited).
  - `similarity_percent = (lcs_length / 16) * 100`.
  - `verdict`: e.g. `"likely match"` if similarity ≥ 60%, else `"likely different"` (make threshold configurable/constant for now).
- Output: `lcs_length`, `lcs_string`, `dp_table`, `traceback_path`, `similarity_percent`, `verdict`.
- **Deliverable:** unit test using the case study's worked LCS example (`ABCBDAB` vs `BDCABA` → LCS `BCBA`, length 4) to validate the DP/traceback logic independent of the image pipeline.
- **Sync point with frontend:** share a real sample response JSON now so they can swap mocks for real shape.

---

## Phase 7 — Wire Up the API Endpoint (7:30–9:00 | 1.5h)
- Implement `POST /api/compare-signatures`:
  - Parse multipart upload + params (apply defaults).
  - Run both images through Stages 2–5 independently.
  - Run Stage 6 on the two resulting strings.
  - Assemble and return the full JSON per the Phase 1 contract.
- Add CORS middleware allowing the frontend's dev origin.
- Add basic input validation (missing file, non-image file, oversized file) → return clean 4xx errors, not stack traces.
- **Deliverable:** endpoint testable via curl/Postman with two real signature images, returns full valid JSON.

---

## Phase 8 — Testing & Validation (9:00–10:00 | 1h)
- Confirm the reference sample image still produces `015AF87025978753` through the live endpoint (not just the unit test).
- Test with two different images and two near-identical images — confirm similarity scores behave sensibly (high vs. low).
- Test edge cases: identical images, very sparse/blank image, corrupt file upload.
- **Sync point with frontend:** do a live integration pass together — point their app at your running server, fix any shape mismatches immediately.

---

## Phase 9 — Error Handling, Docs, Run Instructions (10:00–11:00 | 1h)
- Ensure every failure mode returns `{ "error": "..." }` with a sensible status code, never a 500 with a raw traceback.
- Write a short `README.md`: how to run the server, how to hit the endpoint, env vars/ports.
- Make all pipeline parameters (`threshold`, `block_size`, `ink_ratio`, `quantization_levels`, `working_resolution`) actually configurable end-to-end from the request, not hardcoded.
- **Deliverable:** anyone can clone, `pip install`, run, and curl the endpoint successfully.

---

## Phase 10 — Buffer / Polish (11:00–12:00 | 1h)
- Fix bugs surfaced during frontend integration.
- Optional stretch (only if ahead of schedule): implement Levenshtein distance as an alternate comparator (Section 11 extension) behind a query param.
- Final smoke test with frontend end-to-end.

---

## Quick Reference: Pipeline Defaults
| Param | Default |
|---|---|
| `working_resolution` | 64 |
| `threshold` | 128 |
| `block_size` | 4 |
| `ink_ratio` | 0.10 |
| `quantization_levels` | 16 |
| similarity verdict cutoff | 60% (adjust as needed) |
