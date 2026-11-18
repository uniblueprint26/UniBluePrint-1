// Mood words, shared by a Mood Board post's own mood (picked in the Composer)
// and a reaction's mood. `id` is the value stored in Postgres (public.feed_mood
// enum), so every id here must exist in that enum
// (supabase/migrations/20261118120000_feed_moods.sql).
//
// Founder-approved spec change (2026-11-18): the list is no longer the locked
// six. Many more Irish ways of saying how you feel were added, sorted into six
// plain groups, and 'delira' was retired.
//
//   MOODS         the original words that are still offered. Reactions
//                 (the react picker and mood pulse in components/feed/FeedKit.jsx)
//                 read this, so they are unchanged except that Delira is gone.
//   NEW_MOODS     the added words. They need the migration applied before they
//                 can be saved.
//   ALL_MOODS     everything, including hidden words, for looking a word up.
//   MOOD_GROUPS   the Composer's six groups, in order, each with its words.
//
// `hidden: true` means "do not offer this in a picker". Postgres cannot drop an
// enum value, so 'delira' stays in the enum and moodDef('delira') still
// resolves, so old posts and reactions keep rendering. Never reuse an id for a
// different word.
//
// `group` is the Composer group a word sits in. `original` marks the words that
// existed before this change (they stay in reaction pickers).

function tint(hex, alpha = 0.12) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}

function mood(id, emoji, label, group, color, extra = {}) {
  return { id, emoji, label, group, color, bg: tint(color, extra.alpha || 0.12), ...extra }
}

// Order here is the order shown inside each group.
const MOOD_LIST = [
  // Feeling great
  mood('flying_it',     '🔥', 'Flying It',     'great', '#C2572B', { original: true }),
  mood('buzzing',       '💡', 'Buzzing',       'great', '#A5813B', { original: true, alpha: 0.14 }),
  mood('made_up',       '🥳', 'Made Up',       'great', '#C2527F'),
  mood('chuffed',       '😄', 'Chuffed',       'great', '#C26A32'),
  mood('mighty',        '💪', 'Mighty',        'great', '#2F7F6F'),
  mood('over_the_moon', '🌙', 'Over the Moon', 'great', '#5B6FC2'),
  mood('class',         '🤩', 'Class',         'great', '#9B59B6'),

  // Feeling good
  mood('sound',         '☕', 'Sound',         'good',  '#4C8577', { original: true }),
  mood('good_form',     '😎', 'Good Form',     'good',  '#2E8FA3'),
  mood('sorted',        '✅', 'Sorted',        'good',  '#3E8E5A'),
  mood('delighted',     '😊', 'Delighted',     'good',  '#D07A3A'),
  mood('chilled',       '😌', 'Chilled',       'good',  '#4A9A9A'),
  mood('cosy',          '🛋️', 'Cosy',          'good',  '#B0754F'),

  // In between
  mood('grand',         '👌', 'Grand',         'between', '#3F7D5B'),
  mood('not_too_bad',   '🙂', 'Not Too Bad',   'between', '#4F7AA3'),
  mood('so_so',         '🫤', 'So-So',         'between', '#7A86A8'),
  mood('middling',      '😐', 'Middling',      'between', '#6C8CA6'),
  mood('meh',           '😶', 'Meh',           'between', '#8A8F9C'),
  mood('fair_enough',   '🤷', 'Fair Enough',   'between', '#5E8C8A'),
  mood('busy',          '🏃', 'Mad Busy',      'between', '#6A6FA8'),
  mood('locked_in',     '📚', 'Locked In',     'between', '#1E3A5F', { original: true, alpha: 0.08 }),

  // Not great
  mood('fed_up',        '😩', 'Fed Up',        'notgreat', '#7A6A58', { alpha: 0.14 }),
  mood('arsed',         '🙄', 'Not Arsed',     'notgreat', '#8A5A7A'),
  mood('spoofed',       '😒', 'Spoofed',       'notgreat', '#B0623E'),
  mood('flat',          '😑', 'Flat',          'notgreat', '#7F8A99', { alpha: 0.14 }),
  mood('low',           '😔', 'Low',           'notgreat', '#5F7399', { alpha: 0.14 }),
  mood('off_form',      '🥴', 'Off Form',      'notgreat', '#9A7B52', { alpha: 0.14 }),
  mood('homesick',      '🏠', 'Homesick',      'notgreat', '#5C7C9E', { alpha: 0.14 }),

  // Worn out
  mood('banjaxed',      '😮‍💨', 'Banjaxed',     'wornout', '#B5495B', { original: true }),
  mood('wrecked',       '😵', 'Wrecked',       'wornout', '#5F6B7A', { alpha: 0.14 }),
  mood('knackered',     '😴', 'Knackered',     'wornout', '#6B7F99', { alpha: 0.14 }),
  mood('shattered',     '🥱', 'Shattered',     'wornout', '#8576A8'),
  mood('drained',       '🪫', 'Drained',       'wornout', '#4E8A8F', { alpha: 0.14 }),
  mood('wiped',         '🫠', 'Wiped',         'wornout', '#A0728A'),

  // Rough
  mood('stressed',      '😰', 'Stressed',      'rough', '#8F5FA0'),
  mood('overwhelmed',   '🌊', 'Overwhelmed',   'rough', '#4B7F9C'),
  mood('raging',        '😡', 'Raging',        'rough', '#C23B3B'),
  mood('fuming',        '😤', 'Fuming',        'rough', '#B8452E'),
  mood('gutted',        '💔', 'Gutted',        'rough', '#9B3D4F'),
  mood('mortified',     '🙈', 'Mortified',     'rough', '#B9627A'),
  mood('scundered',     '😖', 'Scundered',     'rough', '#A0486B'),

  // Retired. Stays in the enum and in moodDef so old posts still render.
  mood('delira',        '🎉', 'Delira',        'great', '#7C3AED', { original: true, hidden: true }),
]

export const ALL_MOODS = MOOD_LIST

export const NEW_MOODS = MOOD_LIST.filter(m => !m.original)

// Offered in reaction pickers: the original words minus the hidden ones.
export const MOODS = MOOD_LIST.filter(m => m.original && !m.hidden)

export const MOOD_BY_ID = Object.fromEntries(MOOD_LIST.map(m => [m.id, m]))

export function moodDef(id) {
  return MOOD_BY_ID[id] || null
}

// Feature flag. The new words only exist in the database once
// 20261118120000_feed_moods.sql has been applied. Until the founder has
// confirmed that live, set this to false to keep the Composer to the original
// words. Default ON, as asked.
export const NEW_MOODS_ENABLED = true

// What the Composer's Mood Board picker offers.
export const COMPOSER_MOODS = (NEW_MOODS_ENABLED ? MOOD_LIST : MOODS).filter(m => !m.hidden)

// Six plain groups. The first one is open in the Composer, the rest sit under
// "More feelings".
export const MOOD_GROUP_DEFS = [
  { key: 'great',    title: 'Feeling great' },
  { key: 'good',     title: 'Feeling good' },
  { key: 'between',  title: 'In between' },
  { key: 'notgreat', title: 'Not great' },
  { key: 'wornout',  title: 'Worn out' },
  { key: 'rough',    title: 'Rough' },
]

// With the flag off there are only a handful of words, so they stay as one
// untitled group.
export const MOOD_GROUPS = NEW_MOODS_ENABLED
  ? MOOD_GROUP_DEFS.map(g => ({ ...g, moods: COMPOSER_MOODS.filter(m => m.group === g.key) }))
  : [{ key: 'all', title: null, moods: COMPOSER_MOODS }]
