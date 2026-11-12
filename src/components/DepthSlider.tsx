
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
  // The slider moves in whole metres or whole feet. A depth picked in one unit
  // is generally not a whole number in the other (70 ft = 21.336 m), so the
  // metric readout keeps one decimal to stay close to the depth actually used
  // in the calculations.
  const sliderValue = Math.round(isMetric ? depth : mToFt(depth));
  const displayValue = isMetric ? Number(depth.toFixed(1)) : sliderValue;
  // Floor so the deepest selectable foot never exceeds MAX_DEPTH_M.
  const max = isMetric ? MAX_DEPTH_M : Math.floor(mToFt(MAX_DEPTH_M));

  return (
    <SliderRow
      label="Depth"
      value={sliderValue}
      displayValue={displayValue}
      min={0}
      max={max}
      unit={unit}
      ariaLabel={`Depth in ${unit}`}
      onChange={(value) => onChange(isMetric ? value : ftToM(value))}
    />
  );
};

export default DepthSlider;
