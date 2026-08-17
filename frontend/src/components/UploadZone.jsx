import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, FileText, Sparkles } from 'lucide-react';

function SingleDropZone({
  label,
  signatureKey,
  file,
  previewUrl,
  onFileSelect,
  onRemoveFile,
  samplePath,
  sampleName
}) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      onFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleLoadSample = async (e) => {
    e.stopPropagation();
    try {
      const res = await fetch(samplePath);
      const blob = await res.blob();
      const sampleFile = new File([blob], sampleName, { type: blob.type || 'image/svg+xml' });
      onFileSelect(sampleFile);
    } catch (err) {
      console.error('Failed to load sample signature:', err);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="dropzone-card">
      <div className="dropzone-header">
        <div className="signature-tag">
          <span className={`tag-badge ${signatureKey === 'b' ? 'sig-b' : ''}`}>
            {signatureKey.toUpperCase()}
          </span>
          <span>{label}</span>
        </div>

        <button
          type="button"
          className="sample-load-btn"
          onClick={handleLoadSample}
          title={`Load reference sample for ${label}`}
        >
          <Sparkles size={13} />
          Load Sample
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*, .png, .jpg, .jpeg, .svg, .webp, .bmp"
        style={{ display: 'none' }}
      />

      <div
        className={`drop-area ${isDragOver ? 'drag-over' : ''} ${previewUrl ? 'has-preview' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !previewUrl && fileInputRef.current?.click()}
      >
        {previewUrl ? (
          <div className="preview-container">
            <div className="preview-image-wrapper">
              <img src={previewUrl} alt={`${label} Preview`} />
            </div>
            <div className="preview-meta">
              <div className="file-info" title={file?.name}>
                <FileText size={14} />
                <span>{file?.name || 'sample_signature.svg'}</span>
                {file?.size && <span>• {formatFileSize(file.size)}</span>}
              </div>
              <button
                type="button"
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile();
                }}
                title="Remove signature"
              >
                <X size={13} />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="drop-icon-wrapper">
              <UploadCloud size={28} />
            </div>
            <p className="drop-prompt-main">Drop {label} here or browse</p>
            <p className="drop-prompt-sub">Supports PNG, JPG, SVG, WebP up to 10MB</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function UploadZone({
  fileA,
  previewUrlA,
  onFileSelectA,
  onRemoveFileA,
  fileB,
  previewUrlB,
  onFileSelectB,
  onRemoveFileB,
}) {
  return (
    <section className="upload-section">
      <div className="section-title">
        <h2>
          <ImageIcon size={20} />
          Acquisition & Input Signatures
        </h2>
      </div>

      <div className="upload-grid">
        <SingleDropZone
          label="Signature A (Reference)"
          signatureKey="a"
          file={fileA}
          previewUrl={previewUrlA}
          onFileSelect={onFileSelectA}
          onRemoveFile={onRemoveFileA}
          samplePath="/samples/sample_sig_a.svg"
          sampleName="sample_reference_a.svg"
        />

        <SingleDropZone
          label="Signature B (Questioned)"
          signatureKey="b"
          file={fileB}
          previewUrl={previewUrlB}
          onFileSelect={onFileSelectB}
          onRemoveFile={onRemoveFileB}
          samplePath="/samples/sample_sig_b.svg"
          sampleName="sample_questioned_b.svg"
        />
      </div>
    </section>
  );
}
