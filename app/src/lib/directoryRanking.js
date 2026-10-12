/**
 * directoryRanking — the v1 "correct recommendations" relevance heuristic
 * for DirectoryScreen.jsx.
 *
 * The founder's brief: discovery should rank by relevance, not just list
 * everyone — driven by shared data: interests, course/year, and location
 * if the app has one. This is deliberately a simple, explainable
 * point-scoring heuristic (NOT a machine-learning recommender) so it's easy
 * to read, audit, and retune later. Every point value below is a named
 * constant for exactly that reason.
 *
 * Signals scored, and why these four:
 *   - Shared interest tags (profiles.interests) — the richest, most
 *     granular signal; one point value PER shared tag, so two people who
 *     share five interests clearly outrank two people who share one.
 *   - Same course (profiles.course) — a strong, single-bit signal: either
 *     you're doing the same course or you're not.
 *   - Same year of study (profiles.year_of_study) — a weaker single-bit
 *     signal than course (two people on very different courses in the same
 *     year have less in common than two people on the same course in
 *     different years), so it's weighted lower.
 *   - Same institution (profiles.institution) — profiles has no dedicated
 *     "location" or "campus" column; institution is the closest real stand-
 *     in for it (see the schema migration's own comment), so it plays that
 *     role here.
 *
 * All matching is exact-string, case-insensitive after trimming — no fuzzy
 * matching, nothing speculative. `viewer` and `candidate` both read the
 * same five fields: { interests, course, year_of_study, institution }.
 */

// ── Tunable weights ──────────────────────────────────────────────────────────
// Change these to retune ranking; nothing else needs to change.
export const WEIGHTS = {
  PER_SHARED_INTEREST: 3,
  SAME_COURSE:         5,
  SAME_YEAR:            3,
  SAME_INSTITUTION:    2,
}

function norm(value) {
  return String(value || '').trim().toLowerCase()
}

function normArray(values) {
  return new Set((Array.isArray(values) ? values : []).map(norm).filter(Boolean))
}

/**
 * Scores one candidate against the viewer. Returns
 *   { score: number, reasons: string[] }
 * `reasons` is a short, human-readable breakdown (e.g. "3 shared interests",
 * "Same course") — shown on the Directory card so the ranking is visibly
 * auditable to the person using it, not a opaque number.
 */
export function scoreMatch(viewer, candidate) {
  const reasons = []
  let score = 0

  const viewerInterests = normArray(viewer?.interests)
  const candidateInterests = Array.isArray(candidate?.interests) ? candidate.interests : []
  const sharedInterestCount = candidateInterests
    .filter(label => viewerInterests.has(norm(label)))
    .length
  if (sharedInterestCount > 0) {
    score += sharedInterestCount * WEIGHTS.PER_SHARED_INTEREST
    reasons.push(`${sharedInterestCount} shared interest${sharedInterestCount === 1 ? '' : 's'}`)
  }

  const viewerCourse = norm(viewer?.course)
  if (viewerCourse && viewerCourse === norm(candidate?.course)) {
    score += WEIGHTS.SAME_COURSE
    reasons.push('Same course')
  }

  const viewerYear = norm(viewer?.year_of_study)
  if (viewerYear && viewerYear === norm(candidate?.year_of_study)) {
    score += WEIGHTS.SAME_YEAR
    reasons.push('Same year')
  }

  const viewerInstitution = norm(viewer?.institution)
  if (viewerInstitution && viewerInstitution === norm(candidate?.institution)) {
    score += WEIGHTS.SAME_INSTITUTION
    reasons.push('Same institution')
  }

  return { score, reasons }
}

/**
 * Scores and sorts every candidate against the viewer's own profile fields,
 * highest relevance first. Ties break alphabetically by name so the order
 * is stable and predictable rather than depending on fetch order.
 *
 * Returns a NEW array of candidates, each with `_matchScore` (number) and
 * `_matchReasons` (string[]) attached — the raw candidate object is
 * otherwise untouched.
 */
export function rankDirectoryCandidates(viewer, candidates) {
  return (candidates || [])
    .map(candidate => {
      const { score, reasons } = scoreMatch(viewer, candidate)
      return { ...candidate, _matchScore: score, _matchReasons: reasons }
    })
    .sort((a, b) => {
      if (b._matchScore !== a._matchScore) return b._matchScore - a._matchScore
      return String(a.full_name || '').localeCompare(String(b.full_name || ''))
    })
}
