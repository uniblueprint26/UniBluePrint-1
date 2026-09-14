/**
 * useInterests — the shared, reusable "what is this person into" hook.
 *
 * Sibling to useUserType()/useJourneyStage() in shape (sourced from
 * AuthContext, same immediate-local-update-on-write pattern), but built to
 * be the real shared infrastructure the founder asked for: "maybe giving
 * them an expanded version of interests to pick and even add their own."
 * Course Connect is the first consumer (its old journey-stage matching is
 * removed); Directory's upcoming "real, dynamic tags generated from real
 * profile data" phase (Task #12) is meant to read this exact hook and the
 * `profiles.interests` column it wraps, not a second copy of this concept.
 *
 * Backed by profiles.interests (text[], see the
 * 20260915100000_profiles_interests migration) — a flat array of plain
 * label strings that mixes predefined picks (see data/interests.js) and
 * freely-typed custom ones with no distinction at rest: once saved, a
 * custom interest works everywhere a predefined one does (search, display,
 * matching).
 *
 * import { useInterests } from '../hooks/useInterests'
 * const {
 *   interests, custom, predefined, max, loading,
 *   setInterests, addInterest, removeInterest, toggleInterest,
 * } = useInterests()
 *
 * Return shape:
 *   interests   — string[] of every interest label this person has set
 *                 (predefined + custom together), never null.
 *   custom      — the subset of `interests` that aren't on the predefined
 *                 list — i.e. what the person typed in themselves.
 *   predefined  — the full INTERESTS list ({ id, label, category }[]) for
 *                 rendering a picker grid.
 *   max         — MAX_INTERESTS, the combined predefined+custom cap.
 *   loading     — true while the backing profile row is still being fetched.
 *   setInterests(nextArray) — async, replaces the whole array in one write.
 *   addInterest(label)      — async, adds one label (predefined or custom,
 *                              case-insensitively de-duplicated, trimmed
 *                              and length-capped). No-ops if already set.
 *   removeInterest(label)   — async, removes one label.
 *   toggleInterest(label)   — async, adds if absent, removes if present.
 * All writes resolve { error } (error is null on success) — never throw.
 */

import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { INTERESTS, MAX_INTERESTS, MAX_CUSTOM_INTEREST_LENGTH } from '../data/interests'

const PREDEFINED_LABELS = new Set(INTERESTS.map(i => i.label.toLowerCase()))

/** Trims, collapses whitespace, and length-caps a self-typed interest label. */
export function normalizeInterestLabel(raw) {
  return String(raw || '').trim().replace(/\s+/g, ' ').slice(0, MAX_CUSTOM_INTEREST_LENGTH)
}

export function useInterests() {
  const { interests, updateInterests, profileLoading } = useAuth()
  const list = interests || []

  const custom = useMemo(
    () => list.filter(label => !PREDEFINED_LABELS.has(label.toLowerCase())),
    [list]
  )

  async function setInterests(nextArray) {
    return updateInterests(nextArray)
  }

  async function addInterest(label) {
    const clean = normalizeInterestLabel(label)
    if (!clean) return { error: new Error('Enter an interest first.') }
    if (list.some(l => l.toLowerCase() === clean.toLowerCase())) return { error: null } // already set
    if (list.length >= MAX_INTERESTS) return { error: new Error(`You can have up to ${MAX_INTERESTS} interests — remove one to add another.`) }
    return updateInterests([...list, clean])
  }

  async function removeInterest(label) {
    return updateInterests(list.filter(l => l.toLowerCase() !== label.toLowerCase()))
  }

  async function toggleInterest(label) {
    return list.some(l => l.toLowerCase() === label.toLowerCase())
      ? removeInterest(label)
      : addInterest(label)
  }

  return {
    interests: list,
    custom,
    predefined: INTERESTS,
    max: MAX_INTERESTS,
    loading: profileLoading,
    setInterests,
    addInterest,
    removeInterest,
    toggleInterest,
  }
}
