// Per-hub quote pools for <QuoteBanner>. The founder is writing the real
// quotes himself later -- each hub is seeded with exactly one, clearly
// placeholder-labeled, confirmed internal-facing line so the rotation
// mechanism is visibly working today without putting words in his mouth.
// Swapping in real quotes later is a one-line change per hub: add more
// strings to that hub's array, nothing about QuoteBanner itself changes.

export const PLACEHOLDER_QUOTE =
  'The hardest thing about being the standard is that we are the standard. Thank you for making UniBlueprint the standard.'

export const HUB_QUOTES = {
  finance: [PLACEHOLDER_QUOTE],
  founder: [PLACEHOLDER_QUOTE],
  operations: [PLACEHOLDER_QUOTE],
  legal: [PLACEHOLDER_QUOTE],
  tech: [PLACEHOLDER_QUOTE],
  outreach: [PLACEHOLDER_QUOTE],
  marketing: [PLACEHOLDER_QUOTE],
}

export function getQuotePool(hubKey) {
  return HUB_QUOTES[hubKey] && HUB_QUOTES[hubKey].length ? HUB_QUOTES[hubKey] : [PLACEHOLDER_QUOTE]
}
