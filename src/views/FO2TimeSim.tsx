
import React, { useMemo } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useDiveInputs } from '../context/DiveInputsContext';
import {
  simulateLoopGas,
  sampleEveryMinute,
  calculateFO2GG,
  calculatePAmb,
  assessPO2Limits,
  toDisplayPressure,
  pressureUnit as unitFor,
  CONSTANTS,
} from '../utils/calculations';
import { valueAxisTicks, minuteAxisTicks } from '../utils/chartAxis';
import DepthSlider from '../components/DepthSlider';
import SliderRow from '../components/SliderRow';
import SimSummary from '../components/SimSummary';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const FO2TimeSim: React.FC = () => {
  const { params, units } = useSettings();
  const { depth, setDepth, fO2Mix, setFO2Mix, fO2Start, setFO2Start } = useDiveInputs();

  const { simulation, summary } = useMemo(() => {
    const result = simulateLoopGas(depth, fO2Mix / 100, fO2Start / 100, params);

    // The summary uses the full-resolution simulation (one step per breath),
    // so crossing times aren't rounded to the per-minute chart samples.
    const steadyFO2 = calculateFO2GG(depth, fO2Mix / 100, params);
    const summary = {
      steadyFO2: steadyFO2 * 100,
      steadyPO2: steadyFO2 * calculatePAmb(depth, params.pSurf, params.dpdt),
      limits: assessPO2Limits(result),
    };

    // One point per whole minute keeps the chart and table readable.
    const sampled = sampleEveryMinute(result);
    const chartData = sampled.time.map((t, i) => ({
      time: t,
      fO2: sampled.fO2[i] * 100,
      pO2: sampled.pO2[i],
    }));

    return { simulation: chartData, summary };
  }, [depth, fO2Mix, fO2Start, params]);

  // The simulation and limit checks are in bar; the chart and table show
  // pO2 in the selected unit (bar or ata).
  const pressureUnit = unitFor(units);
  const show = (bar: number) => toDisplayPressure(bar, units);
  const rows = simulation.map((d) => ({ ...d, pO2Display: show(d.pO2) }));
  const isOutsideLimits = (bar: number) =>
    bar < CONSTANTS.PPO2_LOW_LIMIT || bar > CONSTANTS.PPO2_HIGH_LIMIT;

  // Fixed ticks keep the axis labels round and the high limit line on the
  // chart even when the loop pO2 goes far above it.
  const yTicks = valueAxisTicks(Math.max(0, ...rows.map((d) => d.pO2Display)), show(CONSTANTS.PPO2_HIGH_LIMIT));
  const xTicks = minuteAxisTicks(simulation.length > 0 ? simulation[simulation.length - 1].time : 0);

  return (
    <div className="sim-view">
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

        <SliderRow
          label="Start Loop fO2"
          value={fO2Start}
          min={1}
          max={100}
          unit="%"
          ariaLabel="Start loop fO2 in percent"
          onChange={setFO2Start}
        />
      </div>

      <h3 className="section-title">Summary</h3>
      <SimSummary {...summary} units={units} />

      <h3 className="section-title">pO2 Over Time</h3>
      <div className="card" style={{ height: '300px', padding: '10px 20px 10px 0' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              type="number"
              domain={[0, 'dataMax']}
              ticks={xTicks}
              label={{ value: 'min', position: 'insideBottomRight', offset: -5 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, yTicks[yTicks.length - 1]]}
              ticks={yTicks}
              tickFormatter={(v: number) => v.toFixed(1)}
              label={{ value: pressureUnit, angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any) => [Number(value).toFixed(3), 'pO2']}
              labelFormatter={(label) => `Time: ${label} min`}
            />
            <ReferenceLine y={show(CONSTANTS.PPO2_HIGH_LIMIT)} stroke="var(--danger-color)" strokeDasharray="3 3" />
            <ReferenceLine y={show(CONSTANTS.PPO2_LOW_LIMIT)} stroke="var(--danger-color)" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="pO2Display"
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
            {rows.map((d) => (
              <tr key={d.time} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '10px' }}>{d.time}</td>
                <td style={{ padding: '10px' }}>{d.fO2.toFixed(1)}%</td>
                <td style={{ padding: '10px', color: isOutsideLimits(d.pO2) ? 'var(--danger-color)' : 'var(--primary-color)' }}>
                  {d.pO2Display.toFixed(3)}
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
