/**
 * useJourneyStage — the shared "what stage of life is this person at" hook.
 *
 * Sibling to useUserType() (see hooks/useUserType.js), not a replacement for
 * it. Sourced from AuthContext, which loads it from profiles.journey_stage
 * (see the 20260914100000_profiles_journey_stage migration) whenever a
 * session starts and keeps it in sync locally the moment it's changed.
 *
 * Unlike user_type, journey_stage has no default — it starts null (nobody's
 * said yet) rather than quietly assuming one, since guessing it wrong would
 * misrepresent someone in a matching feature. Course Connect is the first
 * consumer; import this anywhere else that wants to group or match people
 * by shared life stage instead of by what they're literally doing.
 *
 * import { useJourneyStage } from '../hooks/useJourneyStage'
 * const { journeyStage, label, setJourneyStage, stages, loading } = useJourneyStage()
 *
 * Return shape:
 *   journeyStage — one of the JOURNEY_STAGES keys, or null if unset.
 *   label        — display label for the current stage, or null if unset.
 *   stages       — the full JOURNEY_STAGES list ({ key, label, short, sub }[])
 *                  for rendering a picker.
 *   loading      — true while the backing profile row is still being fetched.
 *   setJourneyStage(nextKey) — async, writes to profiles.journey_stage and
 *                  updates every consumer immediately. Resolves { error }
 *                  (error is null on success) — never throws.
 */

import { useAuth } from '../context/AuthContext'
import { JOURNEY_STAGES, journeyStageLabel } from '../constants/journeyStages'

export function useJourneyStage() {
  const { journeyStage, updateJourneyStage, profileLoading } = useAuth()
  return {
    journeyStage,
    label: journeyStage ? journeyStageLabel(journeyStage) : null,
    stages: JOURNEY_STAGES,
    loading: profileLoading,
    setJourneyStage: updateJourneyStage,
  }
}
