import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native'
import { X } from 'lucide-react-native'
import Avatar from './Avatar'
import FollowButton from './FollowButton'
import ReportButton from '../safety/ReportButton'
import { courseLine, sharedInterests } from './helpers'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// The big card for one person (the Discover look). Tapping any name in
// Discover opens this, with a View full profile button.
export function PersonCardFace({ person, viewerInterests, style }) {
  const { colors, isDark } = useTheme()
  const name = person?.full_name || 'UniBlueprint member'
  const shared = sharedInterests(viewerInterests, person)
  const chips = (shared.length ? shared : (person?.interests || [])).slice(0, 5)
  const bio = person?.bio
  return (
    <View style={[s.face, { backgroundColor: colors.surface, borderColor: colors.border }, isDark ? null : s.shadow, style]}>
      <View style={s.photo}>
        <Avatar person={person} size={132} />
      </View>
      <Text style={[s.name, { color: colors.textPrimary }]} numberOfLines={2}>{name}</Text>
      {!!courseLine(person) && <Text style={[s.sub, { color: colors.textSecondary }]} numberOfLines={2}>{courseLine(person)}</Text>}
      {!!person?.institution && <Text style={[s.sub, { color: colors.textSecondary }]} numberOfLines={1}>{person.institution}</Text>}
      {!!bio && <Text style={[s.bio, { color: colors.textPrimary }]} numberOfLines={4}>{bio}</Text>}
      {chips.length > 0 && (
        <View style={s.chips}>
          {chips.map(t => (
            <View key={t} style={[s.chip, { backgroundColor: colors.tabFill }]}>
              <Text style={[s.chipText, { color: colors.textPrimary }]}>{t}</Text>
            </View>
          ))}
        </View>
      )}
      {shared.length > 0 && <Text style={[s.shared, { color: colors.textSecondary }]}>{shared.length} shared {shared.length === 1 ? 'interest' : 'interests'}</Text>}
    </View>
  )
}

export default function PersonCardModal({ person, viewerInterests, follows, onClose, onViewProfile }) {
  const { colors } = useTheme()
  if (!person) return null
  const name = person.full_name || 'this member'
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[s.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[s.wrap, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <PersonCardFace person={person} viewerInterests={viewerInterests} style={s.flat} />
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.primary, { backgroundColor: colors.accentBg }]}
              activeOpacity={0.85}
              onPress={() => onViewProfile(person)}
              accessibilityRole="button"
              accessibilityLabel={`View full profile of ${name}`}
            >
              <Text style={[s.primaryText, { color: colors.accentFg }]}>View full profile</Text>
            </TouchableOpacity>
            <View style={s.row2}>
              <FollowButton following={follows.isFollowing(person.id)} onPress={() => follows.toggleFollow(person.id)} name={person.full_name} />
              <View style={[s.report, { backgroundColor: colors.tabFill }]}>
                <ReportButton
                  target={{ contentType: 'profile', contentId: person.id, reportedUserId: person.id, userName: name, noun: 'profile' }}
                  label={`Report or block ${name}`}
                />
              </View>
            </View>
          </View>
          <TouchableOpacity style={[s.close, { backgroundColor: colors.tabFill }]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
            <X size={18} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 20 },
  wrap: { width: '100%', maxWidth: 420, alignSelf: 'center', borderRadius: 28, paddingBottom: 22, paddingHorizontal: 18 },
  flat: { borderWidth: 0, shadowOpacity: 0, elevation: 0, backgroundColor: 'transparent', paddingHorizontal: 6 },
  face: { borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, padding: 24, alignItems: 'center', minHeight: 360 },
  shadow: { shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 6 },
  photo: { marginTop: 4, marginBottom: 16 },
  name: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 32, textAlign: 'center' },
  sub: { fontFamily: fonts.sans, fontSize: 15, marginTop: 4, textAlign: 'center' },
  bio: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 999 },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 13 },
  shared: { fontFamily: fonts.sans, fontSize: 12.5, marginTop: 12 },
  actions: { marginTop: 8, gap: 12 },
  primary: { height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  row2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  report: { borderRadius: 18, padding: 2 },
  close: { position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
})
