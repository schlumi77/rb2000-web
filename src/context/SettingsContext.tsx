
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CalculationParams, Units } from '../utils/calculations';

interface SettingsContextType {
  params: CalculationParams;
  units: Units;
  updateParams: (newParams: Partial<CalculationParams>) => void;
  updateUnits: (newUnits: Units) => void;
  resetToDefaults: () => void;
}

const DEFAULT_PARAMS: CalculationParams = {
  amv: 20.0,
  ke: 25.0,
  kr: 10.0,
  v: 8.0,
  freq: 20.0,
  pSurf: 1.0,
  dpdt: 0.1,
  algorithm: 'Standard'
};

const DEFAULT_UNITS: Units = 'Metric';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [params, setParams] = useState<CalculationParams>(() => {
    const saved = localStorage.getItem('rb2000_params');
    return saved ? JSON.parse(saved) : DEFAULT_PARAMS;
  });

  const [units, setUnits] = useState<Units>(() => {
    const saved = localStorage.getItem('rb2000_units');
    return (saved as Units) || DEFAULT_UNITS;
  });

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
    setUnits(newUnits);
    // If switching to Imperial, we might want to adjust dpdt if it's currently at metric default
    // But for now, we leave it to the user or handle it in the settings UI.
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
