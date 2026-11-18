// Mood words, shared by a Mood Board post's own mood (picked in the Composer)
// and a reaction's mood. `id` is the value stored in Postgres (public.feed_mood
// enum), so every id here must exist in that enum.
//
// Founder-approved spec change (2026-11-18): the list is no longer the locked
// six. More Irish mood words were added and 'delira' was retired.
//
//   MOODS         the original words that are still offered. Reactions
//                 (the react picker and mood pulse in components/feed/FeedKit.jsx)
//                 read this, so they are unchanged except that Delira is gone.
//   NEW_MOODS     the added words. They need the migration
//                 supabase/migrations/20261118120000_feed_moods.sql applied
//                 before they can be saved.
//   ALL_MOODS     everything, including hidden words, for looking a word up.
//
// `hidden: true` means "do not offer this in a picker". Postgres cannot drop an
// enum value, so 'delira' stays in the enum and moodDef('delira') still
// resolves, so old posts and reactions keep rendering.
//
// `tone` groups a word in the Composer: up, neutral or down.

const ORIGINAL_MOODS = [
  { id: 'flying_it', emoji: '🔥', label: 'Flying It', tone: 'up',      color: '#C2572B', bg: 'rgba(194,87,43,0.12)' },
  { id: 'locked_in', emoji: '📚', label: 'Locked In', tone: 'neutral', color: '#1E3A5F', bg: 'rgba(30,58,95,0.08)' },
  { id: 'banjaxed',  emoji: '😮‍💨', label: 'Banjaxed',  tone: 'down',    color: '#B5495B', bg: 'rgba(181,73,91,0.12)' },
  { id: 'delira',    emoji: '🎉', label: 'Delira',    tone: 'up',      color: '#7C3AED', bg: 'rgba(124,58,237,0.12)', hidden: true },
  { id: 'sound',     emoji: '☕', label: 'Sound',     tone: 'up',      color: '#4C8577', bg: 'rgba(76,133,119,0.12)' },
  { id: 'buzzing',   emoji: '💡', label: 'Buzzing',   tone: 'up',      color: '#A5813B', bg: 'rgba(165,129,59,0.14)' },
]

export const NEW_MOODS = [
  // Feeling good
  { id: 'chuffed',     emoji: '😄', label: 'Chuffed',     tone: 'up',      color: '#C26A32', bg: 'rgba(194,106,50,0.12)' },
  { id: 'mighty',      emoji: '💪', label: 'Mighty',      tone: 'up',      color: '#2F7F6F', bg: 'rgba(47,127,111,0.12)' },
  { id: 'sorted',      emoji: '✅', label: 'Sorted',      tone: 'up',      color: '#3E8E5A', bg: 'rgba(62,142,90,0.12)' },
  { id: 'made_up',     emoji: '🥳', label: 'Made Up',     tone: 'up',      color: '#C2527F', bg: 'rgba(194,82,127,0.12)' },
  { id: 'good_form',   emoji: '😎', label: 'Good Form',   tone: 'up',      color: '#2E8FA3', bg: 'rgba(46,143,163,0.12)' },
  // In between
  { id: 'grand',       emoji: '👌', label: 'Grand',       tone: 'neutral', color: '#3F7D5B', bg: 'rgba(63,125,91,0.12)' },
  { id: 'not_too_bad', emoji: '🙂', label: 'Not Too Bad', tone: 'neutral', color: '#4F7AA3', bg: 'rgba(79,122,163,0.12)' },
  { id: 'busy',        emoji: '🏃', label: 'Mad Busy',    tone: 'neutral', color: '#6A6FA8', bg: 'rgba(106,111,168,0.12)' },
  // Not great
  { id: 'arsed',       emoji: '🙄', label: 'Arsed',       tone: 'down',    color: '#8A5A7A', bg: 'rgba(138,90,122,0.12)' },
  { id: 'spoofed',     emoji: '😒', label: 'Spoofed',     tone: 'down',    color: '#B0623E', bg: 'rgba(176,98,62,0.12)' },
  { id: 'wrecked',     emoji: '😵', label: 'Wrecked',     tone: 'down',    color: '#5F6B7A', bg: 'rgba(95,107,122,0.14)' },
  { id: 'knackered',   emoji: '😴', label: 'Knackered',   tone: 'down',    color: '#6B7F99', bg: 'rgba(107,127,153,0.14)' },
  { id: 'raging',      emoji: '😡', label: 'Raging',      tone: 'down',    color: '#C23B3B', bg: 'rgba(194,59,59,0.12)' },
  { id: 'scundered',   emoji: '😖', label: 'Scundered',   tone: 'down',    color: '#A0486B', bg: 'rgba(160,72,107,0.12)' },
  { id: 'gutted',      emoji: '💔', label: 'Gutted',      tone: 'down',    color: '#9B3D4F', bg: 'rgba(155,61,79,0.12)' },
  { id: 'mortified',   emoji: '🙈', label: 'Mortified',   tone: 'down',    color: '#B9627A', bg: 'rgba(185,98,122,0.12)' },
  { id: 'fed_up',      emoji: '😩', label: 'Fed Up',      tone: 'down',    color: '#7A6A58', bg: 'rgba(122,106,88,0.14)' },
  { id: 'homesick',    emoji: '🏠', label: 'Homesick',    tone: 'down',    color: '#5C7C9E', bg: 'rgba(92,124,158,0.14)' },
  { id: 'stressed',    emoji: '😰', label: 'Stressed',    tone: 'down',    color: '#8F5FA0', bg: 'rgba(143,95,160,0.12)' },
  { id: 'overwhelmed', emoji: '🌊', label: 'Overwhelmed', tone: 'down',    color: '#4B7F9C', bg: 'rgba(75,127,156,0.12)' },
]

// Feature flag. The new words only exist in the database once
// 20261118120000_feed_moods.sql has been applied. Until the founder has
// confirmed that live, set this to false to keep the Composer to the original
// words. Default ON, as asked.
export const NEW_MOODS_ENABLED = true

// Offered in reaction pickers: the original words minus the hidden ones.
export const MOODS = ORIGINAL_MOODS.filter(m => !m.hidden)

export const ALL_MOODS = [...ORIGINAL_MOODS, ...NEW_MOODS]

export const MOOD_BY_ID = Object.fromEntries(ALL_MOODS.map(m => [m.id, m]))

export function moodDef(id) {
  return MOOD_BY_ID[id] || null
}

// What the Composer's Mood Board picker offers.
export const COMPOSER_MOODS = (NEW_MOODS_ENABLED ? [...MOODS, ...NEW_MOODS] : MOODS).filter(m => !m.hidden)

// How many words of each group show before "More words".
export const MOODS_VISIBLE_PER_GROUP = 3

const TONE_GROUPS = [
  { key: 'up',      title: 'Feeling good' },
  { key: 'neutral', title: 'In between' },
  { key: 'down',    title: 'Not great' },
]

// Positive, neutral, negative. With the flag off there is only a handful of
// words, so they stay as one untitled group. Within a group, words keep the
// order of the lists above, and the first row is the one shown before "More".
export const MOOD_GROUPS = NEW_MOODS_ENABLED
  ? TONE_GROUPS.map(g => ({ ...g, moods: COMPOSER_MOODS.filter(m => m.tone === g.key) }))
  : [{ key: 'all', title: null, moods: COMPOSER_MOODS }]
