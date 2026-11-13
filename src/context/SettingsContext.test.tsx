import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SettingsProvider, useSettings } from './SettingsContext';
import { DEFAULT_PARAMS, PARAM_LIMITS } from '../utils/calculations';

const renderSettings = () => renderHook(() => useSettings(), { wrapper: SettingsProvider });

const stored = () => JSON.parse(localStorage.getItem('rb2000_params') ?? 'null');

describe('SettingsContext', () => {
  it('starts from the defaults when nothing is stored', () => {
    const { result } = renderSettings();
    expect(result.current.params).toEqual(DEFAULT_PARAMS);
    expect(result.current.units).toBe('Metric');
  });

  it('loads stored params and units', () => {
    localStorage.setItem('rb2000_params', JSON.stringify({ ...DEFAULT_PARAMS, amv: 30 }));
    localStorage.setItem('rb2000_units', 'Imperial');
    const { result } = renderSettings();
    expect(result.current.params.amv).toBe(30);
    expect(result.current.units).toBe('Imperial');
  });

  it('clamps out-of-range stored values and replaces invalid ones', () => {
    // e.g. RMV 2015 saved by the old settings-field bug.
    localStorage.setItem(
      'rb2000_params',
      JSON.stringify({ amv: 2015, ke: 0, kr: 'x', algorithm: 'Nope' })
    );
    const { result } = renderSettings();
    expect(result.current.params.amv).toBe(PARAM_LIMITS.amv.max);
    expect(result.current.params.ke).toBe(PARAM_LIMITS.ke.min);
    expect(result.current.params.kr).toBe(DEFAULT_PARAMS.kr);
    expect(result.current.params.algorithm).toBe(DEFAULT_PARAMS.algorithm);
  });

  it('falls back to the defaults on corrupt JSON or an unknown unit', () => {
    localStorage.setItem('rb2000_params', '{not json');
    localStorage.setItem('rb2000_units', 'Furlongs');
    const { result } = renderSettings();
    expect(result.current.params).toEqual(DEFAULT_PARAMS);
    expect(result.current.units).toBe('Metric');
  });

  it('persists updates to localStorage', () => {
    const { result } = renderSettings();
    act(() => result.current.updateParams({ amv: 15 }));
    expect(result.current.params.amv).toBe(15);
    expect(stored().amv).toBe(15);
  });

  it('keeps the previous value when an update is invalid', () => {
    const { result } = renderSettings();
    act(() => result.current.updateParams({ amv: 25 }));
    act(() => result.current.updateParams({ amv: NaN }));
    expect(result.current.params.amv).toBe(25);
  });

  it('resets params and units to the defaults', () => {
    const { result } = renderSettings();
    act(() => {
      result.current.updateParams({ amv: 15 });
      result.current.updateUnits('Imperial');
    });
    act(() => result.current.resetToDefaults());
    expect(result.current.params).toEqual(DEFAULT_PARAMS);
    expect(result.current.units).toBe('Metric');
    expect(localStorage.getItem('rb2000_units')).toBe('Metric');
  });
});
