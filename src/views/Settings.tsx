
import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { barPerMToAtaPerFt, ataPerFtToBarPerM } from '../utils/calculations';
import type { Algorithm, CalculationParams } from '../utils/calculations';
import About from './About';

const SettingsView: React.FC = () => {
  const { params, units, updateParams, updateUnits, resetToDefaults } = useSettings();
  const isMetric = units === 'Metric';
  const [showAbout, setShowAbout] = useState(false);

  if (showAbout) {
    return <About onBack={() => setShowAbout(false)} />;
  }

  const handleUnitToggle = () => {
    updateUnits(units === 'Metric' ? 'Imperial' : 'Metric');
  };

  // dpdt is stored canonically in bar/m. In Imperial mode it is shown and
  // edited in ata/ft, converting back to the canonical value on change.
  const dpdtDisplay = isMetric ? params.dpdt : Number(barPerMToAtaPerFt(params.dpdt).toFixed(4));
  const handleDpdtChange = (raw: string) => {
    const value = parseFloat(raw);
    if (!Number.isFinite(value)) return;
    updateParams({ dpdt: isMetric ? value : ataPerFtToBarPerM(value) });
  };

  // Only commit finite numbers. Clearing a field (parseFloat("") === NaN) or
  // typing an invalid value must never poison params, since NaN propagates
  // through every safety calculation and is persisted to localStorage.
  const handleNumChange = (key: keyof CalculationParams, raw: string) => {
    const value = parseFloat(raw);
    if (Number.isFinite(value)) {
      updateParams({ [key]: value } as Partial<CalculationParams>);
    }
  };

  return (
    <div>
      <h3 className="section-title">Unit System</h3>
      <div className="card">
        <div
          className="row"
          role="button"
          tabIndex={0}
          aria-label={`Unit system, currently ${units}. Activate to toggle.`}
          onClick={handleUnitToggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleUnitToggle();
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <span className="label">Unit System</span>
          <span className="value">{units}</span>
        </div>
      </div>

      <h3 className="section-title">Breathing Parameters</h3>
      <div className="card">
        <div className="row">
          <span className="label">RMV [l/min]</span>
          <input
            type="number"
            value={params.amv}
            aria-label="RMV in litres per minute"
            onChange={(e) => handleNumChange('amv', e.target.value)}
          />
        </div>
        <div className="row">
          <span className="label">Ke</span>
          <input
            type="number"
            value={params.ke}
            aria-label="Ke respiratory factor"
            onChange={(e) => handleNumChange('ke', e.target.value)}
          />
        </div>
        <div className="row">
          <span className="label">VO2 [l/min]</span>
          <span className="value">{(params.amv / params.ke).toFixed(1)}</span>
        </div>
        <div className="row">
          <span className="label">Freq [1/min]</span>
          <input
            type="number"
            value={params.freq}
            aria-label="Breathing frequency per minute"
            onChange={(e) => handleNumChange('freq', e.target.value)}
          />
        </div>
      </div>

      <h3 className="section-title">System Parameters</h3>
      <div className="card">
        <div className="row">
          <span className="label">Kr [%]</span>
          <input
            type="number"
            value={params.kr}
            aria-label="Kr gas leakage in percent"
            onChange={(e) => handleNumChange('kr', e.target.value)}
          />
        </div>
        <div className="row">
          <span className="label">V [l]</span>
          <input
            type="number"
            value={params.v}
            aria-label="System volume in litres"
            onChange={(e) => handleNumChange('v', e.target.value)}
          />
        </div>
        <div className="row">
          <span className="label">p_surf [{isMetric ? 'bar' : 'ata'}]</span>
          <input
            type="number"
            step="0.01"
            value={params.pSurf}
            aria-label={`Surface pressure in ${isMetric ? 'bar' : 'ata'}`}
            onChange={(e) => handleNumChange('pSurf', e.target.value)}
          />
        </div>
        <div className="row">
          <span className="label">dpdt [{isMetric ? 'bar/m' : 'ata/ft'}]</span>
          <input
            type="number"
            step={isMetric ? '0.01' : '0.001'}
            value={dpdtDisplay}
            aria-label={`Pressure gradient in ${isMetric ? 'bar per metre' : 'ata per foot'}`}
            onChange={(e) => handleDpdtChange(e.target.value)}
          />
        </div>
        <div className="row">
          <span className="label">Algorithm</span>
          <select
            value={params.algorithm}
            aria-label="Calculation algorithm"
            onChange={(e) => updateParams({ algorithm: e.target.value as Algorithm })}
          >
            <option value="Standard">Standard</option>
            <option value="Aspacher">Aspacher</option>
          </select>
        </div>
      </div>

      <h3 className="section-title">Information</h3>
      <div className="card">
        <div
          className="row"
          role="button"
          tabIndex={0}
          aria-label="About this app"
          onClick={() => setShowAbout(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowAbout(true);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
          <span className="label">About RB2000</span>
          <span className="value">›</span>
        </div>
      </div>

      <div style={{ padding: '20px', textAlign: 'center' }}>
        <button onClick={resetToDefaults} style={{ color: 'var(--danger-color)' }}>
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
