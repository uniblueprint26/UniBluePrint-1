import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { normaliseIndustry, GENERAL, type ResolvedIndustry } from './industries.ts'
import { inferIndustryFromCourse } from './courseToIndustry.ts'
import { fetchIndustryIntelligence, type IndustryIntel } from './exampleLibrary.ts'

/**
 * One resolution path for every generator, so "what industry is this student
 * in" cannot drift between them.
 *
 * Order: what the student stated, then what their course implies, then a
 * general fallback. Which of the three fired is carried through to the Handler
 * — a CV built off an inferred industry deserves a different review than one
 * built off an industry the student named themselves.
 */

export type IndustrySource = 'stated' | 'inferred_from_course' | 'general_fallback'

export interface ResolvedIndustryContext {
  industry: ResolvedIndustry
  source: IndustrySource
  intelligence: IndustryIntel[]
  /** Prompt block. Empty string when there is nothing industry-specific to say. */
  promptBlock: string
  /** One line for handler_notes, so the reviewer knows what was applied. */
  handlerNote: string
}

/**
 * The intelligence table stores one row per dimension rather than one row per
 * industry, which is what lets a single claim carry its own source. Grouping
 * happens here so callers deal in whole dimensions.
 */
function group(rows: IndustryIntel[], dimension: string): string[] {
  return rows.filter((r) => r.dimension === dimension).map((r) => r.content)
}

function renderBlock(industry: ResolvedIndustry, source: IndustrySource, rows: IndustryIntel[]): string {
  if (industry === GENERAL || rows.length === 0) {
    return `INDUSTRY CONTEXT — GENERAL (source: ${source})
No industry-specific intelligence is on file for this student's field. Apply general best practice, and do NOT invent industry-specific bodies, certifications, or requirements to fill the gap.`
  }

  const screening = group(rows, 'screening_mechanism')
  const mustHaves = group(rows, 'must_have')
  const redFlags = group(rows, 'red_flag')
  const entities = group(rows, 'real_entity')
  const wording = group(rows, 'wording_convention')

  const section = (label: string, items: string[]) =>
    items.length ? `\n${label}:\n${items.map((i) => `- ${i}`).join('\n')}` : ''

  return `INDUSTRY CONTEXT — ${industry.toUpperCase()} (source: ${source})
This is researched, sourced intelligence on how this specific industry screens candidates. Use it to make the output genuinely specific to this field rather than generic. Do not restate it back at the student as advice — apply it.${
    section('How this industry actually screens', screening)
  }${
    section('Must-haves — absence of these is disqualifying in this field', mustHaves)
  }${
    section('Red flags — these mark a weak candidate in this field', redFlags)
  }${
    section('Wording conventions in this field', wording)
  }${
    section('Real bodies, employers and credentials you may reference where the student\'s own input supports it', entities)
  }

Only reference an entity above if this student's own input genuinely connects to it. Naming a body they have no link to is fabrication, not specificity.`
}

/**
 * Prepends the industry line to a generated result's handler_notes.
 *
 * Done in code rather than asked of the model: which industry was resolved and
 * how is a fact this function already knows, and a Handler relying on it to
 * decide what to check should not be reading a model's paraphrase of it.
 */
export function withIndustryHandlerNote<T extends { handler_notes?: string[] }>(
  result: T,
  ctx: ResolvedIndustryContext,
): T {
  return { ...result, handler_notes: [ctx.handlerNote, ...(result.handler_notes ?? [])] }
}

export async function resolveIndustryContext(
  supabase: SupabaseClient,
  rawIndustry: string | null | undefined,
  rawCourse: string | null | undefined,
  limit = 12,
): Promise<ResolvedIndustryContext> {
  const stated = normaliseIndustry(rawIndustry)
  const inferred = stated === GENERAL ? inferIndustryFromCourse(rawCourse) : null

  const industry: ResolvedIndustry = stated !== GENERAL ? stated : (inferred ?? GENERAL)
  const source: IndustrySource =
    stated !== GENERAL ? 'stated' : inferred ? 'inferred_from_course' : 'general_fallback'

  const intelligence = industry === GENERAL
    ? []
    : await fetchIndustryIntelligence(supabase, industry, limit)

  return {
    industry,
    source,
    intelligence,
    promptBlock: renderBlock(industry, source, intelligence),
    handlerNote:
      `Industry detected: ${industry} (${source}). Industry intelligence applied: ` +
      `${intelligence.length > 0 ? `yes — ${intelligence.length} sourced findings` : 'no — general fallback used'}.`,
  }
}
