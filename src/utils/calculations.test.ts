
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
  ataPerFtToBarPerM
} from './calculations';

const defaultParams: CalculationParams = {
  amv: 20.0,
  ke: 25.0,
  kr: 10.0,
  v: 8.0,
  freq: 20.0,
  pSurf: 1.0,
  dpdt: 0.1,
  algorithm: 'Standard'
};

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

  describe('Unit Conversions', () => {
    it('should convert meters to feet correctly', () => {
      expect(mToFt(10)).toBeCloseTo(33.333, 3);
    });

    it('should convert feet to meters correctly', () => {
      expect(ftToM(33.333333333333336)).toBeCloseTo(10, 5);
    });

    it('should convert the pressure gradient bar/m to ata/ft', () => {
      // 0.1 bar/m * 0.3 m/ft = 0.03 ata/ft
      expect(barPerMToAtaPerFt(0.1)).toBeCloseTo(0.03, 5);
    });

    it('should round-trip the pressure gradient conversion', () => {
      expect(ataPerFtToBarPerM(barPerMToAtaPerFt(0.1))).toBeCloseTo(0.1, 5);
    });

    it('should give an identical pAmb in metric and imperial representations', () => {
      // Same physical depth + matching gradient must yield the same ambient
      // pressure regardless of the unit system the user has selected.
      const metricPAmb = calculatePAmb(200, 1.0, 0.1);
      const imperialPAmb = calculatePAmb(mToFt(200), 1.0, barPerMToAtaPerFt(0.1));
      expect(imperialPAmb).toBeCloseTo(metricPAmb, 5);
    });
  });
});
