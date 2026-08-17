import React, { useState } from 'react';
import StageCard from './StageCard';
import { BarChart2, Table, Info, TrendingUp, Hash } from 'lucide-react';

function DensityBarChart({
  title,
  data,
  type = 'row', // 'row' | 'col'
  hoveredIndex,
  onHoverIndex,
  maxVal = 16,
}) {
  if (!data || !data.length) return null;

  const chartHeight = 110;
  const chartWidth = 260;
  const barWidth = 11;
  const gap = 4;
  const paddingLeft = 24;
  const paddingBottom = 20;

  return (
    <div className="density-chart-box">
      <div className="chart-header">
        <span className="chart-title">{title}</span>
        <span className="chart-range">Range: 0–{maxVal}</span>
      </div>

      <div className="svg-chart-container">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="density-svg"
        >
          {/* Grid lines (0, 4, 8, 12, 16) */}
          {[0, 4, 8, 12, 16].map((gridVal) => {
            const y = chartHeight - paddingBottom - (gridVal / maxVal) * (chartHeight - paddingBottom - 10);
            return (
              <g key={gridVal} className="chart-grid-line">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - 5}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="2 2"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="axis-label"
                  fill="var(--text-muted)"
                  fontSize="8"
                  fontFamily="var(--font-mono)"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* 16 Bars */}
          {data.map((val, idx) => {
            const barH = (val / maxVal) * (chartHeight - paddingBottom - 10);
            const x = paddingLeft + idx * (barWidth + gap);
            const y = chartHeight - paddingBottom - barH;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={idx}
                className="bar-group"
                onMouseEnter={() => onHoverIndex(idx)}
                onMouseLeave={() => onHoverIndex(null)}
              >
                {/* Hit target */}
                <rect
                  x={x - 2}
                  y={0}
                  width={barWidth + 4}
                  height={chartHeight - paddingBottom}
                  fill="transparent"
                  className="bar-hit-box"
                />

                {/* Visible Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barH, 1.5)}
                  rx={2}
                  className={`density-bar ${type === 'row' ? 'row-bar' : 'col-bar'} ${isHovered ? 'bar-hovered' : ''}`}
                />

                {/* X-axis Index Label (0..15) */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - 6}
                  textAnchor="middle"
                  className={`x-axis-text ${isHovered ? 'highlighted' : ''}`}
                  fill={isHovered ? 'var(--accent-cyan)' : 'var(--text-muted)'}
                  fontSize="7.5"
                  fontFamily="var(--font-mono)"
                >
                  {idx}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredIndex !== null && data[hoveredIndex] !== undefined && (
          <div className="chart-tooltip">
            <span className="tooltip-idx">
              {type === 'row' ? 'Row' : 'Col'} {hoveredIndex}:
            </span>
            <strong className="tooltip-val">{data[hoveredIndex]} ink cells</strong>
            <span className="tooltip-pct">
              ({((data[hoveredIndex] / maxVal) * 100).toFixed(0)}% max)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function SingleProfilingViewer({
  label,
  signatureKey,
  rowDensity,
  colDensity,
  viewMode,
  hoveredRowIdx,
  setHoveredRowIdx,
  hoveredColIdx,
  setHoveredColIdx,
}) {
  if (!rowDensity || !colDensity) {
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
          <span>Run comparison to generate density profiles</span>
        </div>
      </div>
    );
  }

  const maxRow = Math.max(...rowDensity, 0);
  const maxCol = Math.max(...colDensity, 0);
  const totalRowSum = rowDensity.reduce((a, b) => a + b, 0);

  return (
    <div className="stage-column-card">
      <div className="stage-column-header">
        <div className="sig-badge-label">
          <span className={`tag-badge ${signatureKey === 'b' ? 'sig-b' : ''}`}>
            {signatureKey.toUpperCase()}
          </span>
          <h4>{label}</h4>
        </div>
        <span className="dimension-badge">16 Rows • 16 Cols</span>
      </div>

      <div className="profiling-viewport">
        {viewMode === 'chart' ? (
          <div className="charts-stack">
            <DensityBarChart
              title="Row Density Profile (Horizontal Projections)"
              data={rowDensity}
              type="row"
              hoveredIndex={hoveredRowIdx}
              onHoverIndex={setHoveredRowIdx}
            />

            <DensityBarChart
              title="Column Density Profile (Vertical Projections)"
              data={colDensity}
              type="col"
              hoveredIndex={hoveredColIdx}
              onHoverIndex={setHoveredColIdx}
            />
          </div>
        ) : (
          <div className="density-table-container">
            <table className="density-matrix-table">
              <thead>
                <tr>
                  <th>Idx</th>
                  <th>Row Density</th>
                  <th>Col Density</th>
                  <th>Row %</th>
                  <th>Col %</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 16 }, (_, i) => (
                  <tr key={i}>
                    <td className="idx-col">{i}</td>
                    <td className="row-val-cell">{rowDensity[i]}</td>
                    <td className="col-val-cell">{colDensity[i]}</td>
                    <td>{((rowDensity[i] / 16) * 100).toFixed(0)}%</td>
                    <td>{((colDensity[i] / 16) * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="stage-metrics-row">
        <div className="metric-chip" title="Peak ink cells in any single row">
          <TrendingUp size={13} />
          <span>Peak Row:</span>
          <strong>{maxRow} / 16</strong>
        </div>
        <div className="metric-chip" title="Peak ink cells in any single column">
          <TrendingUp size={13} />
          <span>Peak Col:</span>
          <strong>{maxCol} / 16</strong>
        </div>
        <div className="metric-chip" title="Sum of all row projections">
          <Hash size={13} />
          <span>Total Ink Sum:</span>
          <strong>{totalRowSum}</strong>
        </div>
      </div>
    </div>
  );
}

export default function Stage4Profiling({
  response,
  isOpen,
  onToggle,
}) {
  const [viewMode, setViewMode] = useState('chart'); // 'chart' | 'table'
  const [hoveredRowA, setHoveredRowA] = useState(null);
  const [hoveredColA, setHoveredColA] = useState(null);
  const [hoveredRowB, setHoveredRowB] = useState(null);
  const [hoveredColB, setHoveredColB] = useState(null);

  const rowDensityA = response?.signature_a?.row_density || null;
  const colDensityA = response?.signature_a?.col_density || null;
  const rowDensityB = response?.signature_b?.row_density || null;
  const colDensityB = response?.signature_b?.col_density || null;

  const isCompleted = Boolean(rowDensityA && colDensityA && rowDensityB && colDensityB);

  return (
    <StageCard
      stageNumber={4}
      title="Stage 4: Row/Column Density Profiling"
      subtitle="Projection histograms count ink cells along horizontal and vertical axes to capture stroke distribution."
      icon={BarChart2}
      badge="Density Profiles"
      rule="Row Density R[i] = Σ(16 cols) | Col Density C[j] = Σ(16 rows)"
      isCompleted={isCompleted}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="stage-toolbar">
        <div className="toolbar-info">
          <Info size={14} />
          <span>Horizontal (Row) and Vertical (Column) ink projections create 1D morphological profiles for each signature.</span>
        </div>

        <div className="toolbar-actions">
          <div className="view-toggle-pills">
            <button
              type="button"
              className={`pill-btn ${viewMode === 'chart' ? 'active' : ''}`}
              onClick={() => setViewMode('chart')}
            >
              <BarChart2 size={13} />
              <span>Bar Charts</span>
            </button>
            <button
              type="button"
              className={`pill-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <Table size={13} />
              <span>Numerical Table</span>
            </button>
          </div>
        </div>
      </div>

      <div className="stage-comparison-grid">
        <SingleProfilingViewer
          label="Signature A (Reference)"
          signatureKey="a"
          rowDensity={rowDensityA}
          colDensity={colDensityA}
          viewMode={viewMode}
          hoveredRowIdx={hoveredRowA}
          setHoveredRowIdx={setHoveredRowA}
          hoveredColIdx={hoveredColA}
          setHoveredColIdx={setHoveredColA}
        />

        <SingleProfilingViewer
          label="Signature B (Questioned)"
          signatureKey="b"
          rowDensity={rowDensityB}
          colDensity={colDensityB}
          viewMode={viewMode}
          hoveredRowIdx={hoveredRowB}
          setHoveredRowIdx={setHoveredRowB}
          hoveredColIdx={hoveredColB}
          setHoveredColIdx={setHoveredColB}
        />
      </div>
    </StageCard>
  );
}
