import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SimSummary from './SimSummary';
import type { PO2LimitAssessment } from '../utils/calculations';

const renderSummary = (limits: PO2LimitAssessment | null, steadyPO2 = 1.35) =>
  render(<SimSummary steadyFO2={43.548} steadyPO2={steadyPO2} limits={limits} pressureUnit="bar" />);

describe('SimSummary', () => {
  it('shows the steady-state loop fO2 and pO2', () => {
    renderSummary({ status: 'within' });
    expect(screen.getByText('43.5')).toBeInTheDocument();
    expect(screen.getByText('1.350')).toBeInTheDocument();
    expect(screen.getByText('bar')).toBeInTheDocument();
  });

  it('marks a steady-state pO2 outside the limits as dangerous', () => {
    renderSummary({ status: 'leaves', time: 4, side: 'high' }, 2.1);
    // jsdom doesn't resolve CSS variables, so check the inline style itself.
    expect((screen.getByText('2.100').closest('.value') as HTMLElement).style.color).toBe('var(--danger-color)');
  });

  it('marks a steady-state pO2 within the limits as safe', () => {
    renderSummary({ status: 'within' });
    expect((screen.getByText('1.350').closest('.value') as HTMLElement).style.color).toBe('var(--safe-color)');
  });

  it.each([
    [{ status: 'within' } as const, 'Within limits throughout'],
    [{ status: 'leaves', time: 4.25, side: 'high' } as const, 'Above 1.60 after 4.3 min'],
    [{ status: 'leaves', time: 12, side: 'low' } as const, 'Below 0.16 after 12.0 min'],
    [{ status: 'returns', time: 7.05 } as const, 'Within limits after 7.0 min'],
    [{ status: 'outside', side: 'high' } as const, 'Above 1.60 throughout'],
  ])('describes %o as "%s"', (limits, text) => {
    renderSummary(limits);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('omits the limits row when nothing was simulated', () => {
    renderSummary(null);
    expect(screen.queryByText('pO2 limits')).not.toBeInTheDocument();
  });
});
