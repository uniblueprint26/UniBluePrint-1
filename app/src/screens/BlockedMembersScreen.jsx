import { useEffect, useState, useCallback } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { UserX } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import SlowLoad from '../components/ui/SlowLoad'
import Avatar from '../components/directory/Avatar'
import { fonts, radius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { unblockUser } from '../lib/reporting'

// People you have blocked, with a way to undo it. Blocking happens from the
// Report and Block sheet on any member's content.
export default function BlockedMembersScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return }
    setLoading(true); setFailed(false)
    try {
      const { data, error } = await supabase.from('blocked_users').select('blocked_id, created_at').eq('blocker_id', user.id).order('created_at', { ascending: false })
      if (error) throw error
      const ids = (data || []).map(r => r.blocked_id)
      let people = {}
      if (ids.length) {
        const res = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', ids)
        for (const p of res.data || []) people[p.id] = p
      }
      setRows(ids.map(id => ({ id, ...(people[id] || {}) })))
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { load() }, [load])

  async function undo(row) {
    const res = await unblockUser(user.id, row.id)
    if (res.ok) setRows(prev => prev.filter(r => r.id !== row.id))
    else Alert.alert('Could not unblock', 'Please try again.')
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <PageTitle title="Blocked members" subtitle="They cannot message you and you will not see their posts." />
        {failed ? (
          <ErrorState onRetry={load} />
        ) : !loading && rows.length === 0 ? (
          <EmptyState icon={UserX} title="No one blocked" subtitle="If you block someone from a post or a chat, they show up here. You can unblock them any time." />
        ) : (
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {rows.map((r, i) => (
              <View key={r.id} style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }]}>
                <Avatar person={r} size={44} />
                <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{r.full_name || 'Member'}</Text>
                <TouchableOpacity
                  style={[styles.btn, { borderColor: colors.border }]}
                  activeOpacity={0.8}
                  onPress={() => undo(r)}
                  accessibilityRole="button"
                  accessibilityLabel={`Unblock ${r.full_name || 'member'}`}
                >
                  <Text style={[styles.btnText, { color: colors.textPrimary }]}>Unblock</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <SlowLoad loading={loading} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  group: { marginHorizontal: 16, marginTop: 18, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  name: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 16 },
  btn: { paddingHorizontal: 14, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
})
