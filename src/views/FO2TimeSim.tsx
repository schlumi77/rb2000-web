
import React, { useState, useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { simulateLoopGas, CONSTANTS, mToFt } from '../utils/calculations';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const FO2TimeSim: React.FC = () => {
  const { params, units } = useSettings();
  const [depth, setDepth] = useState(21);
  const [fO2Mix, setFO2Mix] = useState(50);
  const [fO2Start, setFO2Start] = useState(21);

  const simulation = useMemo(() => {
    const result = simulateLoopGas(depth, fO2Mix / 100, fO2Start / 100, params);
    
    // Transform for Recharts
    const chartData = result.time.map((t, i) => ({
      time: t,
      fO2: result.fO2[i] * 100,
      pO2: result.pO2[i]
    })).filter((_, i) => i % params.freq === 0 || i === result.time.length - 1); // Sample every minute for the graph/table to keep it clean

    return chartData;
  }, [depth, fO2Mix, fO2Start, params]);

  const displayDepth = units === 'Metric' ? depth : Math.round(mToFt(depth));
  const depthUnit = units === 'Metric' ? 'm' : 'ft';
  const pressureUnit = units === 'Metric' ? 'bar' : 'ata';

  return (
    <div className="sim-view">
      <h3 className="section-title">Inputs</h3>
      <div className="card">
        <div className="row">
          <span className="label">Depth</span>
          <span className="value">{displayDepth} <span className="unit">{depthUnit}</span></span>
        </div>
        <input type="range" min="0" max="200" value={depth} onChange={(e) => setDepth(parseInt(e.target.value))} />
        
        <div className="row">
          <span className="label">Supply fO2</span>
          <span className="value">{fO2Mix} <span className="unit">%</span></span>
        </div>
        <input type="range" min="10" max="100" value={fO2Mix} onChange={(e) => setFO2Mix(parseInt(e.target.value))} />

        <div className="row">
          <span className="label">Start Loop fO2</span>
          <span className="value">{fO2Start} <span className="unit">%</span></span>
        </div>
        <input type="range" min="10" max="100" value={fO2Start} onChange={(e) => setFO2Start(parseInt(e.target.value))} />
      </div>

      <h3 className="section-title">pO2 Over Time</h3>
      <div className="card" style={{ height: '300px', padding: '10px 20px 10px 0' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={simulation}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="time" 
              label={{ value: 'min', position: 'insideBottomRight', offset: -5 }} 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={[0, 1.6]} 
              label={{ value: pressureUnit, angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [Number(value).toFixed(3), 'pO2']}
              labelFormatter={(label) => `Time: ${label} min`}
            />
            <ReferenceLine y={CONSTANTS.PPO2_HIGH_LIMIT} stroke="var(--danger-color)" strokeDasharray="3 3" />
            <ReferenceLine y={CONSTANTS.PPO2_LOW_LIMIT} stroke="var(--danger-color)" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="pO2" 
              stroke="var(--primary-color)" 
              dot={false} 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3 className="section-title">Data Points</h3>
      <div className="card" style={{ maxHeight: '300px', overflowY: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '10px', textAlign: 'left' }}>t (min)</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>fO2 (%)</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>pO2 ({pressureUnit})</th>
            </tr>
          </thead>
          <tbody>
            {simulation.map((d) => (
              <tr key={d.time} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '10px' }}>{d.time}</td>
                <td style={{ padding: '10px' }}>{d.fO2.toFixed(1)}%</td>
                <td style={{ padding: '10px', color: (d.pO2 < 0.16 || d.pO2 > 1.6) ? 'var(--danger-color)' : 'var(--primary-color)' }}>
                  {d.pO2.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FO2TimeSim;
