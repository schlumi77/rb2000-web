
import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import {
  barPerMToAtaPerFt,
  ataPerFtToBarPerM,
  toDisplayPressure,
  fromDisplayPressure,
  pressureUnit,
  PARAM_LIMITS,
} from '../utils/calculations';
import type { Algorithm } from '../utils/calculations';
import NumberField from '../components/NumberField';
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

  // pSurf and dpdt are stored canonically in bar and bar/m. In Imperial mode
  // they (and their allowed ranges) are shown and edited in ata and ata/ft,
  // converting back to the canonical value on commit. Display values are
  // rounded; an out-of-range rounding is pulled back by sanitizeParams.
  const unit = pressureUnit(units);
  const pSurfToDisplay = (bar: number) =>
    isMetric ? bar : Number(toDisplayPressure(bar, units).toFixed(4));
  const dpdtToDisplay = (barPerM: number) =>
    isMetric ? barPerM : Number(barPerMToAtaPerFt(barPerM).toFixed(5));

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
        <NumberField
          label="RMV [l/min]"
          value={params.amv}
          {...PARAM_LIMITS.amv}
          ariaLabel="RMV in litres per minute"
          onCommit={(amv) => updateParams({ amv })}
        />
        <NumberField
          label="Ke"
          value={params.ke}
          {...PARAM_LIMITS.ke}
          ariaLabel="Ke respiratory factor"
          onCommit={(ke) => updateParams({ ke })}
        />
        <div className="row">
          <span className="label">VO2 [l/min]</span>
          <span className="value">{(params.amv / params.ke).toFixed(1)}</span>
        </div>
        <NumberField
          label="Freq [1/min]"
          value={params.freq}
          {...PARAM_LIMITS.freq}
          ariaLabel="Breathing frequency per minute"
          onCommit={(freq) => updateParams({ freq })}
        />
      </div>

      <h3 className="section-title">System Parameters</h3>
      <div className="card">
        <NumberField
          label="Kr [%]"
          value={params.kr}
          {...PARAM_LIMITS.kr}
          ariaLabel="Kr gas leakage in percent"
          onCommit={(kr) => updateParams({ kr })}
        />
        <NumberField
          label="V [l]"
          value={params.v}
          {...PARAM_LIMITS.v}
          ariaLabel="System volume in litres"
          onCommit={(v) => updateParams({ v })}
        />
        <NumberField
          label={`p_surf [${unit}]`}
          value={pSurfToDisplay(params.pSurf)}
          min={pSurfToDisplay(PARAM_LIMITS.pSurf.min)}
          max={pSurfToDisplay(PARAM_LIMITS.pSurf.max)}
          step={isMetric ? '0.01' : 'any'}
          ariaLabel={`Surface pressure in ${unit}`}
          onCommit={(pSurf) => updateParams({ pSurf: fromDisplayPressure(pSurf, units) })}
        />
        <NumberField
          label={`dpdt [${isMetric ? 'bar/m' : 'ata/ft'}]`}
          value={dpdtToDisplay(params.dpdt)}
          min={dpdtToDisplay(PARAM_LIMITS.dpdt.min)}
          max={dpdtToDisplay(PARAM_LIMITS.dpdt.max)}
          step={isMetric ? '0.01' : 'any'}
          ariaLabel={`Pressure gradient in ${isMetric ? 'bar per metre' : 'ata per foot'}`}
          onCommit={(dpdt) => updateParams({ dpdt: isMetric ? dpdt : ataPerFtToBarPerM(dpdt) })}
        />
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
