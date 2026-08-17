import React, { useState, useRef, useEffect, useCallback } from 'react';
import StageCard from './StageCard';
import { Grid, FileCode, ZoomIn, ZoomOut, Hash, Percent, Info } from 'lucide-react';

function BinaryMatrixCanvas({ matrix, zoom = 3, onHoverPixel }) {
  const canvasRef = useRef(null);

  const drawMatrix = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matrix || !matrix.length) return;

    const ctx = canvas.getContext('2d');
    const rows = matrix.length;
    const cols = matrix[0].length;
    const cellSize = zoom;

    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    // Background fill
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
      const rowStr = matrix[r];
      for (let c = 0; c < cols; c++) {
        const isInk = rowStr[c] === '1';
        if (isInk) {
          // Ink pixel: Cyan / Indigo glowing ink
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        } else {
          // Background subtle dot / cell
          if (cellSize >= 4) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(c * cellSize, r * cellSize, 1, 1);
          }
        }
      }
    }
  }, [matrix, zoom]);

  useEffect(() => {
    drawMatrix();
  }, [drawMatrix]);

  const handleMouseMove = (e) => {
    if (!onHoverPixel || !matrix || !matrix.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const pixelX = Math.floor((x * scaleX) / zoom);
    const pixelY = Math.floor((y * scaleY) / zoom);

    if (pixelX >= 0 && pixelX < 64 && pixelY >= 0 && pixelY < 64) {
      const val = matrix[pixelY] ? matrix[pixelY][pixelX] : '0';
      onHoverPixel({ x: pixelX, y: pixelY, value: val });
    }
  };

  const handleMouseLeave = () => {
    if (onHoverPixel) onHoverPixel(null);
  };

  return (
    <div className="canvas-matrix-wrapper">
      <canvas
        ref={canvasRef}
        className="pixel-canvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}

function SingleBinaryViewer({
  label,
  signatureKey,
  matrix,
  viewMode,
  zoom,
  hoveredPixel,
  setHoveredPixel,
}) {
  if (!matrix || !matrix.length) {
    return (
      <div className="stage-column-card">
        <div className="stage-column-header">
          <div className="sig-badge-label">
            <span className={`tag-badge ${signatureKey === 'b' ? 'sig-b' : ''}`}>
              {signatureKey.toUpperCase()}
            </span>
            <h4>{label}</h4>
          </div>
        </div>
        <div className="no-data-notice">
          <span>Run comparison to generate 64×64 binary matrix</span>
        </div>
      </div>
    );
  }

  // Calculate statistics
  let totalInk = 0;
  const totalCells = matrix.length * (matrix[0]?.length || 0);
  matrix.forEach((row) => {
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '1') totalInk++;
    }
  });
  const inkDensity = ((totalInk / totalCells) * 100).toFixed(2);

  return (
    <div className="stage-column-card">
      <div className="stage-column-header">
        <div className="sig-badge-label">
          <span className={`tag-badge ${signatureKey === 'b' ? 'sig-b' : ''}`}>
            {signatureKey.toUpperCase()}
          </span>
          <h4>{label}</h4>
        </div>
        <span className="dimension-badge">64 × 64 (4,096 cells)</span>
      </div>

      <div className="matrix-viewport">
        {viewMode === 'grid' ? (
          <div className="matrix-canvas-container">
            <BinaryMatrixCanvas
              matrix={matrix}
              zoom={zoom}
              onHoverPixel={setHoveredPixel}
            />

            {hoveredPixel && (
              <div className="pixel-inspector-badge">
                <span className="coord">
                  X: {hoveredPixel.x}, Y: {hoveredPixel.y}
                </span>
                <span className={`val ${hoveredPixel.value === '1' ? 'ink' : 'bg'}`}>
                  {hoveredPixel.value === '1' ? 'Ink (1)' : 'Background (0)'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="matrix-raw-text-view">
            <pre className="raw-binary-mono">
              {matrix.map((row, idx) => (
                <div key={idx} className="binary-row-line">
                  <span className="row-num">{String(idx).padStart(2, '0')}:</span>
                  <span className="row-chars">{row}</span>
                </div>
              ))}
            </pre>
          </div>
        )}
      </div>

      <div className="stage-metrics-row">
        <div className="metric-chip" title="Count of black/ink pixels">
          <Hash size={13} />
          <span>Ink Pixels:</span>
          <strong>{totalInk}</strong>
        </div>
        <div className="metric-chip" title="Percentage of active ink coverage">
          <Percent size={13} />
          <span>Density:</span>
          <strong>{inkDensity}%</strong>
        </div>
      </div>
    </div>
  );
}

export default function Stage2BinaryMatrix({
  response,
  isOpen,
  onToggle,
}) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'text'
  const [zoom, setZoom] = useState(3);
  const [hoveredPixelA, setHoveredPixelA] = useState(null);
  const [hoveredPixelB, setHoveredPixelB] = useState(null);

  const matrixA = response?.signature_a?.binary_matrix || null;
  const matrixB = response?.signature_b?.binary_matrix || null;
  const isCompleted = Boolean(matrixA && matrixB);
  const threshold = response?.params_used?.threshold ?? 128;

  return (
    <StageCard
      stageNumber={2}
      title="Stage 2: Image to Binary Matrix"
      subtitle="Binarization of 64×64 normalized grayscale into binary ink (1) and background (0) bit matrices."
      icon={Grid}
      badge="64×64 Matrix"
      rule={`Pixel Luminance < T (${threshold}) → '1' (Ink), else '0' (Background)`}
      isCompleted={isCompleted}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="stage-toolbar">
        <div className="toolbar-info">
          <Info size={14} />
          <span>Each pixel is quantized to 1 bit based on threshold T={threshold}. Hover over canvas to inspect pixel coordinates.</span>
        </div>

        <div className="toolbar-actions">
          {viewMode === 'grid' && (
            <div className="zoom-controls">
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setZoom(Math.max(2, zoom - 1))}
                disabled={zoom <= 2}
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <span className="zoom-level">{zoom}x</span>
              <button
                type="button"
                className="zoom-btn"
                onClick={() => setZoom(Math.min(5, zoom + 1))}
                disabled={zoom >= 5}
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
            </div>
          )}

          <div className="view-toggle-pills">
            <button
              type="button"
              className={`pill-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={13} />
              <span>Pixel Grid</span>
            </button>
            <button
              type="button"
              className={`pill-btn ${viewMode === 'text' ? 'active' : ''}`}
              onClick={() => setViewMode('text')}
            >
              <FileCode size={13} />
              <span>View as Text</span>
            </button>
          </div>
        </div>
      </div>

      <div className="stage-comparison-grid">
        <SingleBinaryViewer
          label="Signature A (Reference)"
          signatureKey="a"
          matrix={matrixA}
          viewMode={viewMode}
          zoom={zoom}
          hoveredPixel={hoveredPixelA}
          setHoveredPixel={setHoveredPixelA}
        />

        <SingleBinaryViewer
          label="Signature B (Questioned)"
          signatureKey="b"
          matrix={matrixB}
          viewMode={viewMode}
          zoom={zoom}
          hoveredPixel={hoveredPixelB}
          setHoveredPixel={setHoveredPixelB}
        />
      </div>
    </StageCard>
  );
}
