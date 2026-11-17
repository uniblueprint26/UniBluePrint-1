import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// Pending message requests for the signed-in user, from connection_requests
// (id, requester_id, recipient_id, status 'pending' | 'accepted' | 'declined',
// created_at, responded_at). The recipient may update their own rows, so
// Accept and Decline both set the status; a non-pending row drops off the list.
export function useMessageRequests() {
  const { user } = useAuth()
  const userId = user?.id
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    try {
      const { data, error } = await supabase
        .from('connection_requests')
        .select('id, requester_id, created_at')
        .eq('recipient_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (error) throw error
      setRequests(data || [])
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useFocusEffect(useCallback(() => { load() }, [load]))

  // Returns true when the status change was saved.
  const respond = useCallback(async (requestId, status) => {
    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status, responded_at: new Date().toISOString() })
        .eq('id', requestId)
        .eq('recipient_id', userId)
      if (error) throw error
      setRequests(prev => prev.filter(r => r.id !== requestId))
      return true
    } catch {
      return false
    }
  }, [userId])

  return { requests, loading, respond, reload: load }
}
