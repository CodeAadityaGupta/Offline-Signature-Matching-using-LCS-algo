# Product Requirements Document
## Signature Verification via Image-to-String Conversion + LCS Comparison

**Version:** 1.0
**Status:** Draft
**Owner:** [TBD]
**Last updated:** August 17, 2026

---

## 1. Overview

This project builds a web application that lets a user upload two handwritten
signature images and see, step by step, how each image is converted into a
16-character "fingerprint" string, and how those two strings are compared
using the Longest Common Subsequence (LCS) algorithm to produce a similarity
score.

The core educational goal (per the case study) is not just to produce a final
score, but to make every intermediate transformation **visible and
inspectable** in the UI — the 64×64 binary matrix, the 16×16 compressed
matrix, the row/column density profiles, the final 16-character string, and
the LCS dynamic-programming table/traceback.

---

## 2. Goals & Non-Goals

### 2.1 Goals
- Let a user upload two signature images and run them through the full
  pipeline.
- Visually render **every pipeline stage** in the frontend, not just the
  final similarity score.
- Make the pipeline modular on the backend (one class per stage, matching
  the case study's OOP design) so each stage's output can be independently
  returned to the frontend and displayed.
- Provide a clear, quantitative similarity score with a simple
  interpretation (e.g., "likely match" / "likely mismatch" based on a
  configurable threshold).
- Support parameter tuning (threshold, block size, ink-ratio, quantization
  levels) so users can experiment, per the "Suggested Exercises" section of
  the case study.

### 2.2 Non-Goals
- This is **not** a production-grade biometric verification system. No
  stroke dynamics, pressure data, or ML-based verification.
- No user authentication / accounts (unless later required for saving
  history).
- No mobile native app — responsive web only.

---

## 3. Users & Use Cases

| User | Use Case |
|---|---|
| Student | Upload two signatures, study the pipeline stage-by-stage to understand LCS + image compression concepts. |
| Instructor | Demo the pipeline live in class, tweak thresholds, show how similarity score changes. |
| Evaluator/Grader | Verify a student's own implementation against the reference pipeline's intermediate outputs (Section 9 of the case study). |

---

## 4. High-Level Architecture

```
┌────────────┐      ┌──────────────────────────────┐      ┌───────────┐
│  Frontend   │ ---> │  Backend API (pipeline runner) │ ---> │  Response │
│  (upload +  │ <--- │  Stage 1..6 classes            │ <--- │  (JSON w/ │
│  step-by-   │      │                                 │      │  every    │
│  step view) │      │                                 │      │  stage)   │
└────────────┘      └──────────────────────────────┘      └───────────┘
```

- **Backend**: Python service exposing one endpoint that runs the full
  pipeline and returns a single JSON payload containing **every
  intermediate artifact**, not just the final score. Optionally, one
  endpoint per stage for incremental/streamed rendering.
- **Frontend**: Single-page app that uploads two images, calls the backend,
  and renders each stage in an expandable/steppable UI as data arrives.

---

## 5. Backend Requirements

### 5.1 Pipeline Classes (mirrors case study Section 8)

| Stage | Class | Responsibility | Output shape |
|---|---|---|---|
| 2 | `ImageToMatrixConverter` | Grayscale → resize to 64×64 → binarize (threshold=128 default) | 64×64 matrix of `'0'`/`'1'` |
| 3 | `MatrixCompressor` | Divide into 4×4 blocks → ink-ratio rule (default 10%) | 16×16 matrix of `'0'`/`'1'` |
| 4 | `MatrixToRowColConverter` | Sum ink chars per row and per column | two length-16 int arrays |
| 5 | `RowColCompressor` | Bucket into 8 groups each, average, quantize to hex | 16-character string (`0-9A-F`) |
| 6 | `LCSComparator` | Classic LCS DP + traceback on the two 16-char strings | LCS length, LCS string, DP table, similarity % |

Each class must expose its output independently so the API can serialize it.

### 5.2 API Endpoint(s)

**`POST /api/compare-signatures`**

Request: `multipart/form-data` with two image files (`signature_a`,
`signature_b`) plus optional tunable params:

```json
{
  "threshold": 128,
  "block_size": 4,
  "ink_ratio": 0.10,
  "quantization_levels": 16,
  "working_resolution": 64
}
```

Response (per signature, plus final comparison):

```json
{
  "signature_a": {
    "original_image_url": "...",
    "grayscale_resized_matrix": "64x64 grid of 0-255 or thumbnail image url",
    "binary_matrix": ["0000...", "..."],         
    "compressed_matrix": ["0010...", "..."],      
    "row_density": [0,1,3,...],                   
    "col_density": [2,0,1,...],                   
    "fingerprint_string": "015AF87025978753"
  },
  "signature_b": { "...same shape..." },
  "comparison": {
    "lcs_length": 11,
    "lcs_string": "15F025978",
    "similarity_percent": 68.75,
    "dp_table": [[0,0,...], [...]],
    "traceback_path": [[0,0],[1,1],...],
    "verdict": "likely match"
  },
  "params_used": { "threshold": 128, "block_size": 4, "ink_ratio": 0.10, "quantization_levels": 16 }
}
```

### 5.3 Non-Functional
- Pipeline must run in well under 1s per signature (per case study: DP table
  is only 17×17, image ops are cheap).
- Stateless endpoint; no persistence required for v1 (can add history later).
- Image inputs: PNG/JPG, max size configurable (e.g., 10MB), reasonable
  dimension limits.
- Validate/handle malformed or non-signature images gracefully (return a
  clear error, not a crash).

---

## 6. Frontend Requirements — Step-by-Step Visualization

This is the core UX differentiator: the user should be able to see **each
stage's output for both signatures side by side**, not just the final
number.

### 6.1 Overall Layout
- **Upload zone**: two drop targets side by side, one per signature, with
  image preview after upload.
- **Params panel** (collapsible): threshold, block size, ink ratio,
  quantization levels — with sensible defaults matching the case study, and
  a "Run Comparison" button.
- **Pipeline stepper**: a horizontal/vertical stepper with 6 stages
  (Acquisition → Image→Matrix → Compression → Row/Col Profiling → Final
  String → LCS Comparison). Each step is clickable/expandable.

### 6.2 Per-Stage Visualization

| Stage | What to render |
|---|---|
| 1. Acquisition | Thumbnails of both uploaded images side by side. |
| 2. Image → Matrix | Two renderings per signature: (a) the 64×64 grayscale-resized image, (b) the binarized 64×64 matrix rendered as a black/white pixel grid (canvas or SVG), matching Figure 3/4 style. |
| 3. Matrix Compression | 16×16 compressed matrix rendered as a pixel grid (each cell colored black/white), plus optionally the raw `'0'/'1'` grid as monospace text below it, matching Figure 5. |
| 4. Row/Column Profiling | Bar chart of `row_density` (16 bars) and `col_density` (16 bars) per signature, matching Figure 6. Hovering a bar shows the exact count. |
| 5. Final 16-char String | Large monospace display of the fingerprint string per signature, with each character color-coded by its quantized intensity level (e.g., a heatmap-style swatch behind each hex digit) so users can visually see high vs. low density regions. |
| 6. LCS Comparison | (a) The two 16-char strings stacked with the LCS characters highlighted/aligned (like a diff view), (b) the DP table rendered as a 17×17 grid with the traceback path highlighted, (c) the final similarity score as a large percentage with a verdict badge ("Likely Match" / "Likely Different" based on threshold). |

### 6.3 Interaction Requirements
- Each stage should be viewable **independently** — user can jump straight
  to "Stage 5" without necessarily reading 1-4, but stages remain in order
  and each shows both signatures side-by-side for comparison.
- A "Compare Both Signatures" toggle to overlay/sync stages A and B visually
  (e.g., same block highlighted in both compressed matrices).
- Loading states per stage if using progressive/streamed rendering.
- Ability to change parameters and re-run without re-uploading images.
- Responsive: matrices/grids should scale down gracefully on smaller
  screens (min viable: horizontal scroll for grids on mobile).

### 6.4 Visual Design Notes
- Binary/compressed matrices: render as actual pixel grids (canvas or CSS
  grid), not raw text dumps — text dumps can be an optional "view as text"
  toggle for technical users, but the primary view should be visual.
- Use a consistent color scheme: ink = dark/black, background = white/light,
  DP table = a sequential heatmap, LCS-matched cells = accent highlight
  color.
- Keep the reference example from the case study (`015AF87025978753`)
  available as a "sample walkthrough" mode so users can verify their
  uploaded results against a known-correct pipeline run.

---

## 7. Functional Requirements Summary (Checklist)

- [ ] Upload two signature images (PNG/JPG)
- [ ] Configure pipeline parameters (threshold, block size, ink ratio, quantization levels)
- [ ] Run pipeline and receive full intermediate output for both signatures
- [ ] Display Stage 1: original image thumbnails
- [ ] Display Stage 2: grayscale-resized image + binarized 64×64 matrix (visual grid)
- [ ] Display Stage 3: compressed 16×16 matrix (visual grid)
- [ ] Display Stage 4: row-density and column-density bar charts
- [ ] Display Stage 5: final 16-character fingerprint string with intensity color-coding
- [ ] Display Stage 6: LCS DP table, traceback path, matched subsequence, similarity %, verdict
- [ ] Support re-running with new parameters without re-upload
- [ ] Provide a "sample walkthrough" mode using the case study's reference image/output
- [ ] Graceful error handling for invalid uploads

---

## 8. Success Metrics

- User can trace a signature from raw image to final similarity score
  without leaving the page or reading external docs.
- Pipeline output for the case study's sample image matches the documented
  reference string `015AF87025978753` (used as a correctness/regression
  test).
- Round-trip latency (upload → full result) under ~2 seconds for typical
  image sizes.

---

## 9. Milestones

| Milestone | Scope |
|---|---|
| M1 | Backend pipeline classes (Stages 2-6) + unit tests against reference sample from case study Section 9 |
| M2 | API endpoint returning full JSON payload with all intermediate stages |
| M3 | Frontend upload flow + Stage 1-2 visualization |
| M4 | Frontend Stage 3-5 visualization (compressed matrix, density charts, fingerprint string) |
| M5 | Frontend Stage 6 visualization (DP table, traceback, similarity score, verdict) |
| M6 | Parameter tuning panel + re-run flow |
| M7 | Polish: responsive layout, sample walkthrough mode, error states |

---

## 10. Open Questions

- Should results/history be persisted (e.g., for grading/comparison across
  many submissions), or is this purely stateless/ephemeral for v1?
- Should the app support batch comparison (many-to-many) for the
  "false-acceptance / false-rejection analysis" extension exercise, or is
  that out of scope for v1?
- What similarity threshold should the "verdict" badge use by default, and
  should it be configurable per deployment (e.g., different thresholds for
  demo vs. grading contexts)?

---

## 11. References

- Case study source: *Signature Verification via LCS* (see attached
  document) — Sections 5-9 define the exact pipeline stages, formulas, and
  reference sample output used for validation in this PRD.
- Cormen, Leiserson, Rivest, Stein, *Introduction to Algorithms* — LCS/DP chapter.
- Gonzalez & Woods, *Digital Image Processing*.
- Pillow (PIL Fork) documentation — https://pillow.readthedocs.io
