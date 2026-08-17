# SignaLCS — Offline Handwritten Signature Verification Pipeline Visualizer

An end-to-end full-stack pipeline and interactive visualizer for offline handwritten signature matching using **Longest Common Subsequence (LCS) Dynamic Programming alignment** and **Levenshtein distance metrics**.

---

## 🌟 Key Features

- **6-Stage Spatial & Mathematical Pipeline**:
  - **Stage 1 (Acquisition)**: Dual file drag-and-drop / upload zone with instant image preview.
  - **Stage 2 (Binarization)**: Grayscale $64 \times 64$ normalization and pixel thresholding with interactive text/grid toggle.
  - **Stage 3 (Compression)**: $4 \times 4$ sub-block density compression from $64 \times 64 \rightarrow 16 \times 16$.
  - **Stage 4 (Profiling)**: Interactive SVG bar charts showing horizontal row and vertical column ink density projections with hover inspectors.
  - **Stage 5 (Fingerprinting)**: 16-character biometric hex string generation with intensity heatmap swatches.
  - **Stage 6 (LCS & DP Alignment)**: Full $17 \times 17$ Dynamic Programming cost matrix heatmap, interactive cell recurrence inspector, optimal traceback path focus mode, and verdict badge (`Likely Match` / `Likely Different`).
- **Levenshtein Distance Extension**: Side-by-side edit distance comparison ($D[i,j] = \min(\text{insert}, \text{delete}, \text{substitute})$).
- **Interactive Hyperparameter Tuning**: Real-time slider controls for threshold $T$, block size $B$, ink ratio $R$, quantization bins $Q$, canvas resolution $N$, and verdict cutoff percentage.
- **Dual Operating Modes**:
  - **Live API Mode**: Seamlessly communicates via `multipart/form-data` with the FastAPI server.
  - **Mock Data Mode**: Built-in contract fallback for instant offline demonstrations.
- **Guided Walkthrough & Sample Presets**: One-click loading of authentic case study signature pairs, forged variations, and identical tests.

---

## 🚀 Quickstart Guide

### 1. Run Backend Server (FastAPI)

```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Start backend server on http://127.0.0.1:8000
uvicorn backend.api:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Run Frontend Application (React + Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite development server on http://localhost:5173
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing

### Backend Unit & Integration Tests (pytest)
```bash
pytest -v
```

### Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 📁 Repository Structure

```
.
├── backend/
│   ├── pipeline/
│   │   ├── image_to_matrix.py       # Stage 2: 64x64 Binarization & SVG Rasterizer
│   │   ├── matrix_compressor.py     # Stage 3: 16x16 Sub-Block Compressor
│   │   ├── row_col_converter.py     # Stage 4: Projection Profiling
│   │   ├── row_col_compressor.py    # Stage 5: Hex Fingerprint Compressor
│   │   ├── lcs_comparator.py        # Stage 6: DP LCS Alignment & Traceback
│   │   └── levenshtein_comparator.py# Extension: Levenshtein Distance
│   ├── tests/                       # 35+ Unit & Integration Test Cases
│   ├── api.py                       # FastAPI Application & Endpoints
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # App Navbar, Mode Toggle & Health Indicator
│   │   │   ├── UploadZone.jsx       # Dual Image Upload & Drop Zones
│   │   │   ├── ParamsPanel.jsx      # Hyperparameters Panel
│   │   │   ├── PipelineStepper.jsx  # 6-Stage Stepper Master Controller
│   │   │   ├── WalkthroughGuide.jsx # Interactive Algorithmic Guide Modal
│   │   │   ├── SamplePresetsModal.jsx # Preset Signatures Selector
│   │   │   └── stages/              # Specialized Stage Visualizers (Stages 1-6)
│   │   ├── services/api.js          # API Service Client with Mock Fallback
│   │   ├── constants/params.js      # Parameter Definitions & Defaults
│   │   └── index.css                # Polished Design System (Dark/Cyan/Emerald)
│   ├── public/                      # Static Assets & Sample Signatures
│   └── vite.config.js
│
└── Docs/                            # Project Specification & PRD Docs
```