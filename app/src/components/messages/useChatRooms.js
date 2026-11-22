import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { fetchChatRoomPeerNames } from '../../lib/directMessaging'

// The signed-in user's chat rooms (group rooms and direct chats), newest
// first, with last message and unread count. Reloads whenever the screen
// comes into focus.
export function useChatRooms() {
  const { user } = useAuth()
  const userId = user?.id
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setFailed(false)
    try {
      const { data: participantRows, error: partErr } = await supabase
        .from('chat_participants')
        .select('room_id, last_read_at, chat_rooms(id, name, context_type, context_id, created_at)')
        .eq('user_id', userId)

      if (partErr) { setFailed(true); setRooms([]); return }
      if (!participantRows?.length) { setRooms([]); return }

      const roomIds = participantRows.map(p => p.room_id)

      const { data: recentMsgs } = await supabase
        .from('chat_messages')
        .select('id, room_id, content, author_name, created_at, user_id')
        .in('room_id', roomIds)
        .order('created_at', { ascending: false })
        .limit(Math.max(60, roomIds.length * 5))

      const lastMsgMap = {}
      for (const msg of recentMsgs || []) {
        if (!lastMsgMap[msg.room_id]) lastMsgMap[msg.room_id] = msg
        if (Object.keys(lastMsgMap).length === roomIds.length) break
      }

      const unreadCounts = {}
      for (const p of participantRows) {
        const lastRead = new Date(p.last_read_at || 0)
        unreadCounts[p.room_id] = (recentMsgs || []).filter(
          m => m.room_id === p.room_id && new Date(m.created_at) > lastRead && m.user_id !== userId
        ).length
      }

      // A direct room's own chat_rooms.name is only right for whoever created
      // it, so each side resolves its peer's name through a security-definer
      // RPC (see lib/directMessaging.js).
      const directRoomIds = participantRows
        .filter(p => p.chat_rooms?.context_type === 'direct')
        .map(p => p.room_id)
      const { peersByRoom } = await fetchChatRoomPeerNames(directRoomIds)

      const list = participantRows
        .map(p => {
          const room = p.chat_rooms
          if (!room) return null
          const lastMsg = lastMsgMap[p.room_id]
          const peer = room.context_type === 'direct' ? peersByRoom[p.room_id] : null
          return {
            id:            p.room_id,
            name:          peer?.peer_display_name || room.name || 'Chat Room',
            contextType:   room.context_type,
            contextId:     room.context_id,
            otherUserId:   peer?.peer_user_id || null,
            lastMessage:   lastMsg?.content ?? null,
            lastAuthor:    lastMsg?.author_name ?? null,
            lastMessageAt: lastMsg?.created_at ?? room.created_at,
            unreadCount:   unreadCounts[p.room_id] || 0,
          }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))

      setRooms(list)
    } catch {
      setFailed(true)
      setRooms([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useFocusEffect(useCallback(() => { load() }, [load]))

  return { rooms, loading, failed, reload: load }
}
