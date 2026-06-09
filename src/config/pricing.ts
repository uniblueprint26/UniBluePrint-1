// Central pricing — source of truth is docs/PRICING.md. Do not hardcode prices in components.
// Prices in cents.

export interface ServicePricing {
  standard: number;
  premiumFree: number;
  premiumPro: number;
  trialStandard: number;
  trialPremium: number;
  from?: boolean; // display as "From €X"
}

// null = auto-detect the September trial window by date. Set true/false to force.
export const TRIAL_OVERRIDE: boolean | null = null;

export const FOUNDATION_PRICING: Record<string, ServicePricing> = {
  cv:                 { standard: 2000, premiumFree: 3600, premiumPro: 3000, trialStandard: 1000, trialPremium: 1800 },
  linkedin:           { standard: 2000, premiumFree: 3600, premiumPro: 3000, trialStandard: 1000, trialPremium: 1800 },
  'cover-letter':     { standard: 2000, premiumFree: 3600, premiumPro: 3000, trialStandard: 1000, trialPremium: 1800 },
  'application-form': { standard: 2000, premiumFree: 3600, premiumPro: 3000, trialStandard: 1000, trialPremium: 1800, from: true },
  'interview-prep':   { standard: 2000, premiumFree: 3600, premiumPro: 3000, trialStandard: 1000, trialPremium: 1800 },
  'job-search':       { standard: 1500, premiumFree: 2600, premiumPro: 2200, trialStandard: 800,  trialPremium: 1300 },
  'cao-support':      { standard: 2000, premiumFree: 3600, premiumPro: 3000, trialStandard: 1000, trialPremium: 1800 },
};

export type Tier = 'standard' | 'premium';

export function isTrialActive(now: Date = new Date()): boolean {
  if (TRIAL_OVERRIDE !== null) return TRIAL_OVERRIDE;
  const start = new Date('2026-09-01T00:00:00');
  const end = new Date('2026-10-07T23:59:59'); // includes the Oct 1–7 grace period
  return now >= start && now <= end;
}

export function priceCents(serviceId: string, tier: Tier, isPro: boolean, now: Date = new Date()): number | null {
  const p = FOUNDATION_PRICING[serviceId];
  if (!p) return null;
  if (isTrialActive(now)) return tier === 'standard' ? p.trialStandard : p.trialPremium;
  if (tier === 'standard') return p.standard;
  return isPro ? p.premiumPro : p.premiumFree;
}

// Premium shown at the discounted Pro rate (drives the "Pro rate" label). Standard is identical for all.
export function isProRate(serviceId: string, tier: Tier, isPro: boolean, now: Date = new Date()): boolean {
  return tier === 'premium' && isPro && !isTrialActive(now);
}

export function euro(cents: number): string {
  const v = cents / 100;
  return '€' + (Number.isInteger(v) ? String(v) : v.toFixed(2));
}
