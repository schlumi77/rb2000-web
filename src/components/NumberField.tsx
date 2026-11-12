import React, { useState } from 'react';

interface NumberFieldProps {
  /** Text shown on the left of the row. */
  label: string;
  /** Committed value, in the unit the field displays. */
  value: number;
  min: number;
  max: number;
  step?: string;
  ariaLabel: string;
  /** Receives every valid, in-range value as it is typed. */
  onCommit: (value: number) => void;
}

/**
 * A settings row with a numeric text field. The text being typed is kept as a
 * local draft, so the field can be cleared and retyped freely; only finite
 * values inside [min, max] are committed. An invalid draft is flagged with the
 * allowed range and discarded on blur, restoring the last committed value.
 */
const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  min,
  max,
  step,
  ariaLabel,
  onCommit,
}) => {
  // null while the field is not being edited, so the committed value (and
  // external changes such as "Reset to Defaults") shows through.
  const [draft, setDraft] = useState<string | null>(null);

  const parse = (raw: string): number | null => {
    const parsed = raw.trim() === '' ? NaN : Number(raw);
    return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
  };

  const invalid = draft !== null && parse(draft) === null;

  const handleChange = (raw: string) => {
    setDraft(raw);
    const parsed = parse(raw);
    if (parsed !== null) onCommit(parsed);
  };

  return (
    <div className="row">
      <span className="label">
        {label}
        {invalid && <span className="field-hint">Allowed: {min}–{max}</span>}
      </span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={draft ?? String(value)}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setDraft(null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
    </div>
  );
};

export default NumberField;
