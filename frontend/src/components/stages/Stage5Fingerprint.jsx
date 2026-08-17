import React, { useState } from 'react';
import StageCard from './StageCard';
import { KeyRound, Copy, Check, Info, Sparkles, Gauge, Binary } from 'lucide-react';

// Map hex character '0'..'F' to color intensity gradient and background
function getHexIntensityColor(char) {
  const dec = parseInt(char, 16);
  if (isNaN(dec)) return { bg: '#1e293b', text: '#94a3b8', glow: 'none', level: 0 };

  // Interpolate from deep slate (0) -> cyan (5) -> indigo/purple (10) -> bright neon amber/rose (15)
  if (dec === 0) {
    return { bg: 'rgba(30, 41, 59, 0.6)', text: '#64748b', glow: 'none', level: 0 };
  } else if (dec <= 3) {
    return { bg: 'rgba(6, 182, 212, 0.2)', text: '#38bdf8', glow: '0 0 10px rgba(6, 182, 212, 0.3)', level: dec };
  } else if (dec <= 7) {
    return { bg: 'rgba(99, 102, 241, 0.3)', text: '#a5b4fc', glow: '0 0 12px rgba(99, 102, 241, 0.4)', level: dec };
  } else if (dec <= 11) {
    return { bg: 'rgba(168, 85, 247, 0.35)', text: '#d8b4fe', glow: '0 0 15px rgba(168, 85, 247, 0.5)', level: dec };
  } else {
    return { bg: 'rgba(244, 63, 94, 0.4)', text: '#fda4af', glow: '0 0 18px rgba(244, 63, 94, 0.6)', level: dec };
  }
}

function FingerprintDisplay({
  label,
  signatureKey,
  fingerprintString,
  hoveredCharIdx,
  onHoverChar,
}) {
  const [copied, setCopied] = useState(false);

  if (!fingerprintString) {
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
          <span>Run comparison to generate 16-character fingerprint string</span>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(fingerprintString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate statistics
  const decLevels = fingerprintString.split('').map((c) => parseInt(c, 16) || 0);
  const avgLevel = (decLevels.reduce((a, b) => a + b, 0) / 16).toFixed(1);
  const maxLevel = Math.max(...decLevels, 0);

  return (
    <div className="stage-column-card">
      <div className="stage-column-header">
        <div className="sig-badge-label">
          <span className={`tag-badge ${signatureKey === 'b' ? 'sig-b' : ''}`}>
            {signatureKey.toUpperCase()}
          </span>
          <h4>{label}</h4>
        </div>
        <button
          type="button"
          className="copy-btn"
          onClick={handleCopy}
          title="Copy 16-character fingerprint string"
        >
          {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
          <span>{copied ? 'Copied!' : 'Copy String'}</span>
        </button>
      </div>

      <div className="fingerprint-viewport">
        {/* Large Monospace Swatch Array */}
        <div className="fingerprint-hero-box">
          <div className="fingerprint-string-row">
            {fingerprintString.split('').map((char, idx) => {
              const { bg, text, glow } = getHexIntensityColor(char);
              const isHovered = hoveredCharIdx === idx;
              const isRowBucket = idx < 8;

              return (
                <div
                  key={idx}
                  className={`hex-char-cell ${isHovered ? 'hovered' : ''} ${isRowBucket ? 'row-source' : 'col-source'}`}
                  style={{
                    backgroundColor: bg,
                    color: text,
                    boxShadow: isHovered ? '0 0 20px #ffffff' : glow,
                  }}
                  onMouseEnter={() => onHoverChar(idx)}
                  onMouseLeave={() => onHoverChar(null)}
                >
                  <span className="char-val">{char}</span>
                  <span className="char-idx">{idx}</span>
                </div>
              );
            })}
          </div>

          <div className="fingerprint-legend-row">
            <span className="legend-tag row-tag">Chars 0–7: Row Morph Profiles</span>
            <span className="legend-tag col-tag">Chars 8–15: Col Morph Profiles</span>
          </div>
        </div>

        {/* Selected Character Breakdown Tooltip */}
        {hoveredCharIdx !== null && fingerprintString[hoveredCharIdx] && (
          <div className="char-inspector-card">
            <div className="inspector-head">
              <span className="head-label">Character #{hoveredCharIdx} Inspection</span>
              <span className="head-source">
                {hoveredCharIdx < 8
                  ? `Row Pair [${hoveredCharIdx * 2}, ${hoveredCharIdx * 2 + 1}]`
                  : `Col Pair [${(hoveredCharIdx - 8) * 2}, ${(hoveredCharIdx - 8) * 2 + 1}]`}
              </span>
            </div>
            <div className="inspector-grid">
              <div className="inspect-item">
                <span className="lbl">Hex Symbol:</span>
                <strong className="val hex">{fingerprintString[hoveredCharIdx]}</strong>
              </div>
              <div className="inspect-item">
                <span className="lbl">Decimal Quantized Level:</span>
                <strong className="val">{parseInt(fingerprintString[hoveredCharIdx], 16)} / 15</strong>
              </div>
              <div className="inspect-item">
                <span className="lbl">Intensity:</span>
                <strong className="val">
                  {((parseInt(fingerprintString[hoveredCharIdx], 16) / 15) * 100).toFixed(0)}%
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="stage-metrics-row">
        <div className="metric-chip" title="Average quantized bucket level across all 16 symbols">
          <Gauge size={13} />
          <span>Avg Level:</span>
          <strong>{avgLevel} / 15</strong>
        </div>
        <div className="metric-chip" title="Peak intensity symbol">
          <Sparkles size={13} />
          <span>Peak Symbol:</span>
          <strong>{maxLevel.toString(16).toUpperCase()} ({maxLevel})</strong>
        </div>
        <div className="metric-chip" title="Total length of the biometric signature string">
          <Binary size={13} />
          <span>Length:</span>
          <strong>16 Chars</strong>
        </div>
      </div>
    </div>
  );
}

export default function Stage5Fingerprint({
  response,
  isLoading = false,
  isOpen,
  onToggle,
}) {
  const [hoveredCharA, setHoveredCharA] = useState(null);
  const [hoveredCharB, setHoveredCharB] = useState(null);

  const stringA = response?.signature_a?.fingerprint_string || null;
  const stringB = response?.signature_b?.fingerprint_string || null;
  const isCompleted = Boolean(stringA && stringB);

  return (
    <StageCard
      stageNumber={5}
      title="Stage 5: Final Fingerprint String"
      subtitle="Morphological density arrays quantized into an immutable 16-character hexadecimal fingerprint."
      icon={KeyRound}
      badge="16-Char Hex String"
      rule="Row/Col 8-Bucket Mean Density → Quantized Hex Range [0..F]"
      isCompleted={isCompleted}
      isLoading={isLoading}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="stage-toolbar">
        <div className="toolbar-info">
          <Info size={14} />
          <span>16 discrete intensity levels (0..15) mapped into hex characters 0..9 and A..F. Hover a character to inspect its source profile.</span>
        </div>
      </div>

      <div className="stage-comparison-grid">
        <FingerprintDisplay
          label="Signature A (Reference)"
          signatureKey="a"
          fingerprintString={stringA}
          hoveredCharIdx={hoveredCharA}
          onHoverChar={setHoveredCharA}
        />

        <FingerprintDisplay
          label="Signature B (Questioned)"
          signatureKey="b"
          fingerprintString={stringB}
          hoveredCharIdx={hoveredCharB}
          onHoverChar={setHoveredCharB}
        />
      </div>
    </StageCard>
  );
}
