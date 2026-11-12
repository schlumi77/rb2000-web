import React, { createContext, useContext, useState } from 'react';

interface DiveInputsContextType {
  /** Depth in canonical metres, shared by every calculator view. */
  depth: number;
  setDepth: (depthMeters: number) => void;
  /** Supply gas fO2 in percent, shared by the Steady State and Sim views. */
  fO2Mix: number;
  setFO2Mix: (percent: number) => void;
  /** Initial loop fO2 in percent (Sim view). */
  fO2Start: number;
  setFO2Start: (percent: number) => void;
  /** Target pO2 in hundredths of a bar/ata (Min fO2 view). */
  pO2MinTarget: number;
  setPO2MinTarget: (hundredths: number) => void;
  /** Breathing-gas fO2 and fHe in percent (Gas Density view). */
  densityFO2: number;
  setDensityFO2: (percent: number) => void;
  densityFHe: number;
  setDensityFHe: (percent: number) => void;
}

const DiveInputsContext = createContext<DiveInputsContextType | undefined>(undefined);

/**
 * Holds the calculator inputs above the views. The views unmount on every tab
 * switch, so keeping the inputs here stops them resetting, and lets the same
 * dive (depth, supply gas) be compared across views. Not persisted: a reload
 * starts from the defaults again.
 */
export const DiveInputsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [depth, setDepth] = useState(21);
  const [fO2Mix, setFO2Mix] = useState(50);
  const [fO2Start, setFO2Start] = useState(21);
  const [pO2MinTarget, setPO2MinTarget] = useState(21);
  const [densityFO2, setDensityFO2] = useState(21);
  const [densityFHe, setDensityFHe] = useState(35);

  return (
    <DiveInputsContext.Provider
      value={{
        depth, setDepth,
        fO2Mix, setFO2Mix,
        fO2Start, setFO2Start,
        pO2MinTarget, setPO2MinTarget,
        densityFO2, setDensityFO2,
        densityFHe, setDensityFHe,
      }}
    >
      {children}
    </DiveInputsContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDiveInputs = () => {
  const context = useContext(DiveInputsContext);
  if (context === undefined) {
    throw new Error('useDiveInputs must be used within a DiveInputsProvider');
  }
  return context;
};
