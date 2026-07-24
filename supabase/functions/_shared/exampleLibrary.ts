import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface LibraryExample {
  excerpt: string
  why_it_works: string
  industry: string
  competency_tag: string | null
  source_name: string
  source_url: string
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
  const cols = 'excerpt, why_it_works, industry, competency_tag, source_name, source_url'
  const results: LibraryExample[] = []

  if (industry) {
    const { data } = await supabase
      .from('example_library')
      .select(cols)
      .eq('category', category)
      .ilike('industry', `%${industry}%`)
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

/** For STAR-based categories, matched by competency rather than industry. */
export async function fetchCompetencyExamples(
  supabase: SupabaseClient,
  competencyTags: string[],
  limit = 3,
): Promise<LibraryExample[]> {
  if (competencyTags.length === 0) return []
  const { data } = await supabase
    .from('example_library')
    .select('excerpt, why_it_works, industry, competency_tag, source_name, source_url')
    .eq('category', 'star_answer')
    .in('competency_tag', competencyTags)
    .limit(limit)
  return (data as LibraryExample[]) || []
}
