import { describe, it, expect } from 'vitest';
import { valueAxisTicks, minuteAxisTicks } from './chartAxis';

describe('valueAxisTicks', () => {
  it('keeps the minimum top when all values are below it', () => {
    // Default dive: loop pO2 peaks at 1.35, the 1.60 limit stays on the chart.
    expect(valueAxisTicks(1.35, 1.6)).toEqual([0, 0.4, 0.8, 1.2, 1.6]);
  });

  it('rounds the top up to a whole step above the maximum', () => {
    // Regression: the axis top was the raw data maximum (e.g. 2.99988522).
    expect(valueAxisTicks(2.84, 1.6)).toEqual([0, 0.8, 1.6, 2.4, 3.2]);
  });

  it('keeps a value exactly on a step as the top tick', () => {
    expect(valueAxisTicks(1.6, 1.6)).toEqual([0, 0.4, 0.8, 1.2, 1.6]);
    // 2.4 fits in exactly six 0.4 steps, so the finer step is kept.
    expect(valueAxisTicks(2.4, 1.6)).toEqual([0, 0.4, 0.8, 1.2, 1.6, 2, 2.4]);
  });

  it('uses a coarser step for large values so there are at most six intervals', () => {
    // Pure O2 at 200 m: pO2 = 21 bar.
    const ticks = valueAxisTicks(21, 1.6);
    expect(ticks).toEqual([0, 4, 8, 12, 16, 20, 24]);
  });

  it('returns ticks free of floating-point noise', () => {
    for (const max of [0.5, 1.35, 2.84, 5.5, 13]) {
      for (const t of valueAxisTicks(max, 1.6)) {
        expect(t).toBe(Number(t.toFixed(2)));
      }
    }
  });

  it('falls back to the minimum top for non-finite input', () => {
    expect(valueAxisTicks(NaN, 1.6)).toEqual([0, 0.4, 0.8, 1.2, 1.6]);
  });
});

describe('minuteAxisTicks', () => {
  it('uses round minutes for the default 35-minute simulation', () => {
    // Regression: the axis showed 0, 9, 18, 27, 35.
    expect(minuteAxisTicks(35)).toEqual([0, 10, 20, 30]);
  });

  it('uses a finer step for short simulations', () => {
    expect(minuteAxisTicks(6)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(minuteAxisTicks(12)).toEqual([0, 2, 4, 6, 8, 10, 12]);
    expect(minuteAxisTicks(25)).toEqual([0, 5, 10, 15, 20, 25]);
  });

  it('uses a coarser step for long simulations', () => {
    expect(minuteAxisTicks(170)).toEqual([0, 30, 60, 90, 120, 150]);
  });

  it('handles a zero-length or invalid end', () => {
    expect(minuteAxisTicks(0)).toEqual([0]);
    expect(minuteAxisTicks(NaN)).toEqual([0]);
  });
});
