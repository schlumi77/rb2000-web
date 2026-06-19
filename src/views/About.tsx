
import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface AboutProps {
  onBack: () => void;
}

// Descriptions provided by the developer — kept verbatim for a safety tool.
const CALCULATIONS = [
  {
    name: 'fO2',
    desc: 'Calculates an estimate for the final fraction of O2 in rebreather based on set depth and set fraction of O2 in gas which is supplied to the rebreather (fO2_mix).',
  },
  {
    name: 'fO2(t)',
    desc: 'Calculates an estimate of the fraction of O2 in rebreather as a function of time, based on set depth, set fraction of O2 in gas which is supplied to the rebreather (fO2_mix) and initial fraction of O2 in the breathing loop (fO2_start).',
  },
  {
    name: 'fO2min',
    desc: 'Calculates an estimate of the minimal fraction of O2 necessary in gas supplied to rebreather for a given depth and a given minimal O2 partial pressure (pO2min).',
  },
  {
    name: 'Gas Density',
    desc: 'Calculates the gas density based on fO2, fHe and depth for trimix gas mixtures.',
  },
];

const About: React.FC<AboutProps> = ({ onBack }) => {
  return (
    <div>
      <button
        onClick={onBack}
        aria-label="Back to settings"
        style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--primary-color)', margin: '4px 0' }}
      >
        <ChevronLeft size={20} /> Settings
      </button>

      <h3 className="section-title">About</h3>
      <div className="card">
        <div className="row">
          <span className="label">RB2000</span>
          <span className="value">v{__APP_VERSION__}</span>
        </div>
        <p style={{ margin: '8px 4px 4px', color: 'var(--text-secondary)', fontSize: '0.9em', lineHeight: 1.5 }}>
          This application supports the user to estimate the O2 fraction of the gas in passive
          addition semi-closed rebreathers (e.g. RB2000 and RB80). The developer does not guarantee
          the correctness of the calculated values - always check the estimated values for
          correctness. Choose breathing and system parameters carefully. In case of doubt use a ppO2
          meter while diving.
        </p>
      </div>

      <h3 className="section-title">Calculations</h3>
      <div className="card">
        {CALCULATIONS.map((c, i) => (
          <div
            key={c.name}
            style={{
              padding: '10px 4px',
              borderBottom: i < CALCULATIONS.length - 1 ? '1px solid var(--border-color)' : 'none',
            }}
          >
            <div className="label" style={{ fontWeight: 600, marginBottom: '4px' }}>{c.name}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9em', lineHeight: 1.5 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default About;
