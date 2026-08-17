import React, { useState } from 'react';
import StageCard from './StageCard';
import { Camera, FileImage, Moon, Sun, Info } from 'lucide-react';

function SignatureThumbnail({
  label,
  signatureKey,
  file,
  previewUrl,
  invert,
}) {
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Sample asset';
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="stage-column-card">
      <div className="stage-column-header">
        <div className="sig-badge-label">
          <span className={`tag-badge ${signatureKey === 'b' ? 'sig-b' : ''}`}>
            {signatureKey.toUpperCase()}
          </span>
          <h4>{label}</h4>
        </div>
        <span className="file-format-pill">
          {file?.type?.replace('image/', '').toUpperCase() || 'SVG / VECTOR'}
        </span>
      </div>

      <div className={`sig-preview-display ${invert ? 'inverted' : ''}`}>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`${label} Preview`}
            className="acquisition-image"
          />
        ) : (
          <div className="no-image-placeholder">
            <FileImage size={32} />
            <p>No image uploaded</p>
          </div>
        )}
      </div>

      <div className="stage-column-meta">
        <div className="meta-row">
          <span className="meta-key">Filename:</span>
          <span className="meta-value truncate" title={file?.name || 'sample_signature.svg'}>
            {file?.name || 'sample_signature.svg'}
          </span>
        </div>
        <div className="meta-row">
          <span className="meta-key">File Size:</span>
          <span className="meta-value">{formatFileSize(file?.size)}</span>
        </div>
        <div className="meta-row">
          <span className="meta-key">Pre-Processing:</span>
          <span className="meta-value accent">Grayscale + Scaled to 64×64</span>
        </div>
      </div>
    </div>
  );
}

export default function Stage1Acquisition({
  fileA,
  previewUrlA,
  fileB,
  previewUrlB,
  isOpen,
  onToggle,
}) {
  const [invertView, setInvertView] = useState(false);
  const isCompleted = Boolean(previewUrlA && previewUrlB);

  return (
    <StageCard
      stageNumber={1}
      title="Stage 1: Acquisition & Normalization"
      subtitle="Raw handwritten signatures captured, grayscale-converted, and standardized for digital profiling."
      icon={Camera}
      badge="Input Images"
      rule="Image Acquisition → 8-bit Grayscale → 64×64 Square Framing"
      isCompleted={isCompleted}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="stage-toolbar">
        <div className="toolbar-info">
          <Info size={14} />
          <span>Both signatures are pre-conditioned for uniform canvas dimensions before binary quantization.</span>
        </div>

        <button
          type="button"
          className={`toolbar-btn ${invertView ? 'active' : ''}`}
          onClick={() => setInvertView(!invertView)}
          title="Toggle high-contrast inverted view (dark mode strokes)"
        >
          {invertView ? <Sun size={13} /> : <Moon size={13} />}
          <span>{invertView ? 'Standard View' : 'High-Contrast Invert'}</span>
        </button>
      </div>

      <div className="stage-comparison-grid">
        <SignatureThumbnail
          label="Signature A (Reference)"
          signatureKey="a"
          file={fileA}
          previewUrl={previewUrlA}
          invert={invertView}
        />

        <SignatureThumbnail
          label="Signature B (Questioned)"
          signatureKey="b"
          file={fileB}
          previewUrl={previewUrlB}
          invert={invertView}
        />
      </div>
    </StageCard>
  );
}
