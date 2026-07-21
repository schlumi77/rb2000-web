import React from 'react';

interface SliderRowProps {
  /** Text shown on the left of the header row. */
  label: string;
  /** Current value in the slider's own integer domain. */
  value: number;
  min: number;
  max: number;
  /** Increment used by the slider and the +/- buttons. Defaults to 1. */
  step?: number;
  /** Receives the new value, already clamped to [min, max]. */
  onChange: (value: number) => void;
  /** Optional unit shown after the value (e.g. "%", "m"). */
  unit?: string;
  /**
   * Overrides how the value is rendered in the header (e.g. a formatted
   * string). Defaults to the raw `value`.
   */
  displayValue?: React.ReactNode;
  /** Accessible label for the range input. Defaults to `label`. */
  ariaLabel?: string;
}

/**
 * A labelled range slider with -/+ stepper buttons on either side so values
 * can be nudged one `step` at a time without dragging. Centralising this keeps
 * every calculator input consistent and clamped to the same bounds.
 */
const SliderRow: React.FC<SliderRowProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit,
  displayValue,
  ariaLabel,
}) => {
  const setValue = (raw: number) => {
    if (!Number.isFinite(raw)) return;
    onChange(Math.min(max, Math.max(min, raw)));
  };

  return (
    <>
      <div className="row">
        <span className="label">{label}</span>
        <span className="value">
          {displayValue ?? value}
          {unit ? <span className="unit">{unit}</span> : null}
        </span>
      </div>
      <div className="slider-control">
        <button
          type="button"
          className="stepper"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => setValue(value - step)}
        >
          −
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={ariaLabel ?? label}
          onChange={(e) => setValue(parseInt(e.target.value, 10))}
        />
        <button
          type="button"
          className="stepper"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => setValue(value + step)}
        >
          +
        </button>
      </div>
    </>
  );
};

export default SliderRow;
