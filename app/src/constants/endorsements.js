/**
 * endorsements — the shared, fixed vocabulary for peer skill-endorsements.
 *
 * Shown ONLY on a student's full Directory profile view (see
 * screens/StudentProfileScreen.jsx), never on the compact Directory
 * card/list (screens/DirectoryScreen.jsx) — that split is a deliberate
 * product decision, not an oversight.
 *
 * Backed by the peer_endorsements table (see the
 * 20261015140000_directory_credentials_endorsements migration): one row per
 * (endorser, endorsed, tag), unique per combination, endorser can't endorse
 * themselves. This is a small, fixed, cosmetic set of tags — deliberately NOT
 * a reputation score, leaderboard, or weighted ranking. ENDORSEMENT_TAGS here
 * must stay in sync with that migration's `tag` check constraint; changing
 * one without the other will make new tags fail to insert (or allow tags the
 * UI never offers).
 */

export const ENDORSEMENT_TAGS = [
  'Reliable',
  'Great collaborator',
  'Strong communicator',
  'Shows up prepared',
  'Generous with knowledge',
  'Easy to work with',
]
