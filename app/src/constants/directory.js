/**
 * directory — shared constants for the real Directory discovery feature.
 *
 * STATUS_OPTIONS is the "what are you open to / looking for" concept.
 * SignUpScreen.jsx has collected this since before the Directory went live
 * (its own local STATUS_OPTIONS array, written only to
 * user_metadata.statuses, never persisted anywhere queryable) — this is the
 * same concept, promoted to shared infrastructure and now backed by the
 * real `profiles.statuses` column (see the
 * 20261012110000_directory_discovery migration) so SignUpScreen and the
 * Directory Profile settings (ProfileScreen.jsx) both read/write the exact
 * same list rather than keeping two copies in sync by hand.
 *
 * SOCIAL_LINK_FIELDS is the small, fixed set of self-reported contact links
 * shown on a Directory card (profiles.social_links, a jsonb object keyed by
 * these `key`s). Deliberately a short fixed list, not a free-form array —
 * keeps the settings UI and the card layout simple and predictable.
 */

export const STATUS_OPTIONS = [
  {
    key:   'open',
    label: 'Open to Connect',
    sub:   'Happy to connect with others across the platform.',
  },
  {
    key:   'study',
    label: 'Looking for a Study Group',
    sub:   'Searching for others on the same module or course.',
  },
  {
    key:   'mentor',
    label: 'Happy to Mentor Others',
    sub:   'Willing to share advice or experience with others.',
  },
]

export const STATUS_LABEL_BY_KEY = Object.fromEntries(STATUS_OPTIONS.map(s => [s.key, s.label]))

/**
 * Directory visibility (public/private) options — shared by SignUpScreen.jsx
 * (decided once at sign-up) and the Directory Profile settings modal in
 * ProfileScreen.jsx (changeable later), so both present the exact same two
 * choices and copy rather than keeping two arrays in sync by hand. Backed by
 * profiles.discoverable (see the 20261012110000_directory_discovery
 * migration), which defaults to true (public) at the database level too.
 */
export const VISIBILITY_OPTIONS = [
  {
    key:   'public',
    label: 'Public — visible in Directory search',
    sub:   'Other UniBlueprint students can find and message you.',
  },
  {
    key:   'private',
    label: 'Private — hidden from Directory search',
    sub:   "You won't appear in anyone's Directory search or results.",
  },
]

export const SOCIAL_LINK_FIELDS = [
  { key: 'instagram', label: 'Instagram', placeholder: '@handle or full link' },
  { key: 'linkedin',  label: 'LinkedIn',  placeholder: 'Profile link' },
  { key: 'other',     label: 'Other',     placeholder: 'Any other link' },
]

/** Max characters for the free-text Directory bio. */
export const MAX_BIO_LENGTH = 280

/** Max characters for any one social link value. */
export const MAX_SOCIAL_LINK_LENGTH = 120

/**
 * Credentials — a short, self-written free-text list shown on the Directory
 * card (e.g. "BA Business, DCU", "Qualified Electrician", "2nd Year Law").
 * Backed by profiles.directory_credentials (see the
 * 20261015140000_directory_credentials_endorsements migration), which
 * enforces the same MAX_CREDENTIALS cap at the database level
 * (profiles_directory_credentials_max3) — not just here.
 */
export const MAX_CREDENTIALS = 3
export const MAX_CREDENTIAL_LENGTH = 60
