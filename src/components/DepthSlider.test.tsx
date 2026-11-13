import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsProvider } from '../context/SettingsContext';
import DepthSlider from './DepthSlider';

// Records the canonical depth (metres) that DepthSlider reports back.
let lastMeters: number | undefined;

const Harness = ({ initialMeters }: { initialMeters: number }) => {
  const [depth, setDepth] = useState(initialMeters);
  return (
    <DepthSlider
      depth={depth}
      onChange={(m) => {
        lastMeters = m;
        setDepth(m);
      }}
    />
  );
};

const renderWithUnits = (units: 'Metric' | 'Imperial', initialMeters: number) => {
  localStorage.setItem('rb2000_units', units);
  lastMeters = undefined;
  return render(
    <SettingsProvider>
      <Harness initialMeters={initialMeters} />
    </SettingsProvider>
  );
};

describe('DepthSlider', () => {
  it('shows metres in metric mode', () => {
    renderWithUnits('Metric', 21);
    expect(screen.getByRole('slider', { name: 'Depth in m' })).toHaveValue('21');
    expect(screen.getByText('m')).toBeInTheDocument();
  });

  it('caps the metric slider at 200 m', () => {
    renderWithUnits('Metric', 21);
    expect(screen.getByRole('slider')).toHaveAttribute('max', '200');
  });

  it('shows whole feet in imperial mode', () => {
    // 21 m = 68.9 ft
    renderWithUnits('Imperial', 21);
    expect(screen.getByRole('slider', { name: 'Depth in ft' })).toHaveValue('69');
    expect(screen.getByText('ft')).toBeInTheDocument();
  });

  it('caps the imperial slider at the deepest whole foot within 200 m', () => {
    // 200 m = 656.17 ft
    renderWithUnits('Imperial', 21);
    expect(screen.getByRole('slider')).toHaveAttribute('max', '656');
  });

  it('reports feet back as metres using 0.3048 m/ft', () => {
    renderWithUnits('Imperial', 21);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '100' } });
    expect(lastMeters).toBeCloseTo(30.48, 10);
  });

  it('steps one foot at a time with the + button', async () => {
    const user = userEvent.setup();
    renderWithUnits('Imperial', 21);
    await user.click(screen.getByRole('button', { name: 'Increase Depth' }));
    expect(screen.getByRole('slider')).toHaveValue('70');
    expect(lastMeters).toBeCloseTo(70 * 0.3048, 10);
  });

  it('shows a non-whole metric depth with one decimal', () => {
    // A depth picked as 70 ft (21.336 m), then viewed in metric.
    renderWithUnits('Metric', 70 * 0.3048);
    expect(screen.getByText('21.3')).toBeInTheDocument();
  });
});
