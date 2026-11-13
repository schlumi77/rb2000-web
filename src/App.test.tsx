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
