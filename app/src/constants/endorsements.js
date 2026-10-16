/**
 * endorsements — the shared, fixed vocabulary for peer skill-endorsements,
 * plus the free-typed "custom" endorsement option alongside it.
 *
 * Shown ONLY on a student's full Directory profile view (see
 * screens/StudentProfileScreen.jsx), never on the compact Directory
 * card/list (screens/DirectoryScreen.jsx) — that split is a deliberate
 * product decision, not an oversight.
 *
 * Backed by the peer_endorsements table (see the
 * 20261015140000_directory_credentials_endorsements migration, widened by
 * 20261016090000_peer_endorsements_custom_text): one row per
 * (endorser, endorsed, tag), unique per combination for the 6 preset tags
 * below, endorser can't endorse themselves. This is a small, fixed, cosmetic
 * set of tags — deliberately NOT a reputation score, leaderboard, or
 * weighted ranking. ENDORSEMENT_TAGS here must stay in sync with that
 * migration's `tag` check constraint; changing one without the other will
 * make new tags fail to insert (or allow tags the UI never offers).
 *
 * CUSTOM_ENDORSEMENT_TAG is the sentinel `tag` value for a free-typed
 * endorsement (its text lives in the `custom_text` column, never in `tag`
 * itself). Unlike the presets, a viewer can give a person any number of
 * custom endorsements — free text naturally varies, so there's no
 * "one of each" cap for it (peer_endorsements_unique_preset_idx only
 * covers non-Custom rows).
 */

export const ENDORSEMENT_TAGS = [
  'Reliable',
  'Great collaborator',
  'Strong communicator',
  'Shows up prepared',
  'Generous with knowledge',
  'Easy to work with',
]

/** Sentinel `tag` value marking a free-typed endorsement (see custom_text). */
export const CUSTOM_ENDORSEMENT_TAG = 'Custom'

/**
 * Max characters for a free-typed custom endorsement. Mirrors the
 * pick-from-a-list-or-type-your-own convention elsewhere in the app
 * (MAX_CUSTOM_INTEREST_LENGTH in data/interests.js, MAX_CREDENTIAL_LENGTH in
 * constants/directory.js): 140 is longer than MAX_CREDENTIAL_LENGTH (60 — a
 * short label like "BA Business, DCU") since this is a one-line sentence
 * about someone, not a label, but well short of MAX_BIO_LENGTH (280 — a
 * paragraph), since it's meant to stay a single short line in the UI.
 * Enforced again at the database level by
 * peer_endorsements_custom_text_shape, not just here.
 */
export const MAX_CUSTOM_ENDORSEMENT_LENGTH = 140
