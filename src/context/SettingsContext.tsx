
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_PARAMS } from '../utils/calculations';
import type { CalculationParams, Units } from '../utils/calculations';

interface SettingsContextType {
  params: CalculationParams;
  units: Units;
  updateParams: (newParams: Partial<CalculationParams>) => void;
  updateUnits: (newUnits: Units) => void;
  resetToDefaults: () => void;
}

const DEFAULT_UNITS: Units = 'Metric';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Defensively load persisted params: tolerate corrupt JSON and backfill any
// missing keys from the defaults (so older/partial stored shapes can't leave
// the app with undefined parameters or fail to mount on a parse error).
const loadParams = (): CalculationParams => {
  try {
    const saved = localStorage.getItem('rb2000_params');
    if (!saved) return DEFAULT_PARAMS;
    const parsed = JSON.parse(saved) as Partial<CalculationParams>;
    return { ...DEFAULT_PARAMS, ...parsed };
  } catch {
    return DEFAULT_PARAMS;
  }
};

const loadUnits = (): Units => {
  const saved = localStorage.getItem('rb2000_units');
  return saved === 'Metric' || saved === 'Imperial' ? saved : DEFAULT_UNITS;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [params, setParams] = useState<CalculationParams>(loadParams);

  const [units, setUnits] = useState<Units>(loadUnits);

  useEffect(() => {
    localStorage.setItem('rb2000_params', JSON.stringify(params));
  }, [params]);

  useEffect(() => {
    localStorage.setItem('rb2000_units', units);
  }, [units]);

  const updateParams = (newParams: Partial<CalculationParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  };

  const updateUnits = (newUnits: Units) => {
    // Parameters are stored canonically in metric, so switching units only
    // changes how depth and dpdt are presented — no stored values are touched.
    setUnits(newUnits);
  };

  const resetToDefaults = () => {
    setParams(DEFAULT_PARAMS);
    setUnits(DEFAULT_UNITS);
  };

  return (
    <SettingsContext.Provider value={{ params, units, updateParams, updateUnits, resetToDefaults }}>
      {children}
    </SettingsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
