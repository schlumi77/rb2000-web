
import React from 'react';
import { useSettings } from '../context/SettingsContext';
import type { Algorithm, CalculationParams } from '../utils/calculations';

const SettingsView: React.FC = () => {
  const { params, units, updateParams, updateUnits, resetToDefaults } = useSettings();

  const handleUnitToggle = () => {
    updateUnits(units === 'Metric' ? 'Imperial' : 'Metric');
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
        <div className="row" onClick={handleUnitToggle} style={{ cursor: 'pointer' }}>
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
            onChange={(e) => handleNumChange('amv', e.target.value)}
          />
        </div>
        <div className="row">
          <span className="label">Ke</span>
          <input 
            type="number" 
            value={params.ke}
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
            onChange={(e) => handleNumChange('kr', e.target.value)}
          />
        </div>
        <div className="row">
          <span className="label">V [l]</span>
          <input 
            type="number" 
            value={params.v}
            onChange={(e) => handleNumChange('v', e.target.value)}
          />
        </div>
        <div className="row">
          <span className="label">p_surf [{units === 'Metric' ? 'bar' : 'ata'}]</span>
          <input 
            type="number" 
            step="0.01"
            value={params.pSurf}
            onChange={(e) => handleNumChange('pSurf', e.target.value)}
          />
        </div>
        <div className="row">
          <span className="label">dpdt [{units === 'Metric' ? 'bar/m' : 'ata/ft'}]</span>
          <input 
            type="number" 
            step="0.01"
            value={params.dpdt}
            onChange={(e) => handleNumChange('dpdt', e.target.value)}
          />
        </div>
        <div className="row">
          <span className="label">Algorithm</span>
          <select 
            value={params.algorithm} 
            onChange={(e) => updateParams({ algorithm: e.target.value as Algorithm })}
          >
            <option value="Standard">Standard</option>
            <option value="Aspacher">Aspacher</option>
          </select>
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
