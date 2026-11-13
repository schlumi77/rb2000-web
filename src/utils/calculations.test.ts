
import { describe, it, expect } from 'vitest';
import type { CalculationParams } from './calculations';
import {
  calculatePAmb,
  calculateFO2GG,
  calculateFO2Min,
  calculateGasDensity,
  simulateLoopGas,
  mToFt,
  ftToM,
  barPerMToAtaPerFt,
  ataPerFtToBarPerM,
  barToAta,
  ataToBar,
  pressureUnit,
  toDisplayPressure,
  fromDisplayPressure,
  sanitizeParams,
  assessPO2Limits,
  sampleEveryMinute,
  PARAM_LIMITS,
  DEFAULT_PARAMS
} from './calculations';

const defaultParams: CalculationParams = { ...DEFAULT_PARAMS };

describe('RBCalculations Port', () => {
  describe('calculatePAmb', () => {
    it('should calculate pAmb correctly at various depths', () => {
      // at 10m: (1.0 + 0.1 * 10) / 1.0 = 2.0
      expect(calculatePAmb(10, 1.0, 0.1)).toBe(2.0);
      // at 0m: 1.0
      expect(calculatePAmb(0, 1.0, 0.1)).toBe(1.0);
      // at 200m: (1.0 + 0.1 * 200) / 1.0 = 21.0
      expect(calculatePAmb(200, 1.0, 0.1)).toBe(21.0);
    });

    it('should never return less than 0', () => {
      expect(calculatePAmb(-100, 1.0, 0.1)).toBe(0);
    });

    it('should return absolute pressure at altitude, not a multiple of surface pressure', () => {
      // Mountain lake with 0.8 bar at the surface.
      expect(calculatePAmb(0, 0.8, 0.1)).toBeCloseTo(0.8, 10);
      // at 10m: 0.8 + 0.1 * 10 = 1.8 bar absolute
      expect(calculatePAmb(10, 0.8, 0.1)).toBeCloseTo(1.8, 10);
    });
  });

  describe('altitude (pSurf below 1 bar)', () => {
    const altitudeParams: CalculationParams = { ...defaultParams, pSurf: 0.8 };

    it('should calculate fO2GG from absolute pressure', () => {
      // Depth 10m, fO2Mix 50%
      // pAmb = 1.8, VO2 = 0.8, Q_dump = 20 * 0.1 * 1.8 = 3.6
      // fO2GG = (0.5 * (3.6 + 0.8) - 0.8) / 3.6 = 1.4 / 3.6 ≈ 0.388889
      expect(calculateFO2GG(10, 0.5, altitudeParams)).toBeCloseTo(0.388889, 5);
    });

    it('should calculate fO2Min from absolute pressure', () => {
      // Depth 10m, pO2Min 0.21
      // fO2min = (((0.21 * 3.6) / 1.8) + 0.8) / (3.6 + 0.8) = 1.22 / 4.4 ≈ 0.277273
      expect(calculateFO2Min(10, 0.21, altitudeParams)).toBeCloseTo(0.277273, 5);
    });

    it('should calculate gas density from absolute pressure', () => {
      // Air at the surface of a 0.8 bar lake: 1.28817 * 0.8 = 1.030536
      expect(calculateGasDensity(0, 0.21, 0, 0.8, 0.1)).toBeCloseTo(1.030536, 5);
    });

    it('should simulate towards the absolute-pressure steady state', () => {
      const sim = simulateLoopGas(10, 0.5, 0.21, altitudeParams);
      const steady = calculateFO2GG(10, 0.5, altitudeParams);
      expect(sim.fO2[sim.fO2.length - 1]).toBeCloseTo(steady, 3);
      // pO2 is the loop fraction times absolute pressure (1.8 bar).
      expect(sim.pO2[0]).toBeCloseTo(0.21 * 1.8, 10);
    });
  });

  describe('calculateFO2GG', () => {
    it('should calculate fO2GG (Standard) correctly', () => {
      // Depth 21m, fO2Mix 50%
      // pAmb = 3.1
      // VO2 = 20/25 = 0.8
      // Q_dump = 20 * 0.1 * 3.1 = 6.2
      // fO2GG = (0.5 * (6.2 + 0.8) - 0.8) / 6.2 = (3.5 - 0.8) / 6.2 = 2.7 / 6.2 ≈ 0.43548
      const result = calculateFO2GG(21, 0.5, defaultParams);
      expect(result).toBeCloseTo(0.43548, 5);
    });

    it('should calculate fO2GG (Aspacher) correctly', () => {
      const aspacherParams: CalculationParams = { ...defaultParams, algorithm: 'Aspacher' };
      // Depth 21m, fO2Mix 50%
      // pAmb = 3.1, VO2 = 0.8, Q_dump = 6.2, Kr = 0.1
      // fO2GG = (0.5 * (6.2 + 0.9 * 0.8) - 0.9 * 0.8) / 6.2 
      //        = (0.5 * (6.2 + 0.72) - 0.72) / 6.2
      //        = (3.46 - 0.72) / 6.2 = 2.74 / 6.2 ≈ 0.441935
      const result = calculateFO2GG(21, 0.5, aspacherParams);
      expect(result).toBeCloseTo(0.441935, 5);
    });

    it('should clamp results between 0 and 1', () => {
      // Test very low fO2 mix or high AMV that might lead to negative fO2 without clamping
      const extremeParams: CalculationParams = { ...defaultParams, amv: 200, kr: 1 };
      const result = calculateFO2GG(0, 0.1, extremeParams);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateFO2Min', () => {
    it('should calculate fO2Min correctly', () => {
      // Depth 21m, pO2Min 0.21
      // pAmb = 3.1, VO2 = 0.8, Q_dump = 6.2
      // fO2min = (((0.21 * 6.2) / 3.1) + 0.8) / (6.2 + 0.8)
      //        = (0.42 + 0.8) / 7.0 = 1.22 / 7.0 ≈ 0.1742857
      const result = calculateFO2Min(21, 0.21, defaultParams);
      expect(result).toBeCloseTo(0.1742857, 5);
    });

    it('should calculate fO2Min (Aspacher) correctly', () => {
      const aspacherParams: CalculationParams = { ...defaultParams, algorithm: 'Aspacher' };
      // fO2min = (((pO2Min * Q_dump) / pAmb) + (1 - Kr_decimal) * VO2) / (Q_dump + (1 - Kr_decimal) * VO2)
      // (((0.21 * 6.2) / 3.1) + 0.9 * 0.8) / (6.2 + 0.9 * 0.8)
      // (0.42 + 0.72) / (6.2 + 0.72) = 1.14 / 6.92 ≈ 0.16473988
      const result = calculateFO2Min(21, 0.21, aspacherParams);
      expect(result).toBeCloseTo(0.16474, 5);
    });
  });

  describe('calculateGasDensity', () => {
    it('should calculate air density at surface correctly', () => {
      // Air at 0m: fO2=0.21, fHe=0, fN2=0.79
      // density = (0.21 * 1.428 + 0 * 0.179 + 0.79 * 1.251) * 1.0
      //         = 0.29988 + 0.98829 = 1.28817
      const result = calculateGasDensity(0, 0.21, 0, 1.0, 0.1);
      expect(result).toBeCloseTo(1.28817, 5);
    });

    it('should return 0 if fO2 + fHe > 1.0', () => {
      expect(calculateGasDensity(0, 0.6, 0.5, 1.0, 0.1)).toBe(0);
    });
  });

  describe('simulateLoopGas', () => {
    it('should return consistent arrays for time, fO2, and pO2', () => {
      const result = simulateLoopGas(21, 0.5, 0.21, defaultParams);
      expect(result.time.length).toBeGreaterThan(0);
      expect(result.fO2.length).toBe(result.time.length);
      expect(result.pO2.length).toBe(result.time.length);
      
      // Start value check
      expect(result.fO2[0]).toBe(0.21);
      
      // Trend check (fO2 should increase towards steady state 0.435)
      expect(result.fO2[result.fO2.length - 1]).toBeGreaterThan(0.21);
      expect(result.fO2[result.fO2.length - 1]).toBeLessThanOrEqual(1.0);
    });

    it('should not hang or produce Infinity loops when Kr is 0', () => {
      // Kr = 0 makes the legacy loop-count formula divide by zero (Infinity),
      // which would freeze the browser. The guard must bound it to a finite count.
      const noLeakParams: CalculationParams = { ...defaultParams, kr: 0 };
      const result = simulateLoopGas(21, 0.5, 0.21, noLeakParams);
      expect(result.time.length).toBe(0);
      expect(result.fO2.length).toBe(0);
      expect(result.pO2.length).toBe(0);
    });
  });

  describe('sanitizeParams', () => {
    it('should keep the defaults unchanged (defaults are within limits)', () => {
      expect(sanitizeParams(DEFAULT_PARAMS)).toEqual(DEFAULT_PARAMS);
    });

    it('should clamp out-of-range values into PARAM_LIMITS', () => {
      const result = sanitizeParams({ ...DEFAULT_PARAMS, amv: 2015, ke: 0, kr: -10, pSurf: 0 });
      expect(result.amv).toBe(PARAM_LIMITS.amv.max);
      expect(result.ke).toBe(PARAM_LIMITS.ke.min);
      expect(result.kr).toBe(PARAM_LIMITS.kr.min);
      expect(result.pSurf).toBe(PARAM_LIMITS.pSurf.min);
    });

    it('should replace non-finite, non-numeric and missing values with the fallback', () => {
      const result = sanitizeParams({ amv: NaN, ke: Infinity, kr: '10', v: null, algorithm: 'Bogus' });
      expect(result).toEqual(DEFAULT_PARAMS);
    });

    it('should fall back to the supplied previous params rather than the defaults', () => {
      const previous: CalculationParams = { ...DEFAULT_PARAMS, amv: 30, algorithm: 'Aspacher' };
      const result = sanitizeParams({ ...previous, amv: NaN, ke: 20 }, previous);
      expect(result.amv).toBe(30);
      expect(result.ke).toBe(20);
      expect(result.algorithm).toBe('Aspacher');
    });

    it('should yield finite results from every formula at the limits', () => {
      // Whatever is stored or typed, sanitized params must never produce NaN.
      for (const bound of ['min', 'max'] as const) {
        const params = sanitizeParams({
          amv: PARAM_LIMITS.amv[bound],
          ke: PARAM_LIMITS.ke[bound],
          kr: PARAM_LIMITS.kr[bound],
          v: PARAM_LIMITS.v[bound],
          freq: PARAM_LIMITS.freq[bound],
          pSurf: PARAM_LIMITS.pSurf[bound],
          dpdt: PARAM_LIMITS.dpdt[bound],
        });
        expect(Number.isFinite(calculateFO2GG(21, 0.5, params))).toBe(true);
        expect(Number.isFinite(calculateFO2Min(21, 0.21, params))).toBe(true);
        const sim = simulateLoopGas(21, 0.5, 0.21, params);
        expect(sim.fO2.every(Number.isFinite)).toBe(true);
      }
    });
  });

  describe('sampleEveryMinute', () => {
    it('should pick the exact step at each whole minute for an integer frequency', () => {
      const sim = simulateLoopGas(21, 0.5, 0.21, defaultParams); // freq 20
      const sampled = sampleEveryMinute(sim);
      expect(sampled.time.slice(0, 4)).toEqual([0, 1, 2, 3]);
      expect(sampled.fO2[0]).toBe(sim.fO2[0]);
      expect(sampled.fO2[1]).toBeCloseTo(sim.fO2[20], 12);
      expect(sampled.pO2[3]).toBeCloseTo(sim.pO2[60], 12);
    });

    it('should end at the last whole minute instead of a fractional end time', () => {
      // Regression: the chart's last point used to be the raw end time (35.95).
      const sim = simulateLoopGas(21, 0.5, 0.21, defaultParams);
      const sampled = sampleEveryMinute(sim);
      expect(sim.time[sim.time.length - 1]).toBeCloseTo(35.95, 10);
      expect(sampled.time[sampled.time.length - 1]).toBe(35);
      expect(sampled.time.every(Number.isInteger)).toBe(true);
    });

    it('should give one point per minute for a non-integer frequency', () => {
      // Regression: with freq 12.5 the old modulo sampling only matched every
      // second minute.
      const params: CalculationParams = { ...defaultParams, freq: 12.5 };
      const sim = simulateLoopGas(21, 0.5, 0.21, params);
      const sampled = sampleEveryMinute(sim);
      const lastMinute = Math.floor(sim.time[sim.time.length - 1]);
      expect(sampled.time).toEqual(Array.from({ length: lastMinute + 1 }, (_, i) => i));
    });

    it('should interpolate between breaths when a minute falls between steps', () => {
      // freq 12.5: minute 1 is step 12.5, halfway between steps 12 and 13.
      const params: CalculationParams = { ...defaultParams, freq: 12.5 };
      const sim = simulateLoopGas(21, 0.5, 0.21, params);
      const sampled = sampleEveryMinute(sim);
      expect(sampled.pO2[1]).toBeCloseTo((sim.pO2[12] + sim.pO2[13]) / 2, 12);
      // minute 2 is step 25 exactly
      expect(sampled.pO2[2]).toBeCloseTo(sim.pO2[25], 12);
    });

    it('should return empty arrays for an empty simulation', () => {
      expect(sampleEveryMinute({ time: [], fO2: [], pO2: [] })).toEqual({ time: [], fO2: [], pO2: [] });
    });
  });

  describe('assessPO2Limits', () => {
    // Builds a simulation from pO2 samples one minute apart.
    const simOf = (pO2: number[]) => ({ time: pO2.map((_, i) => i), fO2: pO2.map(() => 0), pO2 });

    it('should report a loop that stays within the limits', () => {
      expect(assessPO2Limits(simOf([0.6, 1.0, 1.4, 1.5]))).toEqual({ status: 'within' });
    });

    it('should report when a loop first rises above the high limit', () => {
      expect(assessPO2Limits(simOf([1.2, 1.5, 1.61, 1.7]))).toEqual({ status: 'leaves', time: 2, side: 'high' });
    });

    it('should report when a loop first drops below the low limit', () => {
      expect(assessPO2Limits(simOf([0.3, 0.2, 0.15, 0.1]))).toEqual({ status: 'leaves', time: 2, side: 'low' });
    });

    it('should treat values exactly at a limit as within', () => {
      expect(assessPO2Limits(simOf([0.16, 1.6]))).toEqual({ status: 'within' });
    });

    it('should report when a loop that starts outside comes back within the limits', () => {
      expect(assessPO2Limits(simOf([2.0, 1.8, 1.55, 1.4]))).toEqual({ status: 'returns', time: 2 });
    });

    it('should report the time from which the loop stays within, not the first dip inside', () => {
      expect(assessPO2Limits(simOf([1.7, 1.5, 1.65, 1.5, 1.4]))).toEqual({ status: 'returns', time: 3 });
    });

    it('should report a loop that is still outside at the end', () => {
      expect(assessPO2Limits(simOf([2.0, 1.9, 1.8]))).toEqual({ status: 'outside', side: 'high' });
      expect(assessPO2Limits(simOf([0.1, 0.12, 0.14]))).toEqual({ status: 'outside', side: 'low' });
    });

    it('should return null for an empty simulation', () => {
      expect(assessPO2Limits(simOf([]))).toBeNull();
    });

    it('should find the crossing in a real simulation', () => {
      // 40m with 60% supply: steady-state pO2 ≈ 2.4 bar, so a loop starting
      // at 21% (0.105 x 5 bar = 1.05 bar) must rise past 1.60.
      const sim = simulateLoopGas(40, 0.6, 0.21, defaultParams);
      const result = assessPO2Limits(sim);
      expect(result?.status).toBe('leaves');
      if (result?.status !== 'leaves') return;
      expect(result.side).toBe('high');
      const i = sim.time.indexOf(result.time);
      expect(sim.pO2[i]).toBeGreaterThan(1.6);
      expect(sim.pO2[i - 1]).toBeLessThanOrEqual(1.6);
    });
  });

  describe('Unit Conversions', () => {
    it('should convert meters to feet correctly', () => {
      // 1 ft = 0.3048 m exactly
      expect(mToFt(10)).toBeCloseTo(32.8084, 4);
      expect(mToFt(200)).toBeCloseTo(656.168, 3);
    });

    it('should convert feet to meters correctly', () => {
      expect(ftToM(100)).toBeCloseTo(30.48, 10);
      expect(ftToM(mToFt(10))).toBeCloseTo(10, 10);
    });

    it('should convert bar to ata and back', () => {
      // 1 atm = 1.01325 bar exactly
      expect(barToAta(1.01325)).toBeCloseTo(1, 12);
      expect(barToAta(1.6)).toBeCloseTo(1.57908, 5);
      expect(ataToBar(1)).toBeCloseTo(1.01325, 12);
      expect(ataToBar(barToAta(1.35))).toBeCloseTo(1.35, 12);
    });

    it('should convert the pressure gradient bar/m to ata/ft', () => {
      // 0.1 bar/m / 1.01325 bar/ata * 0.3048 m/ft = 0.0300814 ata/ft
      expect(barPerMToAtaPerFt(0.1)).toBeCloseTo(0.0300814, 7);
    });

    it('should round-trip the pressure gradient conversion', () => {
      expect(ataPerFtToBarPerM(barPerMToAtaPerFt(0.1))).toBeCloseTo(0.1, 12);
    });

    it('should give the same ambient pressure in metric and imperial representations', () => {
      // Same physical depth, surface pressure and gradient, expressed in
      // ft/ata/ata-per-ft, must give the same pressure, in ata.
      const metricPAmb = calculatePAmb(200, 1.0, 0.1);
      const imperialPAmb = calculatePAmb(mToFt(200), barToAta(1.0), barPerMToAtaPerFt(0.1));
      expect(imperialPAmb).toBeCloseTo(barToAta(metricPAmb), 10);
    });
  });

  describe('pressure display helpers', () => {
    it('should name the pressure unit for each unit system', () => {
      expect(pressureUnit('Metric')).toBe('bar');
      expect(pressureUnit('Imperial')).toBe('ata');
    });

    it('should leave bar unchanged in metric', () => {
      expect(toDisplayPressure(1.35, 'Metric')).toBe(1.35);
      expect(fromDisplayPressure(1.35, 'Metric')).toBe(1.35);
    });

    it('should convert bar to ata in imperial, and back from input', () => {
      // Default dive: loop pO2 1.350 bar shows as 1.332 ata.
      expect(toDisplayPressure(1.35, 'Imperial')).toBeCloseTo(1.33235, 5);
      expect(fromDisplayPressure(1, 'Imperial')).toBeCloseTo(1.01325, 12);
    });
  });
});
