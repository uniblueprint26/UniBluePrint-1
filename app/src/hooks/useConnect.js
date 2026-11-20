/**
 * useConnect: the one "Connect" action for a member card (Home suggestions and
 * anywhere else a Connect button appears).
 *
 * Nobody can message a member until the member accepts, so Connect sends a
 * connection request (public.connection_requests). The only exception is a pair
 * that is already connected, which opens their chat.
 *
 *   const { connect, connectingId } = useConnect(navigation)
 *   <Button onPress={() => connect(profile)} />
 */

import { useState, useCallback, useRef } from 'react'
import { Alert } from 'react-native'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { startDirectChat, fetchRoomContextId } from '../lib/directMessaging'

export function useConnect(navigation) {
  const { user } = useAuth()
  const [connectingId, setConnectingId] = useState(null)
  const busyRef = useRef(false)

  const openChat = useCallback(async (profile) => {
    const { roomId, blocked, error } = await startDirectChat(profile.id, profile.full_name)
    if (blocked) {
      Alert.alert("Can't start this conversation", "This conversation isn't available right now.")
      return
    }
    if (error || !roomId) throw error || new Error('No room id returned')
    const { contextId } = await fetchRoomContextId(roomId)
    if (!contextId) throw new Error('Could not resolve the new conversation.')
    navigation?.getParent?.()?.navigate('Messages', {
      screen: 'ChatRoom',
      params: {
        contextType: 'direct',
        contextId,
        roomName:   profile.full_name || 'Chat',
        subtitle:   null,
        posterId:   profile.id,
        posterName: profile.full_name,
      },
    })
  }, [navigation])

  const connect = useCallback(async (profile) => {
    if (busyRef.current || !profile?.id || !user?.id || profile.id === user.id) return
    busyRef.current = true
    setConnectingId(profile.id)
    const name = profile.full_name || 'this member'
    try {
      const { data: existing, error: lookupErr } = await supabase
        .from('connection_requests')
        .select('id, status, requester_id')
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${profile.id}),and(requester_id.eq.${profile.id},recipient_id.eq.${user.id})`)
        .limit(1)
      if (lookupErr) throw lookupErr
      const row = existing?.[0]

      if (row?.status === 'accepted') {
        await openChat(profile)
        return
      }
      if (row?.status === 'pending') {
        Alert.alert(
          row.requester_id === user.id ? 'Request sent' : 'They asked first',
          row.requester_id === user.id
            ? `Your request to ${name} is waiting for them to accept.`
            : `${name} already sent you a request. You can accept it in Messages, under Requests.`
        )
        return
      }
      if (row?.status === 'declined') {
        Alert.alert('Not available', `You cannot send ${name} a request right now.`)
        return
      }

      const { error } = await supabase
        .from('connection_requests')
        .insert({ requester_id: user.id, recipient_id: profile.id, status: 'pending' })
      if (error) throw error
      Alert.alert('Request sent', `${name} can accept it in Messages. You can chat once they do.`)
    } catch {
      Alert.alert('Something went wrong', 'Could not send the request. Please try again.')
    } finally {
      busyRef.current = false
      setConnectingId(null)
    }
  }, [user?.id, openChat])

  return { connect, connectingId }
}
