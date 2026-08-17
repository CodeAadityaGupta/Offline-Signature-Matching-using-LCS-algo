import React from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';

const PRESET_OPTIONS = [
  {
    id: 'case-study',
    title: 'Case Study Reference Pair (Figure 9)',
    description: 'The standard worked sample from the case study documentation resulting in fingerprint string 015AF87025978753.',
    expectedScore: '87.5% Match (LCS 14/16)',
    tag: 'Reference Benchmark',
    tagType: 'benchmark',
    pathA: '/samples/sample_sig_a.svg',
    nameA: 'case_study_ref_sig_a.svg',
    pathB: '/samples/sample_sig_b.svg',
    nameB: 'case_study_questioned_sig_b.svg',
  },
  {
    id: 'identical',
    title: 'Self-Comparison / High-Fidelity Twin',
    description: 'Identical signature uploaded to both slots to verify 100% LCS similarity and diagonal DP traceback.',
    expectedScore: '100% Match (LCS 16/16)',
    tag: '100% Baseline',
    tagType: 'match',
    pathA: '/samples/sample_sig_a.svg',
    nameA: 'sample_authentic_a.svg',
    pathB: '/samples/sample_sig_a.svg',
    nameB: 'sample_authentic_a_twin.svg',
  },
  {
    id: 'dissimilar',
    title: 'Disparate / Forgery Test Pair',
    description: 'Contrasting strokes with different morphological profile distribution to test mismatch classification.',
    expectedScore: 'Low / Disparate Similarity',
    tag: 'Mismatch Test',
    tagType: 'diff',
    pathA: '/samples/sample_sig_a.svg',
    nameA: 'reference_sig_a.svg',
    pathB: '/samples/sample_sig_b.svg',
    nameB: 'dissimilar_sig_b.svg',
  },
];

export default function SamplePresetsModal({ isOpen, onClose, onSelectPreset }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="presets-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge">
              <Sparkles size={20} color="var(--accent-primary)" />
            </div>
            <div>
              <h3>Quick-Load Signature Presets</h3>
              <p>Select a pre-configured sample pair to test and validate pipeline behavior</p>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close Presets Modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="presets-list">
          {PRESET_OPTIONS.map((preset) => (
            <div
              key={preset.id}
              className="preset-card"
              onClick={() => {
                onSelectPreset(preset);
                onClose();
              }}
            >
              <div className="preset-card-top">
                <div className="preset-card-title">
                  <h4>{preset.title}</h4>
                  <span className={`preset-pill ${preset.tagType}`}>{preset.tag}</span>
                </div>
                <span className="preset-score">{preset.expectedScore}</span>
              </div>

              <p className="preset-desc">{preset.description}</p>

              <div className="preset-action-row">
                <span className="load-action-text">
                  Load this pair into pipeline <ArrowRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
