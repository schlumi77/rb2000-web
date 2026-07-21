
import React, { useState, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { calculateGasDensity, CONSTANTS } from '../utils/calculations';
import DepthSlider from '../components/DepthSlider';
import SliderRow from '../components/SliderRow';

const GasDensity: React.FC = () => {
  const { params } = useSettings();
  const [depth, setDepth] = useState(45);
  const [fO2, setFO2] = useState(21);
  const [fHe, setFHe] = useState(35);

  const handleFO2Change = (val: number) => {
    setFO2(val);
    if (val + fHe > 100) setFHe(100 - val);
  };

  const handleFHeChange = (val: number) => {
    setFHe(val);
    if (fO2 + val > 100) setFO2(100 - val);
  };

  const density = useMemo(() => {
    return calculateGasDensity(depth, fO2 / 100, fHe / 100, params.pSurf, params.dpdt);
  }, [depth, fO2, fHe, params]);

  const isSafe = density <= CONSTANTS.LIMIT_GAS_DENSITY;

  return (
    <div>
      <h3 className="section-title">Inputs</h3>
      <div className="card">
        <DepthSlider depth={depth} onChange={setDepth} />

        <SliderRow
          label="fO2 (Oxygen)"
          value={fO2}
          min={1}
          max={100}
          unit="%"
          ariaLabel="fO2 (oxygen) in percent"
          onChange={handleFO2Change}
        />

        <SliderRow
          label="fHe (Helium)"
          value={fHe}
          min={0}
          max={99}
          unit="%"
          ariaLabel="fHe (helium) in percent"
          onChange={handleFHeChange}
        />

        <div className="row">
          <span className="label">fN2 (Nitrogen)</span>
          <span className="value">{100 - fO2 - fHe} <span className="unit">%</span></span>
        </div>
      </div>

      <h3 className="section-title">Results</h3>
      <div className="card">
        <div className="row">
          <span className="label">Gas Density</span>
          <span className={`value ${isSafe ? '' : 'danger'}`} style={{ color: isSafe ? 'var(--safe-color)' : 'var(--danger-color)' }}>
            {density.toFixed(2)} <span className="unit">g/l</span>
          </span>
        </div>
        {!isSafe && (
          <div style={{ fontSize: '0.8em', color: 'var(--danger-color)', marginTop: '8px', textAlign: 'center' }}>
            Warning: Density exceeds safe limit (5.2 g/l)
          </div>
        )}
      </div>
    </div>
  );
};

export default GasDensity;
