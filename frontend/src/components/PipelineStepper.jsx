import React, { useState } from 'react';
import Stage1Acquisition from './stages/Stage1Acquisition';
import Stage2BinaryMatrix from './stages/Stage2BinaryMatrix';
import Stage3CompressedMatrix from './stages/Stage3CompressedMatrix';
import Stage4Profiling from './stages/Stage4Profiling';
import Stage5Fingerprint from './stages/Stage5Fingerprint';
import Stage6LCSComparison from './stages/Stage6LCSComparison';
import {
  Camera,
  Grid,
  Minimize2,
  BarChart2,
  KeyRound,
  GitCompare,
  CheckCircle2,
  CircleDot,
  Layers,
} from 'lucide-react';

const STAGES = [
  { id: 1, name: 'Acquisition', short: 'Images', icon: Camera, badge: 'Raw 64×64' },
  { id: 2, name: 'Image→Matrix', short: 'Binarize', icon: Grid, badge: '64×64' },
  { id: 3, name: 'Compression', short: '16×16', icon: Minimize2, badge: '16×16' },
  { id: 4, name: 'Profiling', short: 'Density', icon: BarChart2, badge: '16 Rows/Cols' },
  { id: 5, name: 'Fingerprint', short: 'Hex String', icon: KeyRound, badge: '16 Chars' },
  { id: 6, name: 'LCS Compare', short: 'DP & Verdict', icon: GitCompare, badge: 'DP Table' },
];

export default function PipelineStepper({
  fileA,
  previewUrlA,
  fileB,
  previewUrlB,
  response,
  isLoading,
}) {
  // State for which stages are open (all open by default for comprehensive stage inspection)
  const [openStages, setOpenStages] = useState({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
  });

  const toggleStage = (stageNum) => {
    setOpenStages((prev) => ({
      ...prev,
      [stageNum]: !prev[stageNum],
    }));
  };

  const handleExpandAll = () => {
    setOpenStages({
      1: true,
      2: true,
      3: true,
      4: true,
      5: true,
      6: true,
    });
  };

  const handleCollapseAll = () => {
    setOpenStages({
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
      6: false,
    });
  };

  const isStageComplete = (num) => {
    if (num === 1) return Boolean(previewUrlA && previewUrlB);
    return Boolean(response);
  };

  return (
    <section className="pipeline-stepper-section" id="pipeline-stepper">
      {/* Stepper Header & Global Controls */}
      <div className="stepper-master-header">
        <div className="stepper-title-box">
          <div className="stepper-icon-glow">
            <Layers size={22} color="var(--accent-primary)" />
          </div>
          <div>
            <h2>6-Stage Pipeline Stepper &amp; Inspection</h2>
            <p>{isLoading ? 'Transforming signature matrices across pipeline stages...' : 'End-to-end mathematical and spatial transformation visualizer'}</p>
          </div>
        </div>

        <div className="stepper-actions-bar">
          <button
            type="button"
            className="stepper-action-btn"
            onClick={handleExpandAll}
          >
            Expand All
          </button>
          <button
            type="button"
            className="stepper-action-btn"
            onClick={handleCollapseAll}
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Step Navigation Bar */}
      <nav className="stepper-nav-bar" aria-label="Pipeline Stages Navigation">
        {STAGES.map((s) => {
          const completed = isStageComplete(s.id);
          const isOpen = Boolean(openStages[s.id]);
          const Icon = s.icon;

          return (
            <button
              key={s.id}
              type="button"
              className={`step-nav-chip ${isOpen ? 'is-open' : ''} ${completed ? 'is-completed' : ''}`}
              onClick={() => toggleStage(s.id)}
            >
              <div className="chip-left">
                <span className="chip-num">{s.id}</span>
                <Icon size={14} className="chip-icon" />
              </div>
              <div className="chip-text">
                <span className="chip-name">{s.name}</span>
                <span className="chip-badge">{s.badge}</span>
              </div>
              {completed ? (
                <CheckCircle2 size={13} className="chip-status-icon completed" />
              ) : (
                <CircleDot size={13} className="chip-status-icon pending" />
              )}
            </button>
          );
        })}
      </nav>

      {/* 6 Stage Containers */}
      <div className="stages-flow-list">
        {/* Stage 1: Acquisition (Phase 4) */}
        <Stage1Acquisition
          fileA={fileA}
          previewUrlA={previewUrlA}
          fileB={fileB}
          previewUrlB={previewUrlB}
          isOpen={openStages[1]}
          onToggle={() => toggleStage(1)}
        />

        {/* Stage 2: Binary Matrix 64x64 (Phase 4) */}
        <Stage2BinaryMatrix
          response={response}
          isOpen={openStages[2]}
          onToggle={() => toggleStage(2)}
        />

        {/* Stage 3: Compressed Matrix 16x16 (Phase 5) */}
        <Stage3CompressedMatrix
          response={response}
          isOpen={openStages[3]}
          onToggle={() => toggleStage(3)}
        />

        {/* Stage 4: Row/Col Density Profiling (Phase 6) */}
        <Stage4Profiling
          response={response}
          isOpen={openStages[4]}
          onToggle={() => toggleStage(4)}
        />

        {/* Stage 5: Final Fingerprint String (Phase 7) */}
        <Stage5Fingerprint
          response={response}
          isOpen={openStages[5]}
          onToggle={() => toggleStage(5)}
        />

        {/* Stage 6: LCS Comparison & Verdict (Phase 8) */}
        <Stage6LCSComparison
          response={response}
          isOpen={openStages[6]}
          onToggle={() => toggleStage(6)}
        />
      </div>
    </section>
  );
}
