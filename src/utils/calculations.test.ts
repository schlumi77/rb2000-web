
import { describe, it, expect } from 'vitest';
import type { CalculationParams } from './calculations';
import { 
  calculatePAmb, 
  calculateFO2GG, 
  calculateFO2Min, 
  calculateGasDensity,
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
  it('should calculate pAmb correctly', () => {
    // at 10m: (1.0 + 0.1 * 10) / 1.0 = 2.0
    expect(calculatePAmb(10, 1.0, 0.1)).toBe(2.0);
    // at 0m: 1.0
    expect(calculatePAmb(0, 1.0, 0.1)).toBe(1.0);
  });

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

  it('should calculate fO2Min correctly', () => {
    // Depth 21m, pO2Min 0.21
    // pAmb = 3.1, VO2 = 0.8, Q_dump = 6.2
    // fO2min = (((0.21 * 6.2) / 3.1) + 0.8) / (6.2 + 0.8)
    //        = (0.42 + 0.8) / 7.0 = 1.22 / 7.0 ≈ 0.1742857
    const result = calculateFO2Min(21, 0.21, defaultParams);
    expect(result).toBeCloseTo(0.1742857, 5);
  });

  it('should calculate gas density correctly', () => {
    // Air at 0m: fO2=0.21, fHe=0, fN2=0.79
    // density = (0.21 * 1.428 + 0 * 0.179 + 0.79 * 1.251) * 1.0
    //         = 0.29988 + 0.98829 = 1.28817
    const result = calculateGasDensity(0, 0.21, 0, 1.0, 0.1);
    expect(result).toBeCloseTo(1.28817, 5);
  });
});
