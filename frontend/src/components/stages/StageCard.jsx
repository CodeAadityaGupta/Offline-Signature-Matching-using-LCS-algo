import React from 'react';
import { ChevronDown, CheckCircle2, CircleDashed } from 'lucide-react';

export default function StageCard({
  stageNumber,
  title,
  subtitle,
  icon: Icon,
  rule,
  badge,
  isCompleted = false,
  isOpen = true,
  onToggle,
  children,
}) {
  return (
    <div className={`stage-card ${isOpen ? 'open' : 'closed'} ${isCompleted ? 'completed' : ''}`}>
      <div className="stage-header" onClick={onToggle}>
        <div className="stage-header-left">
          <div className="stage-num-badge">
            <span>{stageNumber}</span>
          </div>

          <div className="stage-title-group">
            <div className="stage-title-row">
              {Icon && <Icon size={18} className="stage-icon" />}
              <h3>{title}</h3>
              {badge && <span className="stage-pill-badge">{badge}</span>}
              {isCompleted ? (
                <span className="stage-status-tag completed">
                  <CheckCircle2 size={13} />
                  <span>Computed</span>
                </span>
              ) : (
                <span className="stage-status-tag pending">
                  <CircleDashed size={13} />
                  <span>Awaiting Run</span>
                </span>
              )}
            </div>

            {subtitle && <p className="stage-subtitle">{subtitle}</p>}
          </div>
        </div>

        <div className="stage-header-right">
          {rule && (
            <div className="stage-rule-box" title="Transformation Rule / Mathematical Logic">
              <span className="rule-label">RULE</span>
              <code className="rule-code">{rule}</code>
            </div>
          )}

          <button
            type="button"
            className="stage-collapse-btn"
            aria-label={isOpen ? 'Collapse Stage' : 'Expand Stage'}
          >
            <ChevronDown size={18} className={`chevron-icon ${isOpen ? 'open' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="stage-body">
          {children}
        </div>
      )}
    </div>
  );
}
