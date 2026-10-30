import { FONT_SANS, BORDER } from './theme'
import { avatarColorFor, initialsFor } from './avatarColor'

// Studio Phase 14 -- shared "who is this" visual: a real uploaded photo
// when profiles.avatar_url exists, else initials in a colour derived
// deterministically from the person's id -- same person, same colour,
// every time, with no stored colour field needed. See avatarColor.js for
// the hash/palette (copied exactly from the mobile app's own avatar
// treatment) and why it's a separate file.

// Names team_tasks/studio_requests RPCs fall back to for a column with no
// real person behind it -- rendered as a neutral placeholder, not hashed
// into a colour+initials bubble as if it were a real teammate.
const PLACEHOLDER_NAMES = new Set(['Unassigned', 'Unknown', ''])

/**
 * `name`: display name (already resolved server-side, e.g. assignee_name).
 * `userId`: the real auth user id, if known -- preferred for the colour
 * hash (stable even if a person's display name later changes); falls back
 * to hashing `name` itself when no id is available (e.g. a free-text
 * requester_name with no linked account).
 * `avatarUrl`: profiles.avatar_url, if the RPC resolved one.
 * `size`: diameter in px (default 26 -- inline with a 13px name label).
 */
export default function Avatar({ name, userId, avatarUrl, size = 26, title }) {
  const px = `${size}px`
  const isPlaceholder = PLACEHOLDER_NAMES.has(name)

  if (avatarUrl && !isPlaceholder) {
    return (
      <img
        src={avatarUrl}
        alt=""
        title={title ?? name}
        style={{
          width: px, height: px, borderRadius: '50%', objectFit: 'cover',
          flexShrink: 0, border: `1px solid ${BORDER}`, display: 'inline-block', verticalAlign: 'middle',
        }}
      />
    )
  }

  const bg = isPlaceholder ? 'var(--studio-border-strong)' : avatarColorFor(userId || name)
  return (
    <span
      role="img"
      aria-label={isPlaceholder ? 'Unassigned' : (title ?? name)}
      title={title ?? name}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: px, height: px, borderRadius: '50%', background: bg,
        color: isPlaceholder ? 'var(--studio-grey)' : '#FFFFFF',
        fontFamily: FONT_SANS, fontWeight: 700, fontSize: `${Math.max(9, Math.round(size * 0.4))}px`,
        flexShrink: 0, lineHeight: 1, verticalAlign: 'middle',
      }}
    >
      {isPlaceholder ? '–' : initialsFor(name)}
    </span>
  )
}
