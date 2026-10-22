// Pure copy-generation for <ComparisonWidget> -- the ONE place the
// "always forward/motivational, never below-average-shaming" framing rule
// is enforced, per today's decision. Nothing else in the Studio library
// should hand-write this kind of sentence; route it through here instead
// so the tone rule can't drift between hubs.
//
// Every function below is pure (no I/O, no React) so it's trivially
// testable and reusable from any future hub's ComparisonWidget usage.

/**
 * Compares `value` against an anonymized top performer's value in the
 * same category/window. Always frames the gap as a forward distance to
 * close, never a deficit. `higherIsBetter` lets a lower-is-better metric
 * (e.g. response time) still read the gap the right way round.
 */
export function describeVsTop(value, topValue, { unit = '', higherIsBetter = true, noun = 'this period' } = {}) {
  if (value == null || topValue == null) {
    return `Not enough real activity yet ${noun} to compare against the top performer in your category.`
  }
  if (topValue === 0) {
    return `No one in your category has real activity ${noun} yet — once there's real volume, this will show how close you are to the top.`
  }
  const atTop = higherIsBetter ? value >= topValue : value <= topValue
  if (atTop) {
    return `You're leading your category ${noun} — the top spot other performers are chasing.`
  }
  const gapPct = higherIsBetter
    ? Math.round(((topValue - value) / topValue) * 100)
    : Math.round(((value - topValue) / topValue) * 100)
  const safeGap = Math.max(gapPct, 1)
  return `You're ${safeGap}% away from the top performer in your category ${noun}${unit ? ` (${unit})` : ''} — closing that gap is well within reach.`
}

/** Compares against the lowest performer -- always framed as a lead, never "at least you're not last". */
export function describeVsLowest(value, lowestValue, { unit = '', higherIsBetter = true, noun = 'this period' } = {}) {
  if (value == null || lowestValue == null) {
    return `Not enough real activity yet ${noun} to compare against the category floor.`
  }
  const ahead = higherIsBetter ? value - lowestValue : lowestValue - value
  if (ahead <= 0) {
    return `Every category comparison starts somewhere — ${noun}'s real numbers are the baseline to build from.`
  }
  return `You're ahead of the category floor by ${Math.abs(Math.round(ahead))}${unit ? ` ${unit}` : ''} ${noun} — solid ground to keep building on.`
}

/** Self vs self, last period -- the "you vs you" comparison, always growth-framed. */
export function describeVsSelfLastPeriod(value, lastValue, { unit = '', higherIsBetter = true, periodLabel = 'last period' } = {}) {
  if (value == null || lastValue == null) {
    return `No comparable data from ${periodLabel} yet — this will fill in as more real activity happens.`
  }
  if (lastValue === 0 && value === 0) {
    return `No real activity yet this period or ${periodLabel} — nothing to compare until real numbers land.`
  }
  if (lastValue === 0) {
    return `Up from zero ${periodLabel} — real momentum building from a standing start.`
  }
  const changePct = Math.round(((value - lastValue) / lastValue) * 100)
  const improved = higherIsBetter ? changePct > 0 : changePct < 0
  const flat = changePct === 0
  if (flat) return `Holding steady with ${periodLabel} — consistent is its own kind of progress.`
  const magnitude = Math.abs(changePct)
  return improved
    ? `Up ${magnitude}% on ${periodLabel}${unit ? ` (${unit})` : ''} — real forward motion.`
    : `${magnitude}% off ${periodLabel}'s pace — plenty of room to build back toward it.`
}

/** Builds the full three-line comparison set the widget renders. */
export function buildComparisonCopy({
  value, topValue, lowestValue, lastPeriodValue,
  unit = '', higherIsBetter = true, noun = 'this period', periodLabel = 'last period',
}) {
  return {
    vsTop: describeVsTop(value, topValue, { unit, higherIsBetter, noun }),
    vsLowest: describeVsLowest(value, lowestValue, { unit, higherIsBetter, noun }),
    vsSelf: describeVsSelfLastPeriod(value, lastPeriodValue, { unit, higherIsBetter, periodLabel }),
  }
}
