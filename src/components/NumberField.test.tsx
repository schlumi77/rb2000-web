import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NumberField from './NumberField';

// NumberField is controlled: the parent owns the committed value. This harness
// stores each commit (like SettingsContext does) and records it for assertions.
const Harness = ({ initial = 20, onCommit = () => {} }: { initial?: number; onCommit?: (v: number) => void }) => {
  const [value, setValue] = useState(initial);
  return (
    <NumberField
      label="RMV [l/min]"
      value={value}
      min={1}
      max={100}
      ariaLabel="RMV"
      onCommit={(v) => {
        setValue(v);
        onCommit(v);
      }}
    />
  );
};

describe('NumberField', () => {
  it('shows the committed value', () => {
    render(<Harness initial={20} />);
    expect(screen.getByLabelText('RMV')).toHaveValue(20);
  });

  it('can be cleared and retyped without appending to the old value', async () => {
    // Regression: clearing the field used to snap back to the old value, so
    // typing "15" produced "2015".
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Harness initial={20} onCommit={onCommit} />);
    const input = screen.getByLabelText('RMV');

    await user.clear(input);
    expect(input).toHaveValue(null);

    await user.type(input, '15');
    expect(input).toHaveValue(15);
    expect(onCommit).toHaveBeenLastCalledWith(15);
    expect(onCommit).not.toHaveBeenCalledWith(2015);
  });

  it('flags an out-of-range draft and does not commit it', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Harness initial={20} onCommit={onCommit} />);
    const input = screen.getByLabelText('RMV');

    await user.clear(input);
    await user.type(input, '0');

    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Allowed: 1–100')).toBeInTheDocument();
  });

  it('restores the last committed value on blur after an invalid draft', async () => {
    const user = userEvent.setup();
    render(<Harness initial={20} />);
    const input = screen.getByLabelText('RMV');

    // "0" is never valid, so nothing is committed along the way (unlike
    // "500", which commits 5 and 50 while it is typed).
    await user.clear(input);
    await user.type(input, '0');
    await user.tab();

    expect(input).toHaveValue(20);
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText(/Allowed:/)).not.toBeInTheDocument();
  });

  it('keeps an empty field invalid until a value is typed', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Harness initial={20} onCommit={onCommit} />);

    await user.clear(screen.getByLabelText('RMV'));

    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByText('Allowed: 1–100')).toBeInTheDocument();
  });

  it('leaves the field when Enter is pressed', async () => {
    const user = userEvent.setup();
    render(<Harness initial={20} />);
    const input = screen.getByLabelText('RMV');

    await user.click(input);
    await user.keyboard('{Enter}');

    expect(input).not.toHaveFocus();
  });

  it('shows external value changes while not being edited', () => {
    // e.g. "Reset to Defaults" in Settings replaces the committed value.
    const { rerender } = render(
      <NumberField label="RMV" value={30} min={1} max={100} ariaLabel="RMV" onCommit={() => {}} />
    );
    rerender(<NumberField label="RMV" value={20} min={1} max={100} ariaLabel="RMV" onCommit={() => {}} />);
    expect(screen.getByLabelText('RMV')).toHaveValue(20);
  });
});
