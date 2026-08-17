import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import ParamsPanel from './components/ParamsPanel';
import { DEFAULT_PARAMS } from './constants/params';
import JsonStateViewer from './components/JsonStateViewer';
import { compareSignatures } from './services/api';
import { Play, Loader2, AlertTriangle, Sparkles } from 'lucide-react';

export default function App() {
  const [fileA, setFileA] = useState(null);
  const [previewUrlA, setPreviewUrlA] = useState('');
  const [fileB, setFileB] = useState(null);
  const [previewUrlB, setPreviewUrlB] = useState('');

  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [isMockMode, setIsMockMode] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pipelineResponse, setPipelineResponse] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);

  // File handlers for Signature A
  const handleFileSelectA = (file) => {
    if (previewUrlA && previewUrlA.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrlA);
    }
    setFileA(file);
    const url = URL.createObjectURL(file);
    setPreviewUrlA(url);
    setError(null);
  };

  const handleRemoveFileA = () => {
    if (previewUrlA && previewUrlA.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrlA);
    }
    setFileA(null);
    setPreviewUrlA('');
  };

  // File handlers for Signature B
  const handleFileSelectB = (file) => {
    if (previewUrlB && previewUrlB.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrlB);
    }
    setFileB(file);
    const url = URL.createObjectURL(file);
    setPreviewUrlB(url);
    setError(null);
  };

  const handleRemoveFileB = () => {
    if (previewUrlB && previewUrlB.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrlB);
    }
    setFileB(null);
    setPreviewUrlB('');
  };

  // Quick load both reference samples
  const handleLoadBothSamples = async () => {
    try {
      const [resA, resB] = await Promise.all([
        fetch('/samples/sample_sig_a.svg'),
        fetch('/samples/sample_sig_b.svg'),
      ]);
      const [blobA, blobB] = await Promise.all([resA.blob(), resB.blob()]);

      const fileObjA = new File([blobA], 'case_study_sample_a.svg', { type: 'image/svg+xml' });
      const fileObjB = new File([blobB], 'case_study_sample_b.svg', { type: 'image/svg+xml' });

      handleFileSelectA(fileObjA);
      handleFileSelectB(fileObjB);
    } catch (err) {
      console.error('Failed to load sample signatures:', err);
    }
  };

  // Run pipeline comparison
  const handleRunComparison = async () => {
    if (!fileA || !fileB) {
      setError('Please upload or load both Signature A and Signature B before running comparison.');
      return;
    }

    setIsLoading(true);
    setError(null);
    const t0 = performance.now();

    try {
      const result = await compareSignatures(fileA, fileB, params, isMockMode);
      const elapsed = Math.round(performance.now() - t0);
      setExecutionTime(elapsed);
      setPipelineResponse(result);
      console.log('Pipeline Output stored in App State:', result);
    } catch (err) {
      setError(
        err.message || 'Failed to compare signatures. If using Live API, verify backend server is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up Object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrlA && previewUrlA.startsWith('blob:')) URL.revokeObjectURL(previewUrlA);
      if (previewUrlB && previewUrlB.startsWith('blob:')) URL.revokeObjectURL(previewUrlB);
    };
  }, [previewUrlA, previewUrlB]);

  const canRun = Boolean(fileA && fileB && !isLoading);

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        isMockMode={isMockMode}
        onToggleMockMode={setIsMockMode}
        statusText={isLoading ? 'Computing Pipeline...' : 'System Ready'}
      />

      {/* Error Alert */}
      {error && (
        <div className="error-banner">
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Phase 2: Upload Zone */}
      <UploadZone
        fileA={fileA}
        previewUrl={previewUrlA}
        previewUrlA={previewUrlA}
        onFileSelectA={handleFileSelectA}
        onRemoveFileA={handleRemoveFileA}
        fileB={fileB}
        previewUrlB={previewUrlB}
        onFileSelectB={handleFileSelectB}
        onRemoveFileB={handleRemoveFileB}
      />

      {/* Phase 2: Hyperparameters Configuration */}
      <ParamsPanel
        params={params}
        onChange={setParams}
        onReset={() => setParams(DEFAULT_PARAMS)}
      />

      {/* Action Bar */}
      <div className="action-bar">
        <button
          type="button"
          className="btn-primary"
          onClick={handleRunComparison}
          disabled={!canRun}
          id="run-comparison-button"
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="spinner" />
              <span>Executing Pipeline...</span>
            </>
          ) : (
            <>
              <Play size={18} fill="currentColor" />
              <span>Run Comparison</span>
            </>
          )}
        </button>

        {(!fileA || !fileB) && (
          <button
            type="button"
            className="sample-load-btn"
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.875rem' }}
            onClick={handleLoadBothSamples}
          >
            <Sparkles size={16} />
            Quick-Load Reference Signatures
          </button>
        )}
      </div>

      {/* Phase 2 Deliverable: JSON State & Contract Inspector */}
      <JsonStateViewer
        response={pipelineResponse}
        isLoading={isLoading}
        executionTime={executionTime}
      />
    </div>
  );
}
