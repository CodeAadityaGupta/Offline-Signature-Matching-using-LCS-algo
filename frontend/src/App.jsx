import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import ParamsPanel from './components/ParamsPanel';
import { DEFAULT_PARAMS } from './constants/params';
import PipelineStepper from './components/PipelineStepper';
import JsonStateViewer from './components/JsonStateViewer';
import WalkthroughGuide from './components/WalkthroughGuide';
import SamplePresetsModal from './components/SamplePresetsModal';
import { compareSignatures, DEFAULT_API_BASE_URL } from './services/api';
import { Play, Loader2, AlertTriangle, Sparkles, BookOpen, RefreshCw } from 'lucide-react';

export default function App() {
  const [fileA, setFileA] = useState(null);
  const [previewUrlA, setPreviewUrlA] = useState('');
  const [fileB, setFileB] = useState(null);
  const [previewUrlB, setPreviewUrlB] = useState('');

  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [isMockMode, setIsMockMode] = useState(true);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_BASE_URL);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pipelineResponse, setPipelineResponse] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);

  // Modals state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  // Helper to read File as Base64 Data URL (persists across re-renders without URL revocation issues)
  const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // File handlers for Signature A
  const handleFileSelectA = async (file) => {
    if (!file) return;
    setFileA(file);
    setError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPreviewUrlA(dataUrl);
    } catch (err) {
      console.error('Failed to generate preview for file A:', err);
      setPreviewUrlA(URL.createObjectURL(file));
    }
  };

  const handleRemoveFileA = () => {
    setFileA(null);
    setPreviewUrlA('');
  };

  // File handlers for Signature B
  const handleFileSelectB = async (file) => {
    if (!file) return;
    setFileB(file);
    setError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPreviewUrlB(dataUrl);
    } catch (err) {
      console.error('Failed to generate preview for file B:', err);
      setPreviewUrlB(URL.createObjectURL(file));
    }
  };

  const handleRemoveFileB = () => {
    setFileB(null);
    setPreviewUrlB('');
  };

  // Preset loader
  const handleSelectPreset = async (preset) => {
    try {
      const [resA, resB] = await Promise.all([
        fetch(preset.pathA),
        fetch(preset.pathB),
      ]);
      const [blobA, blobB] = await Promise.all([resA.blob(), resB.blob()]);

      const fileObjA = new File([blobA], preset.nameA, { type: blobA.type || 'image/svg+xml' });
      const fileObjB = new File([blobB], preset.nameB, { type: blobB.type || 'image/svg+xml' });

      await Promise.all([
        handleFileSelectA(fileObjA),
        handleFileSelectB(fileObjB),
      ]);
    } catch (err) {
      console.error('Failed to load preset signatures:', err);
    }
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

      await Promise.all([
        handleFileSelectA(fileObjA),
        handleFileSelectB(fileObjB),
      ]);
    } catch (err) {
      console.error('Failed to load sample signatures:', err);
    }
  };

  // Run pipeline comparison
  const handleRunComparison = useCallback(async () => {
    if (!fileA || !fileB) {
      setError('Please upload or load both Signature A and Signature B before running comparison.');
      return;
    }

    setIsLoading(true);
    setError(null);
    const t0 = performance.now();

    try {
      const result = await compareSignatures(fileA, fileB, params, isMockMode, apiUrl);
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
  }, [fileA, fileB, params, isMockMode, apiUrl]);

  const canRun = Boolean(fileA && fileB && !isLoading);

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        isMockMode={isMockMode}
        onToggleMockMode={setIsMockMode}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenPresets={() => setIsPresetsOpen(true)}
        apiUrl={apiUrl}
        onUpdateApiUrl={setApiUrl}
        statusText={isLoading ? 'Computing Pipeline...' : 'System Ready'}
      />

      {/* Error Alert Banner */}
      {error && (
        <div className="error-banner">
          <AlertTriangle size={20} />
          <div className="error-msg-content">
            <strong>Pipeline Error:</strong>
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="error-dismiss-btn"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
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
          ) : pipelineResponse ? (
            <>
              <RefreshCw size={18} />
              <span>Re-Run Comparison</span>
            </>
          ) : (
            <>
              <Play size={18} fill="currentColor" />
              <span>Run Comparison</span>
            </>
          )}
        </button>

        <button
          type="button"
          className="sample-load-btn"
          onClick={() => setIsPresetsOpen(true)}
        >
          <Sparkles size={16} />
          Choose Sample Presets
        </button>

        <button
          type="button"
          className="guide-launcher-btn"
          onClick={() => setIsGuideOpen(true)}
        >
          <BookOpen size={16} />
          Interactive Guide
        </button>
      </div>

      {/* Phase 3–8: 6-Stage Pipeline Stepper & Intermediate Visualizers */}
      <PipelineStepper
        fileA={fileA}
        previewUrlA={previewUrlA}
        fileB={fileB}
        previewUrlB={previewUrlB}
        response={pipelineResponse}
        isLoading={isLoading}
      />

      {/* Contract & State Inspector */}
      <JsonStateViewer
        response={pipelineResponse}
        isLoading={isLoading}
        executionTime={executionTime}
      />

      {/* Modals & Guides */}
      <WalkthroughGuide
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onLoadReferenceSample={async () => {
          await handleLoadBothSamples();
        }}
      />

      <SamplePresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
      />
    </div>
  );
}
