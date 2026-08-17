import React, { useState } from 'react';
import StageCard from './StageCard';
import {
  GitCompare,
  CheckCircle2,
  XCircle,
  Route,
  Table,
  Info,
} from 'lucide-react';

// Color map for DP values (0..16)
function getDpHeatmapColor(val, maxVal = 16) {
  if (val === 0) return { bg: 'rgba(15, 23, 42, 0.6)', text: '#475569' };
  const ratio = Math.min(val / maxVal, 1);
  // Scale from deep blue/indigo (ratio 0.1) to vibrant cyan/emerald (ratio 1.0)
  if (ratio < 0.3) {
    return { bg: `rgba(30, 58, 138, ${0.4 + ratio * 0.5})`, text: '#93c5fd' };
  } else if (ratio < 0.7) {
    return { bg: `rgba(99, 102, 241, ${0.4 + ratio * 0.5})`, text: '#c7d2fe' };
  } else {
    return { bg: `rgba(16, 185, 129, ${0.4 + ratio * 0.6})`, text: '#ffffff' };
  }
}

function LCSDiffView({ stringA, stringB, lcsString, tracebackPath }) {
  if (!stringA || !stringB) return null;

  // Identify which indices in stringA and stringB were matched in the LCS traceback
  const matchedIdxA = new Set();
  const matchedIdxB = new Set();

  if (tracebackPath && tracebackPath.length > 0) {
    // Traceback path contains coordinate pairs [r, c] from DP table (1..16)
    // When a match occurs, r and c decrease together: r and c corresponding to string indices r-1 and c-1
    for (let i = 1; i < tracebackPath.length; i++) {
      const prev = tracebackPath[i - 1];
      const curr = tracebackPath[i];
      if (curr[0] === prev[0] + 1 && curr[1] === prev[1] + 1) {
        if (stringA[prev[0]] === stringB[prev[1]]) {
          matchedIdxA.add(prev[0]);
          matchedIdxB.add(prev[1]);
        }
      }
    }
  }

  return (
    <div className="lcs-diff-container">
      <div className="diff-header-row">
        <span className="diff-title">
          Biometric Fingerprint Subsequence Alignment {lcsString && `(LCS: "${lcsString}")`}
        </span>
        <span className="diff-legend">
          <span className="legend-dot matched"></span> Matched Subsequence Character
          <span className="legend-dot unmatched" style={{ marginLeft: '1rem' }}></span> Mutation / Variant
        </span>
      </div>

      <div className="diff-alignment-box">
        {/* Signature A String Row */}
        <div className="diff-string-row">
          <span className="diff-sig-tag sig-a">Sig A:</span>
          <div className="diff-chars-array">
            {stringA.split('').map((char, idx) => {
              const isMatch = matchedIdxA.has(idx);
              return (
                <div
                  key={idx}
                  className={`diff-char-box ${isMatch ? 'lcs-matched' : 'lcs-unmatched'}`}
                  title={`Signature A [${idx}]: '${char}' ${isMatch ? '(LCS Matched)' : '(Skipped)'}`}
                >
                  <span className="char">{char}</span>
                  <span className="idx">{idx}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Connectors / Match Indicators */}
        <div className="diff-connectors-row">
          <span className="diff-sig-spacer"></span>
          <div className="diff-chars-array">
            {Array.from({ length: 16 }, (_, idx) => {
              const isMatchA = matchedIdxA.has(idx);
              const isMatchB = matchedIdxB.has(idx);
              const isDirectMatch = isMatchA && isMatchB && stringA[idx] === stringB[idx];

              return (
                <div key={idx} className="connector-slot">
                  {isDirectMatch ? (
                    <div className="match-vertical-bar" title="Exact positional match" />
                  ) : isMatchA || isMatchB ? (
                    <div className="subsequence-dot" title="Subsequence match" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Signature B String Row */}
        <div className="diff-string-row">
          <span className="diff-sig-tag sig-b">Sig B:</span>
          <div className="diff-chars-array">
            {stringB.split('').map((char, idx) => {
              const isMatch = matchedIdxB.has(idx);
              return (
                <div
                  key={idx}
                  className={`diff-char-box ${isMatch ? 'lcs-matched' : 'lcs-unmatched'}`}
                  title={`Signature B [${idx}]: '${char}' ${isMatch ? '(LCS Matched)' : '(Skipped)'}`}
                >
                  <span className="char">{char}</span>
                  <span className="idx">{idx}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DpTableMatrix({
  dpTable,
  tracebackPath,
  stringA,
  stringB,
  showTraceOnly,
}) {
  const [hoveredCell, setHoveredCell] = useState(null);

  if (!dpTable || !dpTable.length) return null;

  // Build a lookup set for fast traceback path checking
  const tracebackSet = new Set(
    (tracebackPath || []).map(([r, c]) => `${r},${c}`)
  );

  const maxLcs = dpTable[dpTable.length - 1]?.[dpTable[0].length - 1] || 16;

  return (
    <div className="dp-matrix-container">
      <div className="dp-matrix-header">
        <div className="dp-header-left">
          <Table size={16} color="var(--accent-cyan)" />
          <span>17 × 17 Dynamic Programming Cost Matrix (DP Table)</span>
        </div>
        <div className="dp-header-right">
          <span className="tb-pill">
            <Route size={12} />
            Traceback Path: {(tracebackPath || []).length} Nodes
          </span>
        </div>
      </div>

      <div className="dp-scroll-wrapper">
        <table className="dp-table-grid">
          <thead>
            <tr>
              <th className="corner-th">
                <span className="label-dim">A \ B</span>
              </th>
              <th className="char-th">Ø</th>
              {stringB.split('').map((char, c) => (
                <th key={c} className="char-th" title={`Sig B [${c}] = '${char}'`}>
                  <div className="th-char">{char}</div>
                  <div className="th-idx">{c}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dpTable.map((row, r) => {
              const charA = r === 0 ? 'Ø' : stringA[r - 1];

              return (
                <tr key={r}>
                  {/* Row Header (Char from stringA) */}
                  <th className="char-th row-th" title={r === 0 ? 'Empty base string' : `Sig A [${r - 1}] = '${charA}'`}>
                    <div className="th-char">{charA}</div>
                    {r > 0 && <div className="th-idx">{r - 1}</div>}
                  </th>

                  {/* DP Cells */}
                  {row.map((val, c) => {
                    const isTraceback = tracebackSet.has(`${r},${c}`);
                    const { bg, text } = getDpHeatmapColor(val, maxLcs);
                    const charB = c === 0 ? 'Ø' : stringB[c - 1];
                    const isMatch = r > 0 && c > 0 && charA === charB;

                    return (
                      <td
                        key={c}
                        className={`dp-cell ${isTraceback ? 'is-traceback' : ''} ${isMatch ? 'is-match-cell' : ''}`}
                        style={{
                          backgroundColor: showTraceOnly
                            ? isTraceback
                              ? 'rgba(99, 102, 241, 0.45)'
                              : 'rgba(15, 23, 42, 0.4)'
                            : bg,
                          color: isTraceback ? '#ffffff' : text,
                        }}
                        onMouseEnter={() =>
                          setHoveredCell({
                            r,
                            c,
                            val,
                            charA: r === 0 ? 'Ø' : charA,
                            charB: c === 0 ? 'Ø' : charB,
                            isMatch,
                            isTraceback,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <span className="dp-val">{val}</span>
                        {isTraceback && <span className="trace-dot" />}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Hover Tooltip / Recurrence Explainer */}
      {hoveredCell && (
        <div className="dp-cell-inspector">
          <div className="inspector-left">
            <span className="coord-badge">
              DP[{hoveredCell.r}][{hoveredCell.c}] = {hoveredCell.val}
            </span>
            <span className="chars-badge">
              SigA[{hoveredCell.r === 0 ? 'Ø' : hoveredCell.r - 1}]: &lsquo;{hoveredCell.charA}&rsquo; vs SigB[{hoveredCell.c === 0 ? 'Ø' : hoveredCell.c - 1}]: &lsquo;{hoveredCell.charB}&rsquo;
            </span>
          </div>

          <div className="inspector-right">
            {hoveredCell.r === 0 || hoveredCell.c === 0 ? (
              <span className="rule-desc">Base Case: DP = 0</span>
            ) : hoveredCell.isMatch ? (
              <span className="rule-desc match">
                Match Found: DP[i-1][j-1] + 1 = {hoveredCell.val}
              </span>
            ) : (
              <span className="rule-desc max">
                No Match: max(DP[i-1][j], DP[i][j-1]) = {hoveredCell.val}
              </span>
            )}
            {hoveredCell.isTraceback && (
              <span className="traceback-badge">Optimal Traceback Node</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Stage6LCSComparison({
  response,
  isOpen,
  onToggle,
}) {
  const [showTraceOnly, setShowTraceOnly] = useState(false);

  const stringA = response?.signature_a?.fingerprint_string || '';
  const stringB = response?.signature_b?.fingerprint_string || '';
  const comparison = response?.comparison || null;

  const isCompleted = Boolean(comparison && stringA && stringB);

  const lcsLength = comparison?.lcs_length ?? 0;
  const lcsString = comparison?.lcs_string ?? '';
  const similarityPct = comparison?.similarity_percent ?? 0;
  const verdict = comparison?.verdict || (similarityPct >= 60 ? 'likely match' : 'likely mismatch');
  const isMatch = verdict.toLowerCase().includes('match') && !verdict.toLowerCase().includes('mismatch') && !verdict.toLowerCase().includes('different');

  const dpTable = comparison?.dp_table || null;
  const tracebackPath = comparison?.traceback_path || [];

  return (
    <StageCard
      stageNumber={6}
      title="Stage 6: LCS Comparison & Verdict"
      subtitle="Dynamic Programming Longest Common Subsequence aligns both 16-character strings to produce a similarity score."
      icon={GitCompare}
      badge="LCS & DP Matrix"
      rule="DP[i][j] = DP[i-1][j-1]+1 if s1[i-1]==s2[j-1] else max(DP[i-1][j], DP[i][j-1])"
      isCompleted={isCompleted}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="stage-toolbar">
        <div className="toolbar-info">
          <Info size={14} />
          <span>Optimal Subsequence Length: {lcsLength} / 16. The traceback path indicates the longest alignment route across both strings.</span>
        </div>

        <div className="toolbar-actions">
          <button
            type="button"
            className={`pill-btn ${showTraceOnly ? 'active' : ''}`}
            onClick={() => setShowTraceOnly(!showTraceOnly)}
          >
            <Route size={13} />
            <span>{showTraceOnly ? 'Show Full Heatmap' : 'Focus Traceback Path'}</span>
          </button>
        </div>
      </div>

      {/* Hero Summary & Verdict Banner */}
      <div className={`lcs-verdict-hero ${isMatch ? 'verdict-match' : 'verdict-diff'}`}>
        <div className="verdict-main-score">
          <div className="score-ring">
            <span className="score-pct">{similarityPct}%</span>
            <span className="score-label">Similarity</span>
          </div>

          <div className="verdict-details">
            <div className="verdict-badge-row">
              <span className={`verdict-pill ${isMatch ? 'match' : 'diff'}`}>
                {isMatch ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                <span>{verdict.toUpperCase()}</span>
              </span>
              <span className="lcs-length-pill">
                LCS Length: <strong>{lcsLength}</strong> / 16
              </span>
            </div>

            <div className="lcs-extracted-string">
              <span className="lbl">Extracted Common Subsequence:</span>
              <code className="lcs-str">&ldquo;{lcsString}&rdquo;</code>
            </div>
          </div>
        </div>

        <div className="verdict-metrics-side">
          <div className="side-metric">
            <span className="sm-label">String A Length:</span>
            <span className="sm-val">{stringA.length} Chars</span>
          </div>
          <div className="side-metric">
            <span className="sm-label">String B Length:</span>
            <span className="sm-val">{stringB.length} Chars</span>
          </div>
          <div className="side-metric">
            <span className="sm-label">Matching Ratio:</span>
            <span className="sm-val highlight">
              {lcsLength} / 16 ({(similarityPct).toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Subsequence Diff Alignment View */}
      <LCSDiffView
        stringA={stringA}
        stringB={stringB}
        lcsString={lcsString}
        tracebackPath={tracebackPath}
      />

      {/* 17x17 DP Table Matrix */}
      <DpTableMatrix
        dpTable={dpTable}
        tracebackPath={tracebackPath}
        stringA={stringA}
        stringB={stringB}
        showTraceOnly={showTraceOnly}
      />
    </StageCard>
  );
}
