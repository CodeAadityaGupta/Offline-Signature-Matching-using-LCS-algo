import React from 'react';
import { Cpu } from 'lucide-react';

export default function Header({ isMockMode, onToggleMockMode, statusText = 'Ready' }) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo">
          <Cpu size={26} />
        </div>
        <div className="brand-info">
          <h1>SignaLCS</h1>
          <p>Offline Signature Verification Pipeline Visualizer</p>
        </div>
      </div>

      <div className="header-actions">
        <div className="toggle-wrapper" title="Toggle between mock response dataset and live backend server">
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

        <div className={`status-badge ${isMockMode ? 'mock' : 'live'}`}>
          <span className="dot"></span>
          <span>{statusText || (isMockMode ? 'Mock Contract' : 'Live Backend')}</span>
        </div>
      </div>
    </header>
  );
}
