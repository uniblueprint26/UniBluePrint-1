import { supabase } from './supabase'

/**
 * Foundation Blueprint §08 — the Career Profile, client side.
 *
 * The builders call `loadProfileDefaults()` on mount to prefill themselves, so
 * a returning user is not retyping their education into a fourth form. Nothing
 * here throws on "no profile yet": a user who lands straight on the CV builder
 * without ever visiting the profile page must get exactly the experience they
 * got before this existed.
 */

const PROFILE_COLS =
  'personal_info, education, experience, skills, achievements, certifications, ' +
  'education_system, pathway, goals, interests, has_no_experience'

const TARGET_COLS =
  'id, label, target_role, target_industry, target_company, target_course, ' +
  'target_institution, job_description, is_active, created_at'

export async function fetchCareerProfile(userId) {
  const { data, error } = await supabase
    .from('career_profiles')
    .select(PROFILE_COLS)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Upsert on user_id — the table has a unique constraint there, one row per user. */
export async function saveCareerProfile(userId, fields) {
  const { data, error } = await supabase
    .from('career_profiles')
    .upsert({ user_id: userId, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select(PROFILE_COLS)
    .single()
  if (error) throw error
  return data
}

export async function fetchCareerTargets(userId) {
  const { data, error } = await supabase
    .from('career_targets')
    .select(TARGET_COLS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchActiveTarget(userId) {
  const { data, error } = await supabase
    .from('career_targets')
    .select(TARGET_COLS)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Creates a target and makes it the active one.
 *
 * Inserted inactive first, then activated through the RPC. Inserting with
 * is_active true directly would collide with the partial unique index whenever
 * another target is already active — the RPC deactivates and activates inside
 * one transaction, which is the only ordering that cannot transiently violate
 * the index.
 */
export async function createCareerTarget(userId, fields) {
  const { data, error } = await supabase
    .from('career_targets')
    .insert([{ user_id: userId, ...fields, is_active: false }])
    .select(TARGET_COLS)
    .single()
  if (error) throw error
  await setActiveTarget(data.id)
  return { ...data, is_active: true }
}

export async function setActiveTarget(targetId) {
  const { error } = await supabase.rpc('set_active_career_target', { p_target_id: targetId })
  if (error) throw error
}

export async function deleteCareerTarget(targetId) {
  const { error } = await supabase.from('career_targets').delete().eq('id', targetId)
  if (error) throw error
}

/**
 * Profile + active target in one call, shaped for prefilling a builder form.
 *
 * Returns nulls rather than throwing when the user has no profile — a builder
 * must never fail to load because the optional profile layer is empty.
 */
export async function loadProfileDefaults(userId) {
  try {
    const [profile, target] = await Promise.all([
      fetchCareerProfile(userId),
      fetchActiveTarget(userId),
    ])
    return { profile: profile || null, target: target || null }
  } catch {
    return { profile: null, target: null }
  }
}

/** Profile skills, flattened to one deduped comma-separated string. Mirrors the backend helper. */
export function flattenProfileSkills(profile) {
  if (!profile?.skills) return []
  const { technical, soft, languages, tools } = profile.skills
  const parts = [technical, soft, languages, tools]
    .filter((v) => typeof v === 'string' && v.trim().length > 0)
    .flatMap((v) => v.split(',').map((s) => s.trim()).filter(Boolean))
  return [...new Set(parts)]
}

/** Profile experience, rendered as short narrative text. Mirrors the backend helper. */
export function experienceNarrative(profile) {
  if (!profile?.experience?.length) return ''
  return profile.experience
    .map((r) => {
      const head = [r.job_title, r.company].filter(Boolean).join(' at ')
      return [head, r.dates, r.responsibilities].filter(Boolean).join(' — ')
    })
    .filter(Boolean)
    .join('\n')
}

/** True for null, undefined, '', whitespace, [], {}. Mirrors the backend helper. */
function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Fills blanks in `form` from `defaults`. Shallow, and the form always wins —
 * same precedence rule the backend applies, so what the user sees prefilled is
 * what the generator will actually receive.
 */
export function applyDefaults(form, defaults) {
  if (!defaults) return form
  const next = { ...form }
  for (const [key, value] of Object.entries(defaults)) {
    if (isEmpty(next[key]) && !isEmpty(value)) next[key] = value
  }
  return next
}
