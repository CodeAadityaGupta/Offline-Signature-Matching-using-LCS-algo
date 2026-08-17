import React, { useState } from 'react';
import { Sliders, ChevronDown, RotateCcw, HelpCircle } from 'lucide-react';
import { DEFAULT_PARAMS, PARAM_DEFINITIONS } from '../constants/params';

export default function ParamsPanel({ params, onChange, onReset }) {
  const [isOpen, setIsOpen] = useState(true);

  const handleSliderChange = (key, value) => {
    onChange({
      ...params,
      [key]: Number(value),
    });
  };

  const isCustomized = Object.keys(DEFAULT_PARAMS).some(
    (key) => params[key] !== DEFAULT_PARAMS[key]
  );

  return (
    <div className="params-card">
      <div className="params-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="params-title">
          <Sliders size={18} color="var(--accent-primary)" />
          <h3>Pipeline Parameters & Hyperparameters</h3>
          <span className="params-badge">
            {isCustomized ? 'Customized' : 'Defaults Active'}
          </span>
        </div>

        <div className="params-controls-header">
          {isCustomized && (
            <button
              type="button"
              className="reset-params-btn"
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              title="Reset all parameters to default specification"
            >
              <RotateCcw size={12} />
              Reset Defaults
            </button>
          )}
          <ChevronDown
            size={18}
            className={`chevron-icon ${isOpen ? 'open' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="params-body">
          {PARAM_DEFINITIONS.map((def) => {
            const val = params[def.key] ?? DEFAULT_PARAMS[def.key];
            return (
              <div key={def.key} className="param-item">
                <div className="param-header-row">
                  <div className="param-label-group">
                    <span className="param-label">{def.label}</span>
                    <span className="tooltip-trigger" title={def.tooltip}>
                      <HelpCircle size={13} />
                    </span>
                  </div>

                  <div className="param-value-box">
                    <input
                      type="number"
                      className="param-input-number"
                      min={def.min}
                      max={def.max}
                      step={def.step}
                      value={val}
                      onChange={(e) => handleSliderChange(def.key, e.target.value)}
                    />
                  </div>
                </div>

                <div className="param-slider-wrapper">
                  <input
                    type="range"
                    className="param-slider"
                    min={def.min}
                    max={def.max}
                    step={def.step}
                    value={val}
                    onChange={(e) => handleSliderChange(def.key, e.target.value)}
                  />
                </div>

                <div className="param-bounds">
                  <span>Min: {def.min}</span>
                  <span>Default: {DEFAULT_PARAMS[def.key]}</span>
                  <span>Max: {def.max}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
