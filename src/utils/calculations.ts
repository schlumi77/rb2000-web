
export type Algorithm = 'Standard' | 'Aspacher';
export type Units = 'Metric' | 'Imperial';

export interface CalculationParams {
  amv: number;      // RMV [l/min]
  ke: number;       // Respiratory factor
  kr: number;       // Gas leakage [%]
  v: number;        // System Volume [l]
  freq: number;     // Breathing frequency [1/min]
  pSurf: number;    // Surface pressure [bar/ata]
  dpdt: number;     // Pressure increment [bar/m or ata/ft]
  algorithm: Algorithm;
}

/** Default physiological and system parameters (shared by the app and tests). */
export const DEFAULT_PARAMS: CalculationParams = {
  amv: 20.0,
  ke: 25.0,
  kr: 10.0,
  v: 8.0,
  freq: 20.0,
  pSurf: 1.0,
  dpdt: 0.1,
  algorithm: 'Standard',
};

export const CONSTANTS = {
  PPO2_LOW_LIMIT: 0.16,
  PPO2_HIGH_LIMIT: 1.60,
  LIMIT_GAS_DENSITY: 5.2,
  PERCENT_CONVERSION: 100.0,
  METER_FT_CONVERSION: 0.3,
  GAS_DENSITY_HE: 0.179,
  GAS_DENSITY_O2: 1.428,
  GAS_DENSITY_N2: 1.251,
};

/**
 * Calculates ambient pressure at a given depth.
 */
export const calculatePAmb = (depth: number, pSurf: number, dpdt: number): number => {
  const pAmb = (pSurf + dpdt * depth) / pSurf;
  return Math.max(0, pAmb);
};

/**
 * Calculates steady state fO2 (fO2GG).
 */
export const calculateFO2GG = (depth: number, fO2Mix: number, params: CalculationParams): number => {
  const pAmb = calculatePAmb(depth, params.pSurf, params.dpdt);
  const VO2 = params.amv / params.ke;
  const Q_dump = params.amv * (params.kr / CONSTANTS.PERCENT_CONVERSION) * pAmb;

  let fO2GG = 0;
  const Kr_decimal = params.kr / CONSTANTS.PERCENT_CONVERSION;

  if (params.algorithm === 'Aspacher') {
    fO2GG = (fO2Mix * (Q_dump + (1 - Kr_decimal) * VO2) - (1 - Kr_decimal) * VO2) / Q_dump;
  } else {
    fO2GG = (fO2Mix * (Q_dump + VO2) - VO2) / Q_dump;
  }

  return Math.max(0, Math.min(1, fO2GG));
};

/**
 * Calculates minimum fO2 required for a specific pO2.
 */
export const calculateFO2Min = (depth: number, pO2Min: number, params: CalculationParams): number => {
  const pAmb = calculatePAmb(depth, params.pSurf, params.dpdt);
  const VO2 = params.amv / params.ke;
  const Kr_decimal = params.kr / CONSTANTS.PERCENT_CONVERSION;
  const Q_dump = params.amv * Kr_decimal * pAmb;

  let fO2min = 0;
  if (params.algorithm === 'Aspacher') {
    fO2min = (((pO2Min * Q_dump) / pAmb) + (1 - Kr_decimal) * VO2) / (Q_dump + (1 - Kr_decimal) * VO2);
  } else {
    fO2min = (((pO2Min * Q_dump) / pAmb) + VO2) / (Q_dump + VO2);
  }

  return Math.max(0, Math.min(1, fO2min));
};

/**
 * Simulates loop fO2 and pO2 over time.
 */
export interface SimulationResult {
  time: number[];
  fO2: number[];
  pO2: number[];
}

export const simulateLoopGas = (
  depth: number,
  fO2Mix: number,
  fO2Start: number,
  params: CalculationParams
): SimulationResult => {
  const pAmb = calculatePAmb(depth, params.pSurf, params.dpdt);
  const VO2 = params.amv / params.ke;
  const Kr_decimal = params.kr / CONSTANTS.PERCENT_CONVERSION;
  const Q_dump = params.amv * Kr_decimal * pAmb;
  const Vamb = params.v * pAmb;
  const freq = params.freq;

  // Loops calculation from legacy code: (NUMBER_CALCULATION_LOOPS * (V / (AMV * Kr)) * freq)
  // Legacy NUMBER_CALCULATION_LOOPS was 9
  // Guard against degenerate inputs (e.g. Kr = 0 or amv = 0) that make the
  // loop count Infinity/NaN and would otherwise freeze the browser tab.
  const SAFETY_MAX_LOOPS = 100000;
  const rawLoops = 9 * (params.v / (params.amv * Kr_decimal)) * freq;
  const loops = Number.isFinite(rawLoops) && rawLoops > 0
    ? Math.min(Math.floor(rawLoops), SAFETY_MAX_LOOPS)
    : 0;

  const timeArr: number[] = [];
  const fO2Arr: number[] = [];
  const pO2Arr: number[] = [];

  let currentFO2 = fO2Start;

  for (let c = 0; c < loops; c++) {
    const time = c / freq;
    timeArr.push(time);
    fO2Arr.push(currentFO2);
    pO2Arr.push(currentFO2 * pAmb);

    const step = 1 / freq;
    let nextFO2 = 0;

    if (params.algorithm === 'Aspacher') {
      nextFO2 = currentFO2 + ((fO2Mix * (Q_dump * step + (1 - Kr_decimal) * VO2 * step)) - ((1 - Kr_decimal) * VO2 * step) - (currentFO2 * (Q_dump * step))) / Vamb;
    } else {
      nextFO2 = currentFO2 + ((fO2Mix * (Q_dump * step + VO2 * step)) - (VO2 * step) - (currentFO2 * (Q_dump * step))) / Vamb;
    }

    currentFO2 = Math.max(0, Math.min(1, nextFO2));
  }

  return {
    time: timeArr,
    fO2: fO2Arr,
    pO2: pO2Arr
  };
};

/**
 * Calculates gas density.
 */
export const calculateGasDensity = (depth: number, fO2: number, fHe: number, pSurf: number, dpdt: number): number => {
  if (fO2 + fHe > 1.0) return 0;
  
  const fN2 = 1.0 - fO2 - fHe;
  const pAmb = calculatePAmb(depth, pSurf, dpdt);
  
  const density = (fO2 * CONSTANTS.GAS_DENSITY_O2 + fHe * CONSTANTS.GAS_DENSITY_HE + fN2 * CONSTANTS.GAS_DENSITY_N2) * pAmb;
  return density;
};

/**
 * Unit conversions
 */
export const mToFt = (m: number): number => m / CONSTANTS.METER_FT_CONVERSION;
export const ftToM = (ft: number): number => ft * CONSTANTS.METER_FT_CONVERSION;

/**
 * Pressure-gradient conversions between bar/m (metric) and ata/ft (imperial).
 * dpdt is a pressure-per-distance quantity, so converting the distance from
 * metres to feet scales it by METER_FT_CONVERSION (metres per foot). Using the
 * same constant as mToFt/ftToM keeps pAmb identical across unit systems.
 */
export const barPerMToAtaPerFt = (v: number): number => v * CONSTANTS.METER_FT_CONVERSION;
export const ataPerFtToBarPerM = (v: number): number => v / CONSTANTS.METER_FT_CONVERSION;
