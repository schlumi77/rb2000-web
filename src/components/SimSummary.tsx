import React from 'react';
import { CONSTANTS } from '../utils/calculations';
import type { PO2LimitAssessment } from '../utils/calculations';

interface SimSummaryProps {
  /** Steady-state loop fO2 in percent. */
  steadyFO2: number;
  /** Steady-state loop pO2 in bar/ata. */
  steadyPO2: number;
  /** How the simulated pO2 relates to the limits; null if nothing was simulated. */
  limits: PO2LimitAssessment | null;
  pressureUnit: string;
}

const formatTime = (minutes: number) => `${minutes.toFixed(1)} min`;
const limitText = (side: 'low' | 'high') =>
  side === 'high'
    ? `Above ${CONSTANTS.PPO2_HIGH_LIMIT.toFixed(2)}`
    : `Below ${CONSTANTS.PPO2_LOW_LIMIT.toFixed(2)}`;

const SAFE = 'var(--safe-color)';
const DANGER = 'var(--danger-color)';

/**
 * Summary card for the loop simulation: where the loop gas ends up (steady
 * state) and whether, and when, its pO2 crosses the safety limits — so the
 * key numbers can be read without studying the chart.
 */
const SimSummary: React.FC<SimSummaryProps> = ({ steadyFO2, steadyPO2, limits, pressureUnit }) => {
  const steadySafe =
    steadyPO2 >= CONSTANTS.PPO2_LOW_LIMIT && steadyPO2 <= CONSTANTS.PPO2_HIGH_LIMIT;

  let status: { text: string; color?: string } | null = null;
  if (limits?.status === 'within') status = { text: 'Within limits throughout', color: SAFE };
  if (limits?.status === 'leaves') status = { text: `${limitText(limits.side)} after ${formatTime(limits.time)}`, color: DANGER };
  if (limits?.status === 'returns') status = { text: `Within limits after ${formatTime(limits.time)}` };
  if (limits?.status === 'outside') status = { text: `${limitText(limits.side)} throughout`, color: DANGER };

  return (
    <div className="card">
      <div className="row">
        <span className="label">Steady-state loop fO2</span>
        <span className="value">
          {steadyFO2.toFixed(1)}
          <span className="unit">%</span>
        </span>
      </div>
      <div className="row">
        <span className="label">Steady-state loop pO2</span>
        <span className="value" style={{ color: steadySafe ? SAFE : DANGER }}>
          {steadyPO2.toFixed(3)}
          <span className="unit">{pressureUnit}</span>
        </span>
      </div>
      {status && (
        <div className="row">
          <span className="label">pO2 limits</span>
          <span className="value" style={{ color: status.color, textAlign: 'right' }}>
            {status.text}
          </span>
        </div>
      )}
    </div>
  );
};

export default SimSummary;
