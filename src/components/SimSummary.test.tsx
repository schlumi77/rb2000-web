import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SimSummary from './SimSummary';
import type { PO2LimitAssessment, Units } from '../utils/calculations';

const renderSummary = (limits: PO2LimitAssessment | null, steadyPO2 = 1.35, units: Units = 'Metric') =>
  render(<SimSummary steadyFO2={43.548} steadyPO2={steadyPO2} limits={limits} units={units} />);

// jsdom doesn't resolve CSS variables, so colour checks read the inline style.
const colorOf = (text: string) => (screen.getByText(text).closest('.value') as HTMLElement).style.color;

describe('SimSummary', () => {
  it('shows the steady-state loop fO2 and pO2', () => {
    renderSummary({ status: 'within' });
    expect(screen.getByText('43.5')).toBeInTheDocument();
    expect(screen.getByText('1.350')).toBeInTheDocument();
    expect(screen.getByText('bar')).toBeInTheDocument();
  });

  it('marks a steady-state pO2 outside the limits as dangerous', () => {
    renderSummary({ status: 'leaves', time: 4, side: 'high' }, 2.1);
    expect(colorOf('2.100')).toBe('var(--danger-color)');
  });

  it('marks a steady-state pO2 within the limits as safe', () => {
    renderSummary({ status: 'within' });
    expect(colorOf('1.350')).toBe('var(--safe-color)');
  });

  it.each([
    [{ status: 'within' } as const, 'Within limits throughout'],
    [{ status: 'leaves', time: 4.25, side: 'high' } as const, 'Above 1.60 bar after 4.3 min'],
    [{ status: 'leaves', time: 12, side: 'low' } as const, 'Below 0.16 bar after 12.0 min'],
    [{ status: 'returns', time: 7.05 } as const, 'Within limits after 7.0 min'],
    [{ status: 'outside', side: 'high' } as const, 'Above 1.60 bar throughout'],
  ])('describes %o as "%s"', (limits, text) => {
    renderSummary(limits);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('omits the limits row when nothing was simulated', () => {
    renderSummary(null);
    expect(screen.queryByText('pO2 limits')).not.toBeInTheDocument();
  });

  describe('in Imperial units', () => {
    it('shows the steady-state pO2 in ata', () => {
      // 1.350 bar = 1.332 ata
      renderSummary({ status: 'within' }, 1.35, 'Imperial');
      expect(screen.getByText('1.332')).toBeInTheDocument();
      expect(screen.getByText('ata')).toBeInTheDocument();
    });

    it('states the limits in ata', () => {
      // 1.60 bar = 1.58 ata, 0.16 bar = 0.16 ata (0.158)
      renderSummary({ status: 'leaves', time: 4.25, side: 'high' }, 2.1, 'Imperial');
      expect(screen.getByText('Above 1.58 ata after 4.3 min')).toBeInTheDocument();
    });

    it('still checks the limits in bar', () => {
      // 1.59 bar is within the 1.60 bar limit; shown as 1.569 ata, still green.
      renderSummary({ status: 'within' }, 1.59, 'Imperial');
      expect(colorOf('1.569')).toBe('var(--safe-color)');
      // 1.61 bar is outside; shown as 1.589 ata, which is below "1.60" but red.
      renderSummary({ status: 'within' }, 1.61, 'Imperial');
      expect(colorOf('1.589')).toBe('var(--danger-color)');
    });
  });
});
