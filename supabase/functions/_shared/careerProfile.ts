import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Foundation Blueprint §08 — the Career Profile, read side.
 *
 * Every generator used to receive its context entirely from the form the user
 * had just filled in. That is what made the pillar eight cold-start document
 * generators instead of one employability companion: the same person restated
 * their education, their target role, and their best examples once per module.
 *
 * These fetchers are the shared read path. A generator asks for the profile,
 * the active target, and (where relevant) the evidence bank, then merges them
 * UNDER the request payload — the form the user just submitted always wins,
 * because it is their most recent statement of intent. The profile fills gaps;
 * it never overrides.
 */

export interface CareerProfile {
  personal_info: Record<string, unknown>
  education: Record<string, unknown>[]
  experience: Record<string, unknown>[]
  skills: Record<string, unknown>
  achievements: Record<string, unknown>
  certifications: Record<string, unknown>[]
  education_system: string | null
  pathway: string | null
  goals: string | null
  interests: string | null
  has_no_experience: boolean
}

export interface CareerTarget {
  id: string
  label: string
  target_role: string | null
  target_industry: string | null
  target_company: string | null
  target_course: string | null
  target_institution: string | null
  job_description: string | null
}

export interface EvidenceStory {
  title: string
  situation: string
  task: string
  action: string
  result: string
  competency_tags: string[]
}

const PROFILE_COLS =
  'personal_info, education, experience, skills, achievements, certifications, ' +
  'education_system, pathway, goals, interests, has_no_experience'

const TARGET_COLS =
  'id, label, target_role, target_industry, target_company, target_course, ' +
  'target_institution, job_description'

/**
 * The user's profile, or null if they have not built one yet.
 *
 * A missing profile is an ordinary state, not an error — the tools have to keep
 * working for someone who lands straight on the CV builder without ever
 * visiting the profile page. Every caller treats null as "no extra context".
 */
export async function fetchCareerProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<CareerProfile | null> {
  const { data } = await supabase
    .from('career_profiles')
    .select(PROFILE_COLS)
    .eq('user_id', userId)
    .maybeSingle()
  return (data as CareerProfile) ?? null
}

/**
 * The target the user is currently applying for.
 *
 * Pass `targetId` when the request names one explicitly; otherwise this falls
 * back to the single active target, which the partial unique index guarantees
 * is at most one row.
 */
export async function fetchCareerTarget(
  supabase: SupabaseClient,
  userId: string,
  targetId?: string | null,
): Promise<CareerTarget | null> {
  const query = supabase.from('career_targets').select(TARGET_COLS).eq('user_id', userId)
  const { data } = targetId
    ? await query.eq('id', targetId).maybeSingle()
    : await query.eq('is_active', true).maybeSingle()
  return (data as CareerTarget) ?? null
}

/**
 * STAR stories from the shared evidence bank.
 *
 * Optionally filtered by competency — `overlaps` matches a story tagged with
 * ANY of the requested competencies, which is the behaviour the reference
 * library describes: one story is reassembled under whichever competency lens
 * the current question is testing, so a story tagged both Teamwork and
 * Leadership should surface for either.
 */
export async function fetchEvidenceBank(
  supabase: SupabaseClient,
  userId: string,
  competencyTags?: string[] | null,
  limit = 10,
): Promise<EvidenceStory[]> {
  let query = supabase
    .from('evidence_bank_stories')
    .select('title, situation, task, action, result, competency_tags')
    .eq('user_id', userId)

  if (competencyTags && competencyTags.length > 0) {
    query = query.overlaps('competency_tags', competencyTags)
  }

  const { data } = await query.order('created_at', { ascending: false }).limit(limit)
  return (data as EvidenceStory[]) || []
}

/**
 * Everything a generator needs from the profile layer, in one round trip.
 * The three reads are independent, so they go in parallel.
 */
export async function fetchProfileContext(
  supabase: SupabaseClient,
  userId: string,
  opts: { targetId?: string | null; competencyTags?: string[] | null; withEvidence?: boolean } = {},
): Promise<{ profile: CareerProfile | null; target: CareerTarget | null; evidence: EvidenceStory[] }> {
  const [profile, target, evidence] = await Promise.all([
    fetchCareerProfile(supabase, userId),
    fetchCareerTarget(supabase, userId, opts.targetId),
    opts.withEvidence ? fetchEvidenceBank(supabase, userId, opts.competencyTags) : Promise.resolve([]),
  ])
  return { profile, target, evidence }
}

/** True for null, undefined, '', whitespace, [], and {}. */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value as object).length === 0
  return false
}

/**
 * Fills gaps in `request` from `profile` — request wins on every key it
 * actually supplies.
 *
 * Shallow by design. A half-merged education array (profile's third entry
 * surviving underneath the two the user just submitted) would be worse than no
 * merge at all, because the user would have no way to delete an entry. So a
 * key the request supplies at all is taken wholesale.
 */
export function mergeWithProfile<T extends Record<string, unknown>>(
  request: T,
  profile: Record<string, unknown> | null,
): T {
  if (!profile) return request
  const merged: Record<string, unknown> = { ...request }
  for (const [key, value] of Object.entries(profile)) {
    if (isEmpty(merged[key]) && !isEmpty(value)) merged[key] = value
  }
  return merged as T
}

/**
 * The profile rendered as generation context.
 *
 * Deliberately NOT the raw row: goals and interests are motivation signals a
 * generator should be able to reference, while the structured blocks are
 * merged into the payload instead. Returns null when there is nothing worth
 * spending tokens on.
 */
export function profileNarrative(profile: CareerProfile | null): Record<string, unknown> | null {
  if (!profile) return null
  const narrative: Record<string, unknown> = {}
  if (!isEmpty(profile.goals)) narrative.goals = profile.goals
  if (!isEmpty(profile.interests)) narrative.interests = profile.interests
  if (!isEmpty(profile.certifications)) narrative.certifications = profile.certifications
  if (!isEmpty(profile.education_system)) narrative.education_system = profile.education_system
  if (!isEmpty(profile.pathway)) narrative.pathway = profile.pathway
  return Object.keys(narrative).length > 0 ? narrative : null
}

/**
 * How a generator should treat profile-derived context, as a prompt rule.
 *
 * The risk this guards against is specific: context the user did not restate in
 * this form is still real, but it is OLDER, and treating a stale profile fact
 * with the same confidence as a just-typed one is how a generator ends up
 * asserting something the person would not say about themselves today.
 */
export const PROFILE_CONTEXT_RULE =
  `CAREER PROFILE CONTEXT — some of the information you have been given comes from the person's saved Career Profile rather than the form they just filled in. Treat it as true but not necessarily current: it is what they told us previously, not what they just typed. Where the current form and the profile disagree, the current form wins, always. Use profile context to avoid re-asking for things they have already told us and to make the output more specific — never to assert a detail they did not supply in either place. The ANTI-HALLUCINATION rule applies to profile context exactly as it applies to form input.`
