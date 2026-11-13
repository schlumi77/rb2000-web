/** Candidate tick spacings, smallest first. */
const TICK_STEPS = [0.4, 0.8, 2, 4, 8];
const MAX_INTERVALS = 6;

/**
 * Evenly spaced ticks for a value axis starting at 0. The top tick is at
 * least `minTop` (so a limit line such as pO2 1.60 stays on the chart) and is
 * rounded up to a whole step, using the smallest step that needs at most six
 * intervals. Ticks are rounded to two decimals to avoid float noise such as
 * 1.2000000000000002.
 */
export const valueAxisTicks = (maxValue: number, minTop: number): number[] => {
  const target = Math.max(minTop, Number.isFinite(maxValue) ? maxValue : 0);
  const step =
    TICK_STEPS.find((s) => Math.ceil(target / s - 1e-9) <= MAX_INTERVALS) ?? TICK_STEPS[TICK_STEPS.length - 1];
  const intervals = Math.max(1, Math.ceil(target / step - 1e-9));
  return Array.from({ length: intervals + 1 }, (_, i) => Number((i * step).toFixed(2)));
};

/** Candidate minute spacings, smallest first. */
const MINUTE_STEPS = [1, 2, 5, 10, 15, 30, 60];

/**
 * Round-minute ticks (0, 10, 20, …) for a time axis ending at `lastMinute`,
 * using the smallest spacing that needs at most six intervals. The last tick
 * may fall short of `lastMinute`; the axis itself still runs to the end.
 */
export const minuteAxisTicks = (lastMinute: number): number[] => {
  const end = Math.max(0, Math.floor(Number.isFinite(lastMinute) ? lastMinute : 0));
  const step = MINUTE_STEPS.find((s) => end / s <= MAX_INTERVALS) ?? MINUTE_STEPS[MINUTE_STEPS.length - 1];
  return Array.from({ length: Math.floor(end / step) + 1 }, (_, i) => i * step);
};
