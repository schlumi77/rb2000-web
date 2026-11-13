import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// App-level tests cover behaviour that spans views. The Sim view is not
// opened here: its chart needs layout measurement that jsdom doesn't provide.

const openTab = (user: ReturnType<typeof userEvent.setup>, name: RegExp) =>
  user.click(screen.getByRole('button', { name }));

const depthSlider = () => screen.getByRole('slider', { name: /^Depth in/ });

describe('App', () => {
  it('opens on the Steady State view', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toHaveTextContent('Steady State fO2');
  });

  it('keeps the depth when switching between views', async () => {
    // Regression: each view used to hold its own inputs and reset them on
    // every tab switch.
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Increase Depth' }));
    await user.click(screen.getByRole('button', { name: 'Increase Depth' }));
    expect(depthSlider()).toHaveValue('23');

    await openTab(user, /Min fO2/);
    expect(screen.getByRole('banner')).toHaveTextContent('Minimum fO2');
    expect(depthSlider()).toHaveValue('23');

    await openTab(user, /Density/);
    expect(depthSlider()).toHaveValue('23');

    await openTab(user, /Steady/);
    expect(depthSlider()).toHaveValue('23');
  });

  it('keeps view-specific inputs when leaving and returning', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openTab(user, /Min fO2/);
    await user.click(screen.getByRole('button', { name: 'Increase Target pO2' }));
    expect(screen.getByText('0.22')).toBeInTheDocument();

    await openTab(user, /Setup/);
    await openTab(user, /Min fO2/);
    expect(screen.getByText('0.22')).toBeInTheDocument();
  });

  it('saves a settings value typed after clearing the field', async () => {
    // End-to-end version of the "2015" regression, through the real
    // Settings view and SettingsContext.
    const user = userEvent.setup();
    render(<App />);
    await openTab(user, /Setup/);
    const rmv = screen.getByLabelText('RMV in litres per minute');

    await user.clear(rmv);
    await user.type(rmv, '15');
    await user.tab();

    expect(rmv).toHaveValue(15);
    expect(JSON.parse(localStorage.getItem('rb2000_params')!).amv).toBe(15);
  });

  it('switches the depth display to feet when the unit system is toggled', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openTab(user, /Setup/);
    await user.click(screen.getByRole('button', { name: /Unit system, currently Metric/ }));
    await openTab(user, /Steady/);
    // 21 m = 68.9 ft
    expect(screen.getByRole('slider', { name: 'Depth in ft' })).toHaveValue('69');
  });
});

describe('App in Imperial units', () => {
  const renderImperial = () => {
    localStorage.setItem('rb2000_units', 'Imperial');
    return render(<App />);
  };

  it('shows pO2 results in ata, converted from bar', () => {
    // Default dive (21 m, 50% supply): Loop pO2 1.350 bar = 1.332 ata,
    // OC pO2 1.550 bar = 1.530 ata.
    renderImperial();
    expect(screen.getByText('1.332')).toBeInTheDocument();
    expect(screen.getByText('1.530')).toBeInTheDocument();
    expect(screen.getAllByText('ata').length).toBeGreaterThan(0);
    expect(screen.queryByText('bar')).not.toBeInTheDocument();
  });

  it('shows and stores surface pressure in ata via bar', async () => {
    const user = userEvent.setup();
    renderImperial();
    await openTab(user, /Setup/);
    const pSurf = screen.getByLabelText('Surface pressure in ata');
    // Default 1.0 bar = 0.9869 ata
    expect(pSurf).toHaveValue(0.9869);

    await user.clear(pSurf);
    await user.type(pSurf, '1');
    await user.tab();

    // 1 ata is stored as 1.01325 bar.
    expect(JSON.parse(localStorage.getItem('rb2000_params')!).pSurf).toBeCloseTo(1.01325, 10);
  });

  it('shows the pressure gradient in ata/ft', async () => {
    const user = userEvent.setup();
    renderImperial();
    await openTab(user, /Setup/);
    // 0.1 bar/m = 0.03008 ata/ft
    expect(screen.getByLabelText('Pressure gradient in ata per foot')).toHaveValue(0.03008);
  });

  it('moves the Min fO2 target in hundredths of an ata', async () => {
    const user = userEvent.setup();
    renderImperial();
    await openTab(user, /Min fO2/);
    // Default target 0.21 bar = 0.207 ata (not a whole hundredth, so 3 decimals).
    expect(screen.getByText('0.207')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Increase Target pO2' }));
    expect(screen.getByText('0.22')).toBeInTheDocument();
    // The slider tops out at 1.57 ata, the last hundredth within 1.60 bar.
    expect(screen.getByRole('slider', { name: 'Target pO2' })).toHaveAttribute('max', '157');
  });
});
