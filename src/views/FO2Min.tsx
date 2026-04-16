
import React, { useState, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { calculateFO2Min, calculatePAmb, CONSTANTS, mToFt } from '../utils/calculations';

const FO2Min: React.FC = () => {
  const { params, units } = useSettings();
  const [depth, setDepth] = useState(21);
  const [pO2MinTarget, setPO2MinTarget] = useState(21); // In percent (0.21)

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

  const displayDepth = units === 'Metric' ? depth : Math.round(mToFt(depth));
  const depthUnit = units === 'Metric' ? 'm' : 'ft';
  const pressureUnit = units === 'Metric' ? 'bar' : 'ata';

  return (
    <div>
      <h3 className="section-title">Inputs</h3>
      <div className="card">
        <div className="row">
          <span className="label">Depth</span>
          <span className="value">{displayDepth} <span className="unit">{depthUnit}</span></span>
        </div>
        <input type="range" min="0" max="60" value={depth} onChange={(e) => setDepth(parseInt(e.target.value))} />
        
        <div className="row">
          <span className="label">Target pO2</span>
          <span className="value">{(pO2MinTarget/100).toFixed(2)} <span className="unit">{pressureUnit}</span></span>
        </div>
        <input type="range" min="16" max="160" value={pO2MinTarget} onChange={(e) => setPO2MinTarget(parseInt(e.target.value))} />
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
            {results.pO2OC.toFixed(3)} <span className="unit">{pressureUnit}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default FO2Min;
