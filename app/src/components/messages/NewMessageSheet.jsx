import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronRight } from 'lucide-react-native'
import Avatar from '../directory/Avatar'
import { fonts, spacing, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { startDirectChat, fetchRoomContextId, fetchDirectMessageContacts } from '../../lib/directMessaging'

// "New message": start a direct chat with someone the user already shares a
// chat with (get_direct_message_contacts), minus anyone blocked either way.
export default function NewMessageSheet({ visible, onClose, onOpenChat }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [startingId, setStartingId] = useState(null)

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    setLoading(true)
    fetchDirectMessageContacts().then(({ contacts: rows }) => {
      if (!cancelled) { setContacts(rows); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [visible])

  async function pick(contact) {
    if (startingId) return
    setStartingId(contact.peer_user_id)
    try {
      const { roomId, blocked, error } = await startDirectChat(contact.peer_user_id, contact.peer_display_name)
      if (blocked) {
        Alert.alert("Can't start this conversation", "This conversation isn't available right now.")
        return
      }
      if (error || !roomId) throw error || new Error('No room id returned')
      const { contextId } = await fetchRoomContextId(roomId)
      if (!contextId) throw new Error('Could not resolve the new conversation.')
      onOpenChat({
        contextType: 'direct', contextId,
        roomName: contact.peer_display_name || 'Chat', subtitle: null,
        posterId: contact.peer_user_id, posterName: contact.peer_display_name,
      })
    } catch {
      Alert.alert('Something went wrong', 'Could not start the conversation. Please try again.')
    } finally {
      setStartingId(null)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[s.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 24 }]}>
        <View style={[s.handle, { backgroundColor: colors.border }]} />
        <Text style={[s.title, { color: colors.textPrimary }]}>New message</Text>
        <Text style={[s.sub, { color: colors.textSecondary }]}>Start a chat with someone you already share a chat with.</Text>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={s.center}><ActivityIndicator color={colors.textPrimary} /></View>
          ) : contacts.length > 0 ? (
            contacts.map(c => {
              const name = c.peer_display_name || 'Member'
              return (
                <TouchableOpacity
                  key={c.peer_user_id}
                  style={[s.row, { borderBottomColor: colors.divider }]}
                  activeOpacity={0.72}
                  disabled={!!startingId}
                  onPress={() => pick(c)}
                >
                  <Avatar person={{ id: c.peer_user_id, full_name: name }} size={44} />
                  <Text style={[s.name, { color: colors.textPrimary }]} numberOfLines={1}>{name}</Text>
                  {startingId === c.peer_user_id
                    ? <ActivityIndicator size="small" color={colors.textPrimary} />
                    : <ChevronRight size={16} color={colors.textTertiary} />}
                </TouchableOpacity>
              )
            })
          ) : (
            <View style={s.empty}>
              <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No one to message yet</Text>
              <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                You can start a chat here with anyone you share a board, carpool or course chat with. To meet new people, try Discover.
              </Text>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity style={[s.cancel, { backgroundColor: colors.tabFill }]} onPress={onClose} activeOpacity={0.8}>
          <Text style={[s.cancelText, { color: colors.textPrimary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  sheet: { flex: 1, paddingHorizontal: spacing.md, paddingTop: 16 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontFamily: fonts.serif, fontSize: 24, marginBottom: 6 },
  sub: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  center: { alignItems: 'center', paddingVertical: 48 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  name: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 15 },
  empty: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 12 },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 20, marginBottom: 10, textAlign: 'center' },
  emptySub: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  cancel: { marginTop: 12, alignItems: 'center', paddingVertical: 14, borderRadius: radius.button },
  cancelText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
})
