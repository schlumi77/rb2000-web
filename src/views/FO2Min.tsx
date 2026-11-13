
import React, { useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useDiveInputs } from '../context/DiveInputsContext';
import {
  calculateFO2Min,
  calculatePAmb,
  toDisplayPressure,
  fromDisplayPressure,
  pressureUnit as unitFor,
  CONSTANTS,
} from '../utils/calculations';
import DepthSlider from '../components/DepthSlider';
import SliderRow from '../components/SliderRow';

const FO2Min: React.FC = () => {
  const { params, units } = useSettings();
  const { depth, setDepth, pO2MinTarget, setPO2MinTarget } = useDiveInputs();

  const results = useMemo(() => {
    const targetPO2 = pO2MinTarget / 100;
    const fO2Min = calculateFO2Min(depth, targetPO2, params);
    const pAmb = calculatePAmb(depth, params.pSurf, params.dpdt);
    const pO2OC = fO2Min * pAmb;

    return {
      fO2Min: fO2Min * 100,
      pO2OC,
      isPPO2Safe: pO2OC >= CONSTANTS.PPO2_LOW_LIMIT && pO2OC <= CONSTANTS.PPO2_HIGH_LIMIT
    };
  }, [depth, pO2MinTarget, params]);

  // Results and limit checks are in bar; only the display converts to ata.
  const pressureUnit = unitFor(units);

  // The target is stored in hundredths of a bar. The slider moves in whole
  // hundredths of the displayed unit (bar or ata), so a target picked in one
  // unit is generally not a whole hundredth in the other (0.21 ata = 0.2128
  // bar); the readout then shows a third decimal to stay close to the value
  // actually used. Conversions are linear, so they apply to hundredths as-is.
  const targetDisplay = toDisplayPressure(pO2MinTarget, units);
  const sliderValue = Math.round(targetDisplay);
  const isWholeHundredth = Math.abs(targetDisplay - sliderValue) < 1e-6;
  const targetText = (targetDisplay / 100).toFixed(isWholeHundredth ? 2 : 3);
  // Keep the selectable range inside the pO2 limits (checked in bar).
  const sliderMin = Math.ceil(toDisplayPressure(CONSTANTS.PPO2_LOW_LIMIT * 100, units) - 1e-9);
  const sliderMax = Math.floor(toDisplayPressure(CONSTANTS.PPO2_HIGH_LIMIT * 100, units) + 1e-9);

  return (
    <div>
      <h3 className="section-title">Inputs</h3>
      <div className="card">
        <DepthSlider depth={depth} onChange={setDepth} />

        <SliderRow
          label="Target pO2"
          value={sliderValue}
          min={sliderMin}
          max={sliderMax}
          unit={pressureUnit}
          displayValue={targetText}
          ariaLabel="Target pO2"
          onChange={(v) => setPO2MinTarget(fromDisplayPressure(v, units))}
        />
      </div>

      <h3 className="section-title">Required Supply Gas</h3>
      <div className="card">
        <div className="row">
          <span className="label">Min Supply fO2</span>
          <span className="value">{results.fO2Min.toFixed(1)} <span className="unit">%</span></span>
        </div>
      </div>

      <h3 className="section-title">Bailout Check</h3>
      <div className="card">
        <div className="row">
          <span className="label">OC pO2 at Depth</span>
          <span className={`value ${results.isPPO2Safe ? '' : 'danger'}`} style={{ color: results.isPPO2Safe ? 'var(--safe-color)' : 'var(--danger-color)' }}>
            {toDisplayPressure(results.pO2OC, units).toFixed(3)} <span className="unit">{pressureUnit}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default FO2Min;
