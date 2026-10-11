import { supabase } from './supabase'

// ─── Direct (1:1) messaging ─────────────────────────────────────────────────
//
// Backed by the start_direct_chat() RPC (see
// supabase/migrations/20260824140000_security_hardening.sql,
// 20260824150000_fk_and_rls_fixes.sql and the block-check added in
// 20261011224102_direct_messaging.sql) — a security-definer function that
// idempotently finds-or-creates a 'direct' chat_rooms row for a pair of
// users (deterministic, order-independent context_id, so the same pair
// always maps to the same room regardless of who starts it first) and
// joins both of them as participants. It refuses to run at all if either
// side has blocked the other. It was built well ahead of any screen using
// it ("'direct' isn't wired up in the app yet" — security_hardening.sql);
// this file, plus MessagesScreen.jsx, is that wiring.
//
// get_chat_room_peer_names / get_direct_message_contacts are two more
// security-definer RPCs added alongside it, because chat_participants' own
// RLS ("Users can read own participation") only ever lets a user read
// THEIR OWN participant row, never a co-participant's — so a plain
// client-side select can never answer "who else is in this room with me"
// or "who have I already got a real chat with", the same own-row-only
// limitation documented for `profiles` in homeActivityFeed.js. Both RPCs
// only ever return people who already share a real chat room with the
// caller — this deliberately is NOT a general user directory (Directory
// itself is still a static mock roster — see DirectoryScreen.jsx's own
// header comment — so there is nowhere yet to safely pick an arbitrary
// platform user to message).

// The exact message start_direct_chat() raises when either side has
// blocked the other.
const BLOCKED_MESSAGE = 'blocked'

function isBlockedError(error) {
  return !!error?.message && error.message.toLowerCase().includes(BLOCKED_MESSAGE)
}

// Finds-or-creates the 1:1 direct room between the signed-in user and
// otherUserId, and joins both as participants. Returns { roomId, blocked,
// error }. roomId is null when blocked is true or an unrelated error
// occurred — callers should check blocked first.
export async function startDirectChat(otherUserId, roomName) {
  if (!otherUserId) return { roomId: null, blocked: false, error: new Error('Missing user') }

  const { data, error } = await supabase.rpc('start_direct_chat', {
    other_user_id: otherUserId,
    room_name: roomName ?? null,
  })

  if (error) return { roomId: null, blocked: isBlockedError(error), error }
  return { roomId: data, blocked: false, error: null }
}

// ChatRoomScreen (via useChat) navigates by (contextType, contextId), not
// by room id, so once start_direct_chat() returns a room id this resolves
// the context_id to hand it. chat_rooms itself is readable by any
// authenticated user ("Authenticated can read chat rooms"), so this is a
// plain select, no RPC needed.
export async function fetchRoomContextId(roomId) {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select('context_id')
    .eq('id', roomId)
    .maybeSingle()
  if (error) return { contextId: null, error }
  return { contextId: data?.context_id ?? null, error: null }
}

// People the signed-in user can start/continue a direct conversation with —
// see the file header for why this is scoped to existing chat contacts
// rather than a general directory.
export async function fetchDirectMessageContacts() {
  const { data, error } = await supabase.rpc('get_direct_message_contacts')
  return { contacts: data || [], error }
}

// Resolves each direct room's OTHER participant, keyed by room_id — used to
// show the correct name on each side of a 1:1 chat (chat_rooms.name is a
// single shared value set by whichever side created the room, so on its
// own it is only ever right for one of the two people in it).
export async function fetchChatRoomPeerNames(roomIds) {
  const ids = (roomIds || []).filter(Boolean)
  if (!ids.length) return { peersByRoom: {}, error: null }

  const { data, error } = await supabase.rpc('get_chat_room_peer_names', { p_room_ids: ids })
  if (error) return { peersByRoom: {}, error }

  const peersByRoom = {}
  for (const row of data || []) {
    // A direct room only ever has one other participant; keep the first
    // if this is ever reused against a group context with several.
    if (!peersByRoom[row.room_id]) peersByRoom[row.room_id] = row
  }
  return { peersByRoom, error: null }
}
