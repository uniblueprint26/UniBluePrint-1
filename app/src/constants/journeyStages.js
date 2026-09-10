/**
 * journeyStages — the "what stage of life are you actually at" concept.
 *
 * This is the fix for the founder's Course Connect complaint: the hub was
 * grouping people by what they're literally doing (course, industry, or
 * user_type track — student vs apprentice vs gap year vs worker). That's
 * the wrong axis. His words: "it's not about what you're doing — that's
 * where we merge people from students, gap year, apprentice to just young
 * people... same situation, same age, same journey — which is why it's not
 * tied to a specific path."
 *
 * journey_stage is that missing axis. It sits ALONGSIDE user_type (see
 * constants/userTypes.js) rather than replacing it — user_type still says
 * *what* someone is doing (useful for framing copy, Budgeting categories,
 * etc), journey_stage says *where they are in it*, and it's deliberately
 * defined so the same four values make sense to a Student, an Apprentice,
 * someone on a Gap Year, and a young Worker alike. Course Connect's people-
 * matching should primarily group by this, explicitly mixing user_types
 * within a stage, with course/subject staying a secondary filter.
 *
 * Stored on profiles.journey_stage (see the
 * 20260914100000_profiles_journey_stage migration) — nullable, no default,
 * because guessing someone's stage for them (unlike user_type, which
 * reasonably defaults to 'student') would misrepresent them in a matching
 * feature. null means "hasn't said yet" and screens should prompt for it
 * rather than silently assuming one.
 *
 * import { useJourneyStage } from '../hooks/useJourneyStage'
 * const { journeyStage, label, setJourneyStage, stages, loading } = useJourneyStage()
 */

export const JOURNEY_STAGE_FINDING_FEET  = 'finding_feet'
export const JOURNEY_STAGE_MOMENTUM      = 'building_momentum'
export const JOURNEY_STAGE_CROSSROADS    = 'at_a_crossroads'
export const JOURNEY_STAGE_WRAPPING_UP   = 'wrapping_up'

export const JOURNEY_STAGES = [
  {
    key:   JOURNEY_STAGE_FINDING_FEET,
    label: 'Finding Your Feet',
    short: 'New to this',
    sub:   "Everything's new — first year, first block, first few weeks in. Still working out how it all works.",
  },
  {
    key:   JOURNEY_STAGE_MOMENTUM,
    label: 'In the Thick of It',
    short: 'Building momentum',
    sub:   "Settled in and grinding — you know the routine now, you're just getting through it.",
  },
  {
    key:   JOURNEY_STAGE_CROSSROADS,
    label: 'At a Crossroads',
    short: 'Weighing up what next',
    sub:   "Facing a big decision about what's next — change course, switch trade, go back to study, take the leap.",
  },
  {
    key:   JOURNEY_STAGE_WRAPPING_UP,
    label: 'Wrapping Up',
    short: 'Figuring out what next',
    sub:   "Finishing this chapter — final year, final phase, final few weeks — and figuring out where you land after.",
  },
]

const VALID_KEYS = new Set(JOURNEY_STAGES.map(s => s.key))

export function isValidJourneyStage(key) {
  return VALID_KEYS.has(key)
}

export function journeyStageLabel(key) {
  return JOURNEY_STAGES.find(s => s.key === key)?.label || null
}

export function journeyStageShort(key) {
  return JOURNEY_STAGES.find(s => s.key === key)?.short || null
}
