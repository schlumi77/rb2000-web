
import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { mToFt, ftToM } from '../utils/calculations';
import SliderRow from './SliderRow';

// Canonical maximum operating depth, stored in metres.
const MAX_DEPTH_M = 200;

interface DepthSliderProps {
  /** Current depth in canonical metres. */
  depth: number;
  /** Receives the new depth in canonical metres. */
  onChange: (depthMeters: number) => void;
}

/**
 * Depth input that always stores metres internally but lets the user pick a
 * value in the active unit system (m or ft). Centralising this keeps the four
 * calculator views from drifting apart on unit handling.
 */
const DepthSlider: React.FC<DepthSliderProps> = ({ depth, onChange }) => {
  const { units } = useSettings();
  const isMetric = units === 'Metric';

  const unit = isMetric ? 'm' : 'ft';
  const displayValue = isMetric ? depth : Math.round(mToFt(depth));
  const max = isMetric ? MAX_DEPTH_M : Math.round(mToFt(MAX_DEPTH_M));
  const step = isMetric ? 1 : 5;

  return (
    <SliderRow
      label="Depth"
      value={displayValue}
      min={0}
      max={max}
      step={step}
      unit={unit}
      ariaLabel={`Depth in ${unit}`}
      onChange={(value) => onChange(isMetric ? value : ftToM(value))}
    />
  );
};

export default DepthSlider;
