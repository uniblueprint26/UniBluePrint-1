import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Escapes LIKE metacharacters so free-text industry values match literally.
 * Without this, a user typing "100% remote" produces the pattern
 * `%100% remote%`, where the inner `%` is a wildcard and silently matches
 * unintended rows. Backslash is escaped first so it can't double-escape.
 */
function escapeLike(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
}

export interface LibraryExample {
  excerpt: string
  why_it_works: string
  industry: string
  competency_tag: string | null
  source_name: string
  source_url: string
  /** 'sourced' = externally published. 'platform_authored' = written in-house. */
  provenance?: 'sourced' | 'platform_authored'
}

/**
 * The subset of examples that may be shown to a student as a citation.
 *
 * generated.benchmarked_against is rendered in the UI by BenchmarkNote, so
 * anything that reaches it is a claim to the student that this source published
 * something. Platform-authored calibration exemplars are useful to the model
 * but are not published sources, and citing them would be a fabricated
 * reference in the student's own document.
 */
export function citableSources(
  rows: Array<{ source_name: string; source_url: string; provenance?: string }>,
): Array<{ source_name: string; source_url: string }> {
  return rows
    .filter((r) => r.provenance !== 'platform_authored')
    .map((r) => ({ source_name: r.source_name, source_url: r.source_url }))
}

/**
 * Pulls real, sourced examples for a category, matched to the user's industry
 * (case-insensitive substring match, since industry is free text on the input
 * side but a fixed set of tags in the library) — topped up with 'general'
 * entries if the industry has too few matches. Used to ground generation in
 * real published examples instead of writing purely from formula.
 */
export async function fetchIndustryExamples(
  supabase: SupabaseClient,
  category: string,
  industry: string | null | undefined,
  limit = 3,
): Promise<LibraryExample[]> {
  const cols = 'excerpt, why_it_works, industry, competency_tag, source_name, source_url, provenance'
  const results: LibraryExample[] = []

  if (industry) {
    const { data } = await supabase
      .from('example_library')
      .select(cols)
      .eq('category', category)
      .ilike('industry', `%${escapeLike(industry)}%`)
      .limit(limit)
    if (data) results.push(...(data as LibraryExample[]))
  }

  if (results.length < limit) {
    const { data } = await supabase
      .from('example_library')
      .select(cols)
      .eq('category', category)
      .eq('industry', 'general')
      .limit(limit - results.length)
    if (data) results.push(...(data as LibraryExample[]))
  }

  return results
}

/**
 * For STAR-based categories, matched primarily by competency, with an
 * industry preference layered on top when one is given.
 *
 * A STAR answer calibrates two things at once — what good evidence for THIS
 * competency looks like, and what the writing convention is in THIS field —
 * so matching purely on competency (the original behaviour) meant a Law
 * candidate could just as easily be handed a Sports and Fitness example for
 * "Teamwork". Now: rows matching both competency and industry come first,
 * topped up with any-industry matches on the same competencies if short of
 * `limit`. `industry` is optional so existing callers keep working unchanged.
 */
export async function fetchCompetencyExamples(
  supabase: SupabaseClient,
  competencyTags: string[],
  limit = 3,
  industry?: string | null,
): Promise<LibraryExample[]> {
  if (competencyTags.length === 0) return []
  const cols = 'excerpt, why_it_works, industry, competency_tag, source_name, source_url, provenance'
  const results: LibraryExample[] = []

  if (industry) {
    const { data } = await supabase
      .from('example_library')
      .select(cols)
      .eq('category', 'star_answer')
      .in('competency_tag', competencyTags)
      .ilike('industry', `%${escapeLike(industry)}%`)
      .limit(limit)
    if (data) results.push(...(data as LibraryExample[]))
  }

  if (results.length < limit) {
    // Over-fetch a flat `limit` (rather than the remaining count) because some
    // rows returned here will already be in `results` and get filtered by the
    // dedup check below — asking for only the shortfall risks coming up short
    // after those are dropped.
    const seen = new Set(results.map((r) => r.excerpt))
    const { data } = await supabase
      .from('example_library')
      .select(cols)
      .eq('category', 'star_answer')
      .in('competency_tag', competencyTags)
      .limit(limit)
    for (const row of (data as LibraryExample[]) || []) {
      if (results.length >= limit) break
      if (seen.has(row.excerpt)) continue
      results.push(row)
      seen.add(row.excerpt)
    }
  }

  return results
}

export interface IndustryIntel {
  dimension: 'screening_mechanism' | 'must_have' | 'wording_convention' | 'red_flag' | 'real_entity'
  content: string
  source_name: string
  source_url: string
}

/**
 * How this industry actually screens candidates — ATS/recruiter mechanics,
 * required credentials, wording convention, and instant-reject red flags.
 * Different question from fetchIndustryExamples: that answers "what does good
 * look like", this answers "what gets an application filtered out".
 */
export async function fetchIndustryIntelligence(
  supabase: SupabaseClient,
  industry: string | null | undefined,
  limit = 8,
): Promise<IndustryIntel[]> {
  if (!industry) return []
  const { data } = await supabase
    .from('industry_intelligence')
    .select('dimension, content, source_name, source_url')
    .ilike('industry', `%${escapeLike(industry)}%`)
    .limit(limit)
  return (data as IndustryIntel[]) || []
}
