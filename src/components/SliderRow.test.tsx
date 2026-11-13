import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SliderRow from './SliderRow';

const Harness = ({ initial, min = 0, max = 10, step }: { initial: number; min?: number; max?: number; step?: number }) => {
  const [value, setValue] = useState(initial);
  return <SliderRow label="Supply fO2" value={value} min={min} max={max} step={step} unit="%" onChange={setValue} />;
};

describe('SliderRow', () => {
  it('renders the label, value and unit', () => {
    render(<Harness initial={5} />);
    expect(screen.getByText('Supply fO2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('shows displayValue instead of the raw value when given', () => {
    render(
      <SliderRow label="Target pO2" value={21} min={16} max={160} displayValue="0.21" onChange={() => {}} />
    );
    expect(screen.getByText('0.21')).toBeInTheDocument();
    expect(screen.queryByText('21')).not.toBeInTheDocument();
  });

  it('steps the value up and down with the +/- buttons', async () => {
    const user = userEvent.setup();
    render(<Harness initial={5} />);
    const slider = screen.getByRole('slider', { name: 'Supply fO2' });

    await user.click(screen.getByRole('button', { name: 'Increase Supply fO2' }));
    expect(slider).toHaveValue('6');

    await user.click(screen.getByRole('button', { name: 'Decrease Supply fO2' }));
    await user.click(screen.getByRole('button', { name: 'Decrease Supply fO2' }));
    expect(slider).toHaveValue('4');
  });

  it('steps by the given step size', async () => {
    const user = userEvent.setup();
    render(<Harness initial={10} max={100} step={5} />);
    await user.click(screen.getByRole('button', { name: 'Increase Supply fO2' }));
    expect(screen.getByRole('slider')).toHaveValue('15');
  });

  it('disables the buttons at the bounds', () => {
    const { unmount } = render(<Harness initial={0} />);
    expect(screen.getByRole('button', { name: 'Decrease Supply fO2' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Increase Supply fO2' })).toBeEnabled();
    unmount();

    render(<Harness initial={10} />);
    expect(screen.getByRole('button', { name: 'Increase Supply fO2' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decrease Supply fO2' })).toBeEnabled();
  });

  it('clamps a step that would overshoot the bound', async () => {
    const user = userEvent.setup();
    render(<Harness initial={8} step={5} />);
    await user.click(screen.getByRole('button', { name: 'Increase Supply fO2' }));
    expect(screen.getByRole('slider')).toHaveValue('10');
  });

  it('passes slider changes to onChange', () => {
    const onChange = vi.fn();
    render(<SliderRow label="Depth" value={5} min={0} max={10} onChange={onChange} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '7' } });
    expect(onChange).toHaveBeenCalledWith(7);
  });
});
