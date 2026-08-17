# Frontend Plan — Signature Verification Pipeline Visualizer
**Owner:** Frontend Engineer
**Total time budget:** 12 hours
**Goal:** Build the upload flow + a 6-stage stepper UI that visualizes every intermediate pipeline artifact (matrices, density charts, fingerprint string, DP table) for both signatures side by side.

> You do not need to wait on the backend. Build against a mocked JSON response matching the contract below from hour 0, and swap in the real API once backend shares a live endpoint (~hour 6-7).

---

## Phase 0 — Setup (0:00–0:30 | 30 min)
- Init project (e.g. React/Vite, or plain HTML/CSS/JS — pick whatever's fastest for both of you to run).
- Set up basic routing/layout shell, a shared API client module (`api.js`) with a single `compareSignatures(fileA, fileB, params)` function.
- **Deliverable:** blank app runs locally, layout shell in place.

---

## Phase 1 — Mock the API Contract (0:30–1:00 | 30 min)
Use the exact contract backend is building to (get this from them / `backend.md` Phase 1). Create a `mockResponse.json` matching it, including a realistic 64×64/16×16 matrix, density arrays, fingerprint string, and DP table, so every stage has real-shaped data to render against immediately.

```json
{
  "signature_a": {
    "binary_matrix": ["...64 rows of 64 chars..."],
    "compressed_matrix": ["...16 rows of 16 chars..."],
    "row_density": [16 ints],
    "col_density": [16 ints],
    "fingerprint_string": "015AF87025978753"
  },
  "signature_b": { "...same shape..." },
  "comparison": {
    "lcs_length": 11,
    "lcs_string": "15F025978",
    "similarity_percent": 68.75,
    "dp_table": [[17x17 ints]],
    "traceback_path": [[0,0],[1,1]],
    "verdict": "likely match"
  },
  "params_used": { "threshold": 128, "block_size": 4, "ink_ratio": 0.10, "quantization_levels": 16 }
}
```
- **Deliverable:** `mockResponse.json` + a dev toggle/env flag to use mock data instead of a real fetch call.

---

## Phase 2 — Upload Flow + Params Panel (1:00–2:00 | 1h)
- Two side-by-side upload/drop zones (Signature A / Signature B) with image preview after selection.
- Collapsible params panel: `threshold`, `block_size`, `ink_ratio`, `quantization_levels`, `working_resolution` — number inputs/sliders with the defaults from the contract.
- "Run Comparison" button → calls `compareSignatures()` (mocked for now) and stores the response in app state.
- **Deliverable:** can upload two images, click run, see the raw JSON logged/stored (no visualization yet).

---

## Phase 3 — Pipeline Stepper Shell (2:00–2:30 | 30 min)
- Build the 6-step stepper component: Acquisition → Image→Matrix → Compression → Row/Col Profiling → Final String → LCS Comparison.
- Each step is expandable/clickable; layout reserves a "Signature A | Signature B" side-by-side column for every step.
- **Deliverable:** empty stepper shell with placeholders for each stage, wired to app state.

---

## Phase 4 — Stage 1 & 2 Visualization (2:30–4:00 | 1.5h)
- **Stage 1:** render the two original uploaded image thumbnails.
- **Stage 2:** render the 64×64 `binary_matrix` as an actual pixel grid (canvas or CSS grid — ink cells dark, background light), one per signature. Add a "view as text" toggle for the raw `'0'/'1'` rows.
- **Deliverable:** stages 1–2 fully visual and correct against mock data.

---

## Phase 5 — Stage 3: Compressed Matrix (4:00–5:00 | 1h)
- Render the 16×16 `compressed_matrix` the same way as Stage 2 (pixel grid), sized up so individual cells are clearly visible.
- Optional: a toggle to overlay/sync — hovering a cell in Signature A's grid highlights the same coordinate in Signature B's grid.
- **Deliverable:** Stage 3 visual, matches case study Figure 5 style.

---

## Phase 6 — Stage 4: Row/Column Density Charts (5:00–6:30 | 1.5h)
- Bar chart of `row_density` (16 bars) and a second bar chart of `col_density` (16 bars), per signature — 4 charts total on screen (or 2 combined side-by-side per signature).
- Use any lightweight charting approach (SVG bars are fine — no heavy chart library needed for 16 bars).
- Hover/tap a bar shows the exact density value.
- **Deliverable:** Stage 4 visual, matches case study Figure 6 style.
- **Sync point with backend:** by now backend should have Stage 6 done and a real sample response ready — get it and compare against your mock to catch shape mismatches early.

---

## Phase 7 — Stage 5: Fingerprint String Display (6:30–7:30 | 1h)
- Large monospace rendering of the 16-character `fingerprint_string`, one per signature.
- Color-code each character by its quantized intensity (e.g. a small heatmap swatch or background tint per character, darker = higher density level).
- **Deliverable:** Stage 5 visual complete.

---

## Phase 8 — Stage 6: LCS Comparison View (7:30–9:30 | 2h)
- **Diff view:** the two 16-char strings stacked, with LCS-matched characters highlighted/connected (simple approach: bold + accent color on matched chars in both strings).
- **DP table:** render `dp_table` (17×17) as a heatmap grid (color intensity = value), with `traceback_path` cells outlined/highlighted distinctly.
- **Result panel:** large `similarity_percent`, and a verdict badge ("Likely Match" green / "Likely Different" red, driven by `comparison.verdict`).
- **Deliverable:** Stage 6 fully visual — this is the most complex stage, budget the most time here.

---

## Phase 9 — Real API Integration (9:30–10:30 | 1h)
- Swap mock data for the real backend endpoint (`POST /api/compare-signatures`), using actual `FormData` for the two files + params.
- Handle loading states (spinner/skeletons per stage while waiting on the single response) and error states (backend returns `{ "error": "..." }` → show a clear message, don't crash).
- **Sync point with backend:** do a live end-to-end pass together, fix any mismatches.
- **Deliverable:** full app works against the real backend, not mocks.

---

## Phase 10 — Sample Walkthrough Mode + Polish (10:30–11:30 | 1h)
- Add a "Try Sample" button that loads the case study's reference image/output (fingerprint `015AF87025978753`) so users can validate the pipeline against a known-correct run without uploading their own files.
- Responsive pass: ensure matrices/grids scroll horizontally on small screens instead of breaking layout.
- Re-run flow: changing a param and re-running should not require re-uploading images (cache the two files in state).
- **Deliverable:** polished, responsive, demo-ready app.

---

## Phase 11 — Buffer (11:30–12:00 | 30 min)
- Fix whatever broke during final integration.
- Final visual QA pass on all 6 stages against both a real and mock response.

---

## Quick Reference: Stage → Visualization
| Stage | Component |
|---|---|
| 1. Acquisition | Image thumbnails |
| 2. Image → Matrix | 64×64 pixel grid (+ text toggle) |
| 3. Compression | 16×16 pixel grid |
| 4. Row/Col Profiling | 2× bar charts per signature |
| 5. Final String | Color-coded monospace 16-char string |
| 6. LCS Comparison | Diff view + DP heatmap + traceback + score/verdict |
