import React, { useState } from 'react';
import {
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Camera,
  Grid,
  Minimize2,
  BarChart2,
  KeyRound,
  GitCompare,
  CheckCircle2,
  Route,
} from 'lucide-react';

const GUIDE_STEPS = [
  {
    step: 1,
    title: 'Stage 1: Image Acquisition & Grayscale Normalization',
    icon: Camera,
    rule: 'Image Acquisition → 8-bit Grayscale → 64×64 Square Framing',
    badge: 'Input Images',
    content: (
      <>
        <p>
          Handwritten signatures are captured from scans or camera uploads. The pipeline converts color images into an 8-bit grayscale intensity representation ($0..255$) and resizes the bounding box into a standard $64 \times 64$ pixel square coordinate plane.
        </p>
        <div className="guide-callout">
          <strong>Key Objective:</strong> Eliminates variations in ink color, lighting, and aspect ratio while retaining stroke geometry.
        </div>
      </>
    ),
  },
  {
    step: 2,
    title: 'Stage 2: Image to Binary Matrix (64×64)',
    icon: Grid,
    rule: 'Pixel Luminance < T (128) → "1" (Ink), else "0" (Background)',
    badge: '64×64 Matrix (4,096 cells)',
    content: (
      <>
        <p>
          Each pixel is binarized using a luminance cutoff threshold ($T=128$). Pixels darker than $T$ are tagged as ink (<code>&apos;1&apos;</code>), and lighter pixels become background (<code>&apos;0&apos;</code>). The result is a $64 \times 64$ binary matrix of 4,096 elements.
        </p>
        <div className="guide-callout">
          <strong>Key Objective:</strong> Separates foreground pen strokes from background paper texture.
        </div>
      </>
    ),
  },
  {
    step: 3,
    title: 'Stage 3: Sub-Block Matrix Compression (16×16)',
    icon: Minimize2,
    rule: 'Block 4×4 Ink Ratio ≥ 10% → "1", else "0"',
    badge: '16×16 Grid (256 cells, 16:1 Reduction)',
    content: (
      <>
        <p>
          The $64 \times 64$ matrix is partitioned into non-overlapping $4 \times 4$ sub-blocks (16 pixels each). If a block contains $\ge 10\%$ ink pixels ($\ge 2$ ink pixels), the compressed cell is marked <code>&apos;1&apos;</code>, else <code>&apos;0&apos;</code>.
        </p>
        <div className="guide-callout">
          <strong>Key Objective:</strong> Filters out high-frequency tremor noise and downsamples data volume by 16×.
        </div>
      </>
    ),
  },
  {
    step: 4,
    title: 'Stage 4: Row & Column Density Profiling',
    icon: BarChart2,
    rule: 'Row Density R[i] = Σ(16 cols) | Col Density C[j] = Σ(16 rows)',
    badge: 'Two 16-Element Projection Arrays',
    content: (
      <>
        <p>
          Counts total ink bits along both spatial axes to generate 1D morphological projection histograms:
        </p>
        <ul className="guide-list">
          <li><strong>Row Density (Horizontal):</strong> 16 integer sums representing stroke height profiles.</li>
          <li><strong>Column Density (Vertical):</strong> 16 integer sums representing stroke width profiles.</li>
        </ul>
      </>
    ),
  },
  {
    step: 5,
    title: 'Stage 5: Quantized Hex Fingerprint String',
    icon: KeyRound,
    rule: '8-Pair Mean Density → Quantized Hex Range [0..F]',
    badge: '16-Character Hex String',
    content: (
      <>
        <p>
          The 16 row density values and 16 column density values are each grouped into 8 adjacent pairs, averaged, and quantized into 16 discrete intensity buckets ($0..15$). These are mapped to hex characters (<code>0-9</code>, <code>A-F</code>).
        </p>
        <div className="guide-callout">
          <strong>Case Study Output:</strong> Reference sample yields the standard 16-character fingerprint: <code className="guide-hex">015AF87025978753</code>.
        </div>
      </>
    ),
  },
  {
    step: 6,
    title: 'Stage 6: LCS Comparison, DP Matrix & Verdict',
    icon: GitCompare,
    rule: 'DP[i][j] = DP[i-1][j-1]+1 if s1[i-1]==s2[j-1] else max(DP[i-1][j], DP[i][j-1])',
    badge: '17×17 DP Table & Verdict',
    content: (
      <>
        <p>
          The two 16-character fingerprint strings are compared using Dynamic Programming to find their Longest Common Subsequence (LCS).
        </p>
        <ul className="guide-list">
          <li><strong>Similarity Formula:</strong> Similarity = (LCS Length / 16) × 100%</li>
          <li><strong>Decision Verdict:</strong> Similarity ≥ 60% → <strong>Likely Match</strong>, otherwise <strong>Likely Different</strong>.</li>
        </ul>
      </>
    ),
  },
  {
    step: 7,
    title: 'Extension: Levenshtein Distance & Edit Metric',
    icon: Route,
    rule: 'D[i,j] = min(D[i-1,j]+1, D[i,j-1]+1, D[i-1,j-1] + cost)',
    badge: 'Edit Distance Metric',
    content: (
      <>
        <p>
          Calculates the minimum edit operations (insertions, deletions, and substitutions) needed to transform Signature A&apos;s fingerprint into Signature B&apos;s.
        </p>
        <ul className="guide-list">
          <li><strong>Edit Distance:</strong> Minimum total mutations between both 16-char strings.</li>
          <li><strong>Levenshtein Similarity:</strong> max(0, 1 - Distance / 16) × 100%.</li>
        </ul>
      </>
    ),
  },
];

export default function WalkthroughGuide({ isOpen, onClose, onLoadReferenceSample }) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  if (!isOpen) return null;

  const currentGuide = GUIDE_STEPS[currentStepIdx];
  const StepIcon = currentGuide.icon;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="walkthrough-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <BookOpen size={20} color="var(--accent-cyan)" />
            </div>
            <div>
              <h3>Interactive Pipeline Architecture Guide</h3>
              <p>Step-by-step case study breakdown of the 6-stage verification algorithm</p>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close Guide"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Dots Bar */}
        <div className="modal-stepper-nav">
          {GUIDE_STEPS.map((s, idx) => (
            <button
              key={s.step}
              type="button"
              className={`modal-step-dot ${idx === currentStepIdx ? 'active' : ''} ${idx < currentStepIdx ? 'completed' : ''}`}
              onClick={() => setCurrentStepIdx(idx)}
              title={s.title}
            >
              <span>{s.step}</span>
            </button>
          ))}
        </div>

        {/* Step Card Content */}
        <div className="modal-step-content">
          <div className="step-badge-row">
            <div className="step-pill">
              <StepIcon size={14} />
              <span>{currentGuide.badge}</span>
            </div>
            <span className="step-counter">
              Stage {currentGuide.step} of {GUIDE_STEPS.length}
            </span>
          </div>

          <h4>{currentGuide.title}</h4>

          <div className="modal-rule-box">
            <span className="rule-tag">RULE</span>
            <code>{currentGuide.rule}</code>
          </div>

          <div className="step-body-text">{currentGuide.content}</div>
        </div>

        {/* Modal Footer Controls */}
        <div className="modal-footer">
          <div className="footer-left">
            {onLoadReferenceSample && (
              <button
                type="button"
                className="sample-quick-link-btn"
                onClick={() => {
                  onLoadReferenceSample();
                  onClose();
                }}
              >
                <Sparkles size={14} />
                Load Reference Sample &amp; Run
              </button>
            )}
          </div>

          <div className="footer-right">
            <button
              type="button"
              className="modal-nav-btn"
              disabled={currentStepIdx === 0}
              onClick={() => setCurrentStepIdx((prev) => Math.max(0, prev - 1))}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {currentStepIdx < GUIDE_STEPS.length - 1 ? (
              <button
                type="button"
                className="modal-nav-btn primary"
                onClick={() => setCurrentStepIdx((prev) => Math.min(GUIDE_STEPS.length - 1, prev + 1))}
              >
                Next Stage
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="modal-nav-btn primary finish"
                onClick={onClose}
              >
                <CheckCircle2 size={16} />
                Got It!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
