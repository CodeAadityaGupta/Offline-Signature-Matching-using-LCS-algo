import React from 'react';
import StageCard from './StageCard';
import { Sparkles, BarChart2, KeyRound, GitCompare } from 'lucide-react';

const STAGE_CONFIGS = {
  4: {
    title: 'Stage 4: Row/Column Density Profiling',
    subtitle: 'Extract 16 row density sums and 16 column density sums for both signatures.',
    icon: BarChart2,
    badge: 'Density Arrays',
    rule: 'Row Density = Σ(Ink per row) | Col Density = Σ(Ink per col)',
    deliverablePhase: 'Phase 6',
    outputShape: 'Two 16-element integer arrays per signature ([16], [16])',
  },
  5: {
    title: 'Stage 5: Fingerprint String Generation',
    subtitle: 'Group into 8 pairs, compute averages, and quantize into a 16-character hexadecimal string.',
    icon: KeyRound,
    badge: '16-Char String',
    rule: 'Intensity bucket (0..15) → Hex character (0..9, A..F)',
    deliverablePhase: 'Phase 7',
    outputShape: '16-character string e.g. "015AF87025978753"',
  },
  6: {
    title: 'Stage 6: LCS Comparison & Dynamic Programming',
    subtitle: 'Compute Longest Common Subsequence DP matrix (17×17), traceback path, and verdict.',
    icon: GitCompare,
    badge: 'LCS & DP Table',
    rule: 'DP[i][j] = DP[i-1][j-1]+1 if s1[i-1]==s2[j-1] else max(DP[i-1][j], DP[i][j-1])',
    deliverablePhase: 'Phase 8',
    outputShape: 'LCS length, similarity %, 17×17 DP grid, traceback coordinates',
  },
};

export default function StagePlaceholder({
  stageNumber,
  response,
  isOpen,
  onToggle,
}) {
  const config = STAGE_CONFIGS[stageNumber];
  if (!config) return null;

  const isCompleted = Boolean(response);

  return (
    <StageCard
      stageNumber={stageNumber}
      title={config.title}
      subtitle={config.subtitle}
      icon={config.icon}
      badge={config.badge}
      rule={config.rule}
      isCompleted={isCompleted}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="stage-placeholder-card">
        <div className="placeholder-icon-wrapper">
          <config.icon size={28} />
        </div>

        <div className="placeholder-content">
          <h4>{config.title} Shell Active</h4>
          <p>{config.subtitle}</p>
          <div className="placeholder-meta-tags">
            <span className="placeholder-tag phase">Upcoming {config.deliverablePhase}</span>
            <span className="placeholder-tag shape">Expected: {config.outputShape}</span>
          </div>
        </div>

        {response && (
          <div className="placeholder-preview-pill">
            <Sparkles size={14} color="var(--accent-cyan)" />
            <span>Response data received and ready for rendering in {config.deliverablePhase}</span>
          </div>
        )}
      </div>
    </StageCard>
  );
}
