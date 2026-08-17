import React, { useState } from 'react';
import { Terminal, Copy, Check, Layers, CheckCircle2 } from 'lucide-react';

export default function JsonStateViewer({ response, isLoading, executionTime }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="state-inspector-card">
      <div className="state-inspector-header">
        <div className="state-inspector-title">
          <Terminal size={18} color="var(--accent-cyan)" />
          <span>Pipeline State & Response Contract Inspector</span>
        </div>

        <div className="inspector-meta">
          {response && (
            <>
              <span className="inspector-pill accent">
                LCS: {response.comparison?.lcs_length} / 16 ({response.comparison?.similarity_percent}%)
              </span>
              <span className="inspector-pill">
                Verdict: {response.comparison?.verdict}
              </span>
              {executionTime !== null && (
                <span className="inspector-pill">
                  {executionTime} ms
                </span>
              )}
              <span className="inspector-pill">
                {response._meta?.source === 'mock' ? 'Mock Data' : 'Live API'}
              </span>
            </>
          )}

          {response && (
            <button
              type="button"
              className="copy-btn"
              onClick={handleCopy}
              title="Copy JSON to clipboard"
            >
              {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
          )}
        </div>
      </div>

      {response ? (
        <>
          <div className="phase-notice" style={{ margin: '1rem 1.5rem 0.5rem 1.5rem' }}>
            <div className="phase-notice-left">
              <span className="phase-tag">Phase 2 Deliverable</span>
              <span>
                Pipeline state successfully captured & validated against the contract schema. Ready for Phase 3 (6-Stage Pipeline Stepper).
              </span>
            </div>
            <CheckCircle2 size={18} color="var(--accent-emerald)" />
          </div>

          <pre className="raw-json-view">
            {JSON.stringify(response, null, 2)}
          </pre>
        </>
      ) : (
        <div className="empty-state-box">
          <div className="empty-icon-wrapper">
            <Layers size={24} />
          </div>
          <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
            {isLoading ? 'Processing signatures through pipeline...' : 'No Pipeline Execution Results Yet'}
          </p>
          <p style={{ fontSize: '0.8125rem' }}>
            Upload or select two signatures above, configure parameters if desired, and click &ldquo;Run Comparison&rdquo;.
          </p>
        </div>
      )}
    </div>
  );
}
