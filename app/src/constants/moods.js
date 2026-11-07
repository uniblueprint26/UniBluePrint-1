// The 6 Irish-flavored moods — shared by a Thread's own mood (picked in the
// Composer's "Mood Board" picker UI) and a reaction's mood (picked from the
// same 6-mood picker when reacting to any post). Locked list — do not add,
// remove or rename entries without a spec change.
//
// `id` is the value stored in Postgres (public.feed_mood enum) — keep these
// in sync with supabase/migrations/20261107090000_social_feed.sql.

export const MOODS = [
  { id: 'flying_it', emoji: '🔥', label: 'Flying It', color: '#C2572B', bg: 'rgba(194,87,43,0.12)' },
  { id: 'locked_in', emoji: '📚', label: 'Locked In', color: '#1E3A5F', bg: 'rgba(30,58,95,0.08)' },
  { id: 'banjaxed',  emoji: '😮‍💨', label: 'Banjaxed', color: '#B5495B', bg: 'rgba(181,73,91,0.12)' },
  { id: 'delira',    emoji: '🎉', label: 'Delira', color: '#7C3AED', bg: 'rgba(124,58,237,0.12)' },
  { id: 'sound',     emoji: '☕', label: 'Sound', color: '#4C8577', bg: 'rgba(76,133,119,0.12)' },
  { id: 'buzzing',   emoji: '💡', label: 'Buzzing', color: '#A5813B', bg: 'rgba(165,129,59,0.14)' },
]

export const MOOD_BY_ID = Object.fromEntries(MOODS.map(m => [m.id, m]))

export function moodDef(id) {
  return MOOD_BY_ID[id] || null
}
