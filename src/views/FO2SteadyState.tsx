
import React, { useState, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { calculateFO2GG, calculatePAmb, CONSTANTS } from '../utils/calculations';
import DepthSlider from '../components/DepthSlider';
import SliderRow from '../components/SliderRow';

const FO2SteadyState: React.FC = () => {
  const { params, units } = useSettings();
  const [depth, setDepth] = useState(21);
  const [fO2Mix, setFO2Mix] = useState(50);

  const results = useMemo(() => {
    const fO2GG = calculateFO2GG(depth, fO2Mix / 100, params);
    const pAmb = calculatePAmb(depth, params.pSurf, params.dpdt);
    const pO2GG = fO2GG * pAmb;
    const pO2OC = (fO2Mix / 100) * pAmb;

    return {
      fO2GG: fO2GG * 100,
      pO2GG,
      pO2OC,
      isPPO2Safe: pO2GG >= CONSTANTS.PPO2_LOW_LIMIT && pO2GG <= CONSTANTS.PPO2_HIGH_LIMIT,
      isPPO2OCSafe: pO2OC >= CONSTANTS.PPO2_LOW_LIMIT && pO2OC <= CONSTANTS.PPO2_HIGH_LIMIT
    };
  }, [depth, fO2Mix, params]);

  const pressureUnit = units === 'Metric' ? 'bar' : 'ata';

  return (
    <div>
      <h3 className="section-title">Inputs</h3>
      <div className="card">
        <DepthSlider depth={depth} onChange={setDepth} />

        <SliderRow
          label="Supply fO2"
          value={fO2Mix}
          min={1}
          max={100}
          unit="%"
          ariaLabel="Supply fO2 in percent"
          onChange={setFO2Mix}
        />
      </div>

      <h3 className="section-title">Results (Steady State)</h3>
      <div className="card">
        <div className="row">
          <span className="label">Loop fO2</span>
          <span className="value">{results.fO2GG.toFixed(1)} <span className="unit">%</span></span>
        </div>
        <div className="row">
          <span className="label">Loop pO2</span>
          <span className={`value ${results.isPPO2Safe ? '' : 'danger'}`} style={{ color: results.isPPO2Safe ? 'var(--safe-color)' : 'var(--danger-color)' }}>
            {results.pO2GG.toFixed(3)} <span className="unit">{pressureUnit}</span>
          </span>
        </div>
      </div>

      <h3 className="section-title">Bailout (Open Circuit)</h3>
      <div className="card">
        <div className="row">
          <span className="label">OC pO2</span>
          <span className={`value ${results.isPPO2OCSafe ? '' : 'danger'}`} style={{ color: results.isPPO2OCSafe ? 'var(--safe-color)' : 'var(--danger-color)' }}>
            {results.pO2OC.toFixed(3)} <span className="unit">{pressureUnit}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default FO2SteadyState;
