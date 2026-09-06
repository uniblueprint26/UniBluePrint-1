import { supabase } from './supabase'

// ─── Home dashboard "Live Activity" feed ───────────────────────────────────
//
// Pulls straight from the real domain tables rather than a generic events
// log, per the six event types the dashboard shows. RLS shapes what each
// query can actually see:
//   - submissions & connection_requests are locked to the signed-in user's
//     own rows ("Users can read own submissions/connection_requests"), so
//     those two event types are inherently personal.
//   - coach_profiles, posts and deals are readable platform-wide to any
//     authenticated user, so those three are genuinely global activity.
// profiles is also locked to "own row only", so cross-user names can't be
// joined here — posts.author_name is already denormalised for exactly this
// reason and is used as-is; the other personal event types use the
// signed-in user's own name, which is all that's needed for them anyway.

const DOT = {
  submission_received: '#F59E0B', // amber
  submission_delivered: '#16A34A', // green
  coach_available: '#1E3A5F', // navy
  campus_post: '#2E6DB4', // blue
  study_group_joined: '#7C3AED', // purple
  partner_deal: '#C9A24B', // gold
}

function firstNameOf(name) {
  if (!name) return 'Someone'
  return String(name).trim().split(/\s+/)[0]
}

export { DOT as ACTIVITY_DOT }

export async function fetchHomeActivity({ userId, firstName }) {
  const events = []

  const [submissionsRes, coachesRes, postsRes, connectionsRes, dealsRes] = await Promise.all([
    supabase
      .from('submissions')
      .select('id, stage, submitted_at, delivered_at, services(name)')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false })
      .limit(8),
    supabase
      .from('coach_profiles')
      .select('id, specialisation, created_at, available')
      .eq('available', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('posts')
      .select('id, author_name, created_at, boards(name)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('connection_requests')
      .select('id, status, created_at, responded_at, requester_id, recipient_id')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq('status', 'accepted')
      .order('responded_at', { ascending: false })
      .limit(8),
    supabase
      .from('deals')
      .select('id, title, created_at, active, partners(name)')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  for (const row of submissionsRes.data || []) {
    const serviceName = row.services?.name || 'service'
    if (row.delivered_at) {
      events.push({
        id: `sub-delivered-${row.id}`,
        dot: DOT.submission_delivered,
        text: `${firstName}'s ${serviceName} is ready`,
        at: row.delivered_at,
      })
    } else {
      events.push({
        id: `sub-received-${row.id}`,
        dot: DOT.submission_received,
        text: `${firstName} submitted a ${serviceName}`,
        at: row.submitted_at,
      })
    }
  }

  // coach_profiles has no location column — this is an Ireland-only student
  // platform (every coach on Elevation Blueprint lists an Irish location),
  // so "Ireland" is used as the location fallback rather than fabricating a
  // more specific one that doesn't exist in the schema.
  for (const row of coachesRes.data || []) {
    const category = row.specialisation || 'career'
    events.push({
      id: `coach-${row.id}`,
      dot: DOT.coach_available,
      text: `New ${category} coach available in Ireland`,
      at: row.created_at,
    })
  }

  for (const row of postsRes.data || []) {
    const boardName = row.boards?.name || 'a board'
    events.push({
      id: `post-${row.id}`,
      dot: DOT.campus_post,
      text: `${firstNameOf(row.author_name)} posted in ${boardName}`,
      at: row.created_at,
    })
  }

  for (const row of connectionsRes.data || []) {
    events.push({
      id: `connection-${row.id}`,
      dot: DOT.study_group_joined,
      text: `${firstName} joined a study group`,
      at: row.responded_at || row.created_at,
    })
  }

  for (const row of dealsRes.data || []) {
    const partnerName = row.partners?.name || 'a partner'
    events.push({
      id: `deal-${row.id}`,
      dot: DOT.partner_deal,
      text: `New deal from ${partnerName}`,
      at: row.created_at,
    })
  }

  return events
    .filter(e => e.at)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8)
}
