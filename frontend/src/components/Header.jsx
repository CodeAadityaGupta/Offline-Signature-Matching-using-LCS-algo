import React, { useState, useEffect } from 'react';
import {
  Cpu,
  BookOpen,
  Sparkles,
  Settings,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { checkBackendHealth, DEFAULT_API_BASE_URL } from '../services/api';

export default function Header({
  isMockMode,
  onToggleMockMode,
  onOpenGuide,
  onOpenPresets,
  apiUrl = DEFAULT_API_BASE_URL,
  onUpdateApiUrl,
  statusText = 'Ready',
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(apiUrl);
  const [healthStatus, setHealthStatus] = useState({ isHealthy: false, status: 'Checking...' });
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const runHealthCheck = async (url) => {
    setIsCheckingHealth(true);
    const res = await checkBackendHealth(url);
    setHealthStatus(res);
    setIsCheckingHealth(false);
  };

  useEffect(() => {
    runHealthCheck(apiUrl);
  }, [apiUrl]);


  const handleSaveSettings = () => {
    onUpdateApiUrl(tempUrl);
    runHealthCheck(tempUrl);
    setShowSettings(false);
  };

  return (
    <header className="app-header">
      {/* Brand */}
      <div className="brand-section">
        <div className="brand-logo">
          <Cpu size={26} />
        </div>
        <div className="brand-info">
          <h1>SignaLCS</h1>
          <p>Offline Signature Verification Pipeline Visualizer</p>
        </div>
      </div>

      {/* Navigation & Action Controls */}
      <div className="header-actions">
        {/* Presets Button */}
        <button
          type="button"
          className="header-action-btn"
          onClick={onOpenPresets}
          title="Open Quick-Load Signature Presets"
        >
          <Sparkles size={14} color="var(--accent-primary)" />
          <span>Presets</span>
        </button>

        {/* Walkthrough Guide Button */}
        <button
          type="button"
          className="header-action-btn"
          onClick={onOpenGuide}
          title="Open 6-Stage Algorithm Architectural Guide"
        >
          <BookOpen size={14} color="var(--accent-cyan)" />
          <span>Walkthrough Guide</span>
        </button>

        {/* Mode Toggle Switch */}
        <div
          className="toggle-wrapper"
          title="Toggle between mock response dataset and live backend server"
        >
          <span className="toggle-label">
            {isMockMode ? 'Mock Data Mode' : 'Live API Mode'}
          </span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isMockMode}
              onChange={(e) => onToggleMockMode(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        {/* Status Badge */}
        <div className={`status-badge ${isMockMode ? 'mock' : healthStatus.isHealthy ? 'live' : 'offline'}`}>
          <span className="dot"></span>
          <span>
            {statusText !== 'System Ready' && statusText !== 'Ready'
              ? statusText
              : isMockMode
              ? 'Mock Contract'
              : healthStatus.isHealthy
              ? `Live API (${healthStatus.latencyMs ?? 0}ms)`
              : 'Live API (Offline)'}
          </span>
        </div>

        {/* Endpoint Config Settings Button */}
        {!isMockMode && (
          <button
            type="button"
            className="settings-icon-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Configure Live API Endpoint URL"
          >
            <Settings size={16} />
          </button>
        )}
      </div>

      {/* Endpoint Settings Modal */}
      {showSettings && (
        <div className="settings-popover">
          <div className="popover-head">
            <div className="head-title">
              <Activity size={15} color="var(--accent-cyan)" />
              <span>Live Backend Server Settings</span>
            </div>
            <button
              type="button"
              className="popover-close"
              onClick={() => setShowSettings(false)}
            >
              <X size={14} />
            </button>
          </div>

          <div className="popover-body">
            <label className="popover-label">Endpoint URL:</label>
            <input
              type="text"
              className="popover-input"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="http://localhost:8000"
            />

            <div className="popover-health-row">
              <span className="health-lbl">Server Status:</span>
              <span className={`health-badge ${healthStatus.isHealthy ? 'healthy' : 'unhealthy'}`}>
                {healthStatus.isHealthy ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                <span>{healthStatus.status}</span>
              </span>
              <button
                type="button"
                className="ping-btn"
                onClick={() => runHealthCheck(tempUrl)}
                disabled={isCheckingHealth}
                title="Ping Server"
              >
                <RefreshCw size={12} className={isCheckingHealth ? 'spinner' : ''} />
              </button>
            </div>
          </div>

          <div className="popover-footer">
            <button
              type="button"
              className="btn-secondary-sm"
              onClick={() => {
                setTempUrl(DEFAULT_API_BASE_URL);
              }}
            >
              Reset Default
            </button>
            <button
              type="button"
              className="btn-primary-sm"
              onClick={handleSaveSettings}
            >
              Save &amp; Connect
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
