import React, { useState } from 'react';
import StageCard from './StageCard';
import { Minimize2, FileCode, Grid, Crosshair, Hash, Percent, Info } from 'lucide-react';

function CompressedGrid({
  matrix,
  sharedHoveredCell,
  onHoverCell,
  syncHover,
  signatureKey,
}) {
  if (!matrix || !matrix.length) return null;

  const cols = matrix[0].length; // 16

  return (
    <div className="compressed-grid-container">
      {/* Column Headers (0..15) */}
      <div className="grid-col-headers">
        <div className="corner-cell"></div>
        {Array.from({ length: cols }, (_, c) => (
          <div
            key={c}
            className={`col-header-num ${sharedHoveredCell?.col === c ? 'highlighted-axis' : ''}`}
          >
            {c}
          </div>
        ))}
      </div>

      {/* Grid Rows with Row Index (0..15) */}
      <div className="grid-matrix-rows">
        {matrix.map((rowStr, r) => (
          <div key={r} className="grid-row-wrap">
            <div className={`row-header-num ${sharedHoveredCell?.row === r ? 'highlighted-axis' : ''}`}>
              {r}
            </div>

            <div className="grid-cells-row">
              {Array.from({ length: cols }, (_, c) => {
                const isInk = rowStr[c] === '1';
                const isHovered = sharedHoveredCell?.row === r && sharedHoveredCell?.col === c;

                return (
                  <div
                    key={c}
                    className={`comp-cell ${isInk ? 'ink-1' : 'bg-0'} ${isHovered ? 'hovered-sync' : ''}`}
                    onMouseEnter={() => {
                      onHoverCell({
                        row: r,
                        col: c,
                        value: isInk ? '1' : '0',
                        sourceSig: signatureKey,
                      });
                    }}
                    onMouseLeave={() => {
                      if (!syncHover) onHoverCell(null);
                    }}
                    title={`Cell [${r}, ${c}] = ${isInk ? '1 (Ink Block)' : '0 (Background)'}`}
                  >
                    {isHovered && <div className="crosshair-marker" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SingleCompressedViewer({
  label,
  signatureKey,
  matrix,
  viewMode,
  sharedHoveredCell,
  onHoverCell,
  syncHover,
  blockSize,
  inkRatio,
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
          <span>Run comparison to generate 16×16 compressed matrix</span>
        </div>
      </div>
    );
  }

  // Calculate statistics
  let totalActive = 0;
  const totalCells = matrix.length * (matrix[0]?.length || 0);
  matrix.forEach((row) => {
    for (let i = 0; i < row.length; i++) {
      if (row[i] === '1') totalActive++;
    }
  });
  const compDensity = ((totalActive / totalCells) * 100).toFixed(1);

  return (
    <div className="stage-column-card">
      <div className="stage-column-header">
        <div className="sig-badge-label">
          <span className={`tag-badge ${signatureKey === 'b' ? 'sig-b' : ''}`}>
            {signatureKey.toUpperCase()}
          </span>
          <h4>{label}</h4>
        </div>
        <span className="dimension-badge">16 × 16 (256 cells)</span>
      </div>

      <div className="matrix-viewport">
        {viewMode === 'grid' ? (
          <div className="compressed-matrix-wrapper">
            <CompressedGrid
              matrix={matrix}
              sharedHoveredCell={sharedHoveredCell}
              onHoverCell={onHoverCell}
              syncHover={syncHover}
              signatureKey={signatureKey}
            />

            {sharedHoveredCell && (
              <div className="comp-inspector-tooltip">
                <div className="tooltip-top">
                  <span className="coord-tag">
                    Row {sharedHoveredCell.row}, Col {sharedHoveredCell.col}
                  </span>
                  <span className={`val-tag ${matrix[sharedHoveredCell.row]?.[sharedHoveredCell.col] === '1' ? 'ink' : 'bg'}`}>
                    {matrix[sharedHoveredCell.row]?.[sharedHoveredCell.col] === '1'
                      ? 'Ink Block (1)'
                      : 'Empty (0)'}
                  </span>
                </div>
                <div className="tooltip-details">
                  <span>Source 64×64 Span: [{sharedHoveredCell.row * blockSize}..{sharedHoveredCell.row * blockSize + (blockSize - 1)}, {sharedHoveredCell.col * blockSize}..{sharedHoveredCell.col * blockSize + (blockSize - 1)}]</span>
                  <span> • Cutoff: &ge; {Math.round(inkRatio * 100)}% ink</span>
                </div>
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
        <div className="metric-chip" title="Active 1-cells in 16x16 matrix">
          <Hash size={13} />
          <span>Active Cells:</span>
          <strong>{totalActive} / 256</strong>
        </div>
        <div className="metric-chip" title="Percentage of compressed matrix covered by ink">
          <Percent size={13} />
          <span>Comp. Density:</span>
          <strong>{compDensity}%</strong>
        </div>
        <div className="metric-chip" title="Data reduction factor">
          <Minimize2 size={13} />
          <span>Reduction:</span>
          <strong>16:1</strong>
        </div>
      </div>
    </div>
  );
}

export default function Stage3CompressedMatrix({
  response,
  isLoading = false,
  isOpen,
  onToggle,
}) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'text'
  const [syncHover, setSyncHover] = useState(true);
  const [sharedHoveredCell, setSharedHoveredCell] = useState(null);

  const matrixA = response?.signature_a?.compressed_matrix || null;
  const matrixB = response?.signature_b?.compressed_matrix || null;
  const isCompleted = Boolean(matrixA && matrixB);

  const blockSize = response?.params_used?.block_size ?? 4;
  const inkRatio = response?.params_used?.ink_ratio ?? 0.10;

  const handleCellHover = (cellInfo) => {
    if (!syncHover && cellInfo === null) {
      setSharedHoveredCell(null);
      return;
    }
    setSharedHoveredCell(cellInfo);
  };

  return (
    <StageCard
      stageNumber={3}
      title="Stage 3: Matrix Compression"
      subtitle="4×4 Sub-block pooling downsamples 64×64 matrix into a robust 16×16 spatial feature grid."
      icon={Minimize2}
      badge="16×16 Grid"
      rule={`Block ${blockSize}×${blockSize} Ink Ratio ≥ ${Math.round(inkRatio * 100)}% → '1', else '0'`}
      isCompleted={isCompleted}
      isLoading={isLoading}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="stage-toolbar">
        <div className="toolbar-info">
          <Info size={14} />
          <span>Each cell represents a {blockSize}×{blockSize} block ({blockSize * blockSize} pixels). A cell is marked &apos;1&apos; if ink ratio &ge; {Math.round(inkRatio * 100)}%.</span>
        </div>

        <div className="toolbar-actions">
          {viewMode === 'grid' && (
            <button
              type="button"
              className={`pill-btn ${syncHover ? 'active' : ''}`}
              onClick={() => setSyncHover(!syncHover)}
              title="Synchronize hovered cell coordinate between Signature A and Signature B"
            >
              <Crosshair size={13} />
              <span>Sync Crosshair</span>
            </button>
          )}

          <div className="view-toggle-pills">
            <button
              type="button"
              className={`pill-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={13} />
              <span>16×16 Grid</span>
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

      <div
        className="stage-comparison-grid"
        onMouseLeave={() => setSharedHoveredCell(null)}
      >
        <SingleCompressedViewer
          label="Signature A (Reference)"
          signatureKey="a"
          matrix={matrixA}
          viewMode={viewMode}
          sharedHoveredCell={sharedHoveredCell}
          onHoverCell={handleCellHover}
          syncHover={syncHover}
          blockSize={blockSize}
          inkRatio={inkRatio}
        />

        <SingleCompressedViewer
          label="Signature B (Questioned)"
          signatureKey="b"
          matrix={matrixB}
          viewMode={viewMode}
          sharedHoveredCell={sharedHoveredCell}
          onHoverCell={handleCellHover}
          syncHover={syncHover}
          blockSize={blockSize}
          inkRatio={inkRatio}
        />
      </div>
    </StageCard>
  );
}
