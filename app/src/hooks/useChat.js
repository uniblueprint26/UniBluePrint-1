/**
 * useChat — reusable hook for any chat room on the platform.
 *
 * Handles:
 *  • Finding or creating the room by (contextType, contextId)
 *  • Joining the current user as a participant
 *  • Loading the initial message history
 *  • Subscribing to Supabase Realtime for live incoming messages
 *  • Exposing sendMessage and markRead helpers
 *
 * contextType: 'ad' | 'carpool' | 'board' | 'direct'
 * contextId:   stable string identifier for the parent context
 *
 * otherParticipantId / otherParticipantName: when a chat is opened against a
 * specific other person (e.g. tapping "Message"/"Join"/"Chat" on someone
 * else's post), pass their user id and display name so they're added as a
 * room participant too — otherwise they never see or get notified of the
 * message, since only the opener ever joins the room.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { assertTextClean } from '../lib/moderation'

export function useChat({
  contextType, contextId, roomName, userId, userDisplayName,
  otherParticipantId, otherParticipantName,
}) {
  const [roomId,    setRoomId]    = useState(null)
  const [messages,  setMessages]  = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState(null)
  const channelRef                = useRef(null)

  // ── Step 1: Find or create the room, join it, load initial messages ──────────
  useEffect(() => {
    if (!userId || !contextType || !contextId) return
    let cancelled = false

    async function init() {
      try {
        setIsLoading(true)
        setError(null)

        // Try to find an existing room for this context
        let id = null
        const { data: existing } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('context_type', contextType)
          .eq('context_id', contextId)
          .maybeSingle()

        if (existing) {
          id = existing.id
        } else {
          // Create a new room — handle the race where another user creates it simultaneously
          const { data: created, error: createErr } = await supabase
            .from('chat_rooms')
            .insert({ context_type: contextType, context_id: contextId, name: roomName, created_by: userId })
            .select('id')
            .single()

          if (createErr) {
            if (createErr.code === '23505') {
              // Another user created this room in the same moment — fetch it
              const { data: raced } = await supabase
                .from('chat_rooms')
                .select('id')
                .eq('context_type', contextType)
                .eq('context_id', contextId)
                .maybeSingle()
              id = raced?.id
            } else {
              throw createErr
            }
          } else {
            id = created?.id
          }
        }

        if (!id || cancelled) return

        // Join as participant (only our own row; RLS allows nothing else).
        // ON CONFLICT DO NOTHING if already joined.
        const { error: joinErr } = await supabase
          .from('chat_participants')
          .upsert(
            [{ room_id: id, user_id: userId, display_name: userDisplayName }],
            { onConflict: 'room_id,user_id', ignoreDuplicates: true }
          )
        if (joinErr) throw joinErr

        // Add the other party (e.g. the original poster) through the
        // join_chat_counterparty RPC. It checks that we are in the room, that
        // neither side blocked the other, and that the room is an ad, board
        // or carpool room. Direct rooms already hold both people (they are
        // made by start_direct_chat after a connection request is accepted).
        // Without it the poster never sees the chat.
        if (contextType !== 'direct' && otherParticipantId && otherParticipantId !== userId) {
          const { error: otherErr } = await supabase.rpc('join_chat_counterparty', {
            p_room_id: id,
            p_other_user_id: otherParticipantId,
          })
          if (otherErr) {
            const msg = String(otherErr.message || '').toLowerCase()
            if (msg.includes('blocked')) {
              throw new Error('You cannot message this person.')
            }
            throw otherErr
          }
        }

        // Load the most recent 100 messages (newest first), then reverse for
        // chronological display — fetching oldest-first with a limit would
        // strand the newest messages out of view in any busy room.
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('id, room_id, user_id, author_name, content, created_at')
          .eq('room_id', id)
          .order('created_at', { ascending: false })
          .limit(100)

        if (!cancelled) {
          setRoomId(id)
          setMessages((msgs || []).slice().reverse())
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Could not load the chat room.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [contextType, contextId, userId])

  // ── Step 2: Subscribe to Realtime once the roomId is known ──────────────────
  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`chat_room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages(prev => {
            // Deduplicate — our own sent message may already be in state via optimistic update
            if (prev.some(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      )
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [roomId])

  // ── sendMessage ──────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (content) => {
    if (!roomId || !userId || !content?.trim()) return
    assertTextClean(content)
    const { error: sendErr } = await supabase.from('chat_messages').insert({
      room_id:     roomId,
      user_id:     userId,
      author_name: userDisplayName,
      content:     content.trim(),
    })
    if (sendErr) throw sendErr
  }, [roomId, userId, userDisplayName])

  // ── markRead — call when the screen comes into focus ─────────────────────────
  const markRead = useCallback(async () => {
    if (!roomId || !userId) return
    await supabase
      .from('chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', userId)
  }, [roomId, userId])

  return { roomId, messages, isLoading, error, sendMessage, markRead }
}
