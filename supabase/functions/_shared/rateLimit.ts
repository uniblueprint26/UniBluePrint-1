// Rate limiting and cost tracking for the generator functions (generate-cv,
// generate-cover-letter, etc.) — a real, previously-absent gap, confirmed via direct
// coordination with Tayyab's session: nothing on our side limited how often a student
// could call these, and nothing capped aggregate platform spend at all. Every call to
// callClaudeForStructuredOutput (see anthropic.ts) runs checkRateLimit before spending
// anything, and logGeneration after a successful call — callers don't need to think
// about either, it's wired into the one shared place every generator already goes
// through.
//
// PRICING BELOW IS AN APPROXIMATION, NOT VERIFIED AGAINST ANTHROPIC'S CURRENT PRICING
// PAGE. It exists so estimated_cost_cents means something roughly real for the
// platform-wide cap, not to be trusted for actual billing reconciliation — check
// https://www.anthropic.com/pricing before relying on this for anything financial, and
// update PRICE_PER_MILLION_INPUT_CENTS / PRICE_PER_MILLION_OUTPUT_CENTS below if it's
// stale by the time this ships.
//
// BOTH LIMITS BELOW ARE PLACEHOLDER DEFAULTS, NOT A CONFIRMED BUDGET. Pick real numbers
// with Desmond before this goes live with real traffic — these exist so the system fails
// safe (refuses new generations) rather than having no ceiling at all, not because 20/day
// and $50/day are known-correct figures for UniBlueprint's actual budget.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PRICE_PER_MILLION_INPUT_CENTS = 300   // ~$3.00 / million input tokens, Sonnet-class — verify
const PRICE_PER_MILLION_OUTPUT_CENTS = 1500 // ~$15.00 / million output tokens, Sonnet-class — verify

const PER_USER_DAILY_GENERATION_CAP = 20      // generations per rolling 24h, per user — placeholder
const PLATFORM_DAILY_COST_CAP_CENTS = 5000    // $50.00/day platform-wide — placeholder

export class RateLimitedError extends Error {
  constructor(message: string, public retryAfterHint?: string) {
    super(message)
    this.name = 'RateLimitedError'
  }
}

export function estimateCostCents(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * PRICE_PER_MILLION_INPUT_CENTS
  const outputCost = (outputTokens / 1_000_000) * PRICE_PER_MILLION_OUTPUT_CENTS
  return Math.ceil(inputCost + outputCost)
}

/** Called before spending anything on a Claude call. Throws RateLimitedError (caller
 *  should turn this into a 429) if either the user or the platform is over its cap. */
export async function checkRateLimit(supabase: SupabaseClient, userId: string): Promise<void> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const [{ data: userCount, error: userErr }, { data: platformCents, error: platformErr }] = await Promise.all([
    supabase.rpc('count_user_generations_since', { _user_id: userId, _since: since24h }),
    supabase.rpc('total_generation_cost_cents_since', { _since: since24h }),
  ])

  // Fail OPEN on our own check failing, not closed — a broken rate-limit query
  // shouldn't be the reason a legitimate student can't get their CV generated. Log it
  // so it's visible, but don't block on it.
  if (userErr) console.warn('checkRateLimit: count_user_generations_since failed (allowing through):', userErr)
  if (platformErr) console.warn('checkRateLimit: total_generation_cost_cents_since failed (allowing through):', platformErr)

  if (!userErr && typeof userCount === 'number' && userCount >= PER_USER_DAILY_GENERATION_CAP) {
    throw new RateLimitedError(
      `You've reached today's limit of ${PER_USER_DAILY_GENERATION_CAP} generations. Please try again tomorrow.`,
    )
  }
  if (!platformErr && typeof platformCents === 'number' && platformCents >= PLATFORM_DAILY_COST_CAP_CENTS) {
    throw new RateLimitedError(
      'Generation is temporarily unavailable — today\'s platform-wide usage limit has been reached. Please try again tomorrow.',
    )
  }
}

/** Called after a successful Claude call. Best-effort — a logging failure should never
 *  fail the generation the student is actually waiting on. */
export async function logGeneration(
  supabase: SupabaseClient,
  userId: string,
  functionName: string,
  usage: { inputTokens: number; outputTokens: number },
): Promise<void> {
  const estimatedCostCents = estimateCostCents(usage.inputTokens, usage.outputTokens)
  const { error } = await supabase.from('generation_usage').insert({
    user_id: userId,
    function_name: functionName,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    estimated_cost_cents: estimatedCostCents,
  })
  if (error) console.warn('logGeneration: insert failed (non-blocking):', error)
}
