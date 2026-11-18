import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable, StyleSheet } from 'react-native'
import { X, GraduationCap, ShoppingBag, Briefcase, Megaphone } from 'lucide-react-native'
import { fonts, shadows } from '../../constants/theme'
import BasketShape from './BasketShape'
import { useAdTokens } from './adTheme'

// The "Post a listing" entry. Each basket opens the existing post flow for
// that board (BoardDetail with openPostForm), so the same form, gate and paid
// skill checkout all apply as they do today. "Advertise with us" opens the
// existing paid Post an Ad flow, unchanged.
export const POST_OPTIONS = [
  { key: 'tutor', Icon: GraduationCap, visual: 'tutor', title: 'Tutoring',          blurb: 'Offer a skill, or ask for help.', route: { boardKey: 'skills', registry: 'marketplace' } },
  { key: 'sale',  Icon: ShoppingBag,   visual: 'sale',  title: 'Sell something',    blurb: 'Sell an item, or say what you want.', route: { boardKey: 'buysell', registry: 'marketplace' } },
  { key: 'job',   Icon: Briefcase,     visual: 'job',   title: 'Job',               blurb: 'Part-time work, internships and more.', route: { boardKey: 'opportunities' } },
  { key: 'ad',    Icon: Megaphone,     visual: 'ad',    title: 'Advertise with us', blurb: 'A paid ad. Your first each month is free.', paid: true },
]

export default function PostListingSheet({ visible, onClose, onPick, onCampusConnect }) {
  const t = useAdTokens()
  const { colors } = t
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[s.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: colors.surface }, t.isDark ? t.cardBorder : shadows.elevated]} onPress={e => e.stopPropagation?.()}>
          <View style={[s.grabber, { backgroundColor: colors.border }]} />
          <View style={s.head}>
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: colors.textPrimary }]}>Post a listing</Text>
              <Text style={[s.sub, { color: colors.textSecondary }]}>What would you like to post?</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[s.close, { backgroundColor: colors.tabFill }]} accessibilityRole="button" accessibilityLabel="Close">
              <X size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
            <View style={s.grid}>
              {POST_OPTIONS.map(o => (
                <View key={o.key} style={s.cell}>
                  <BasketShape
                    visual={o.visual}
                    Icon={o.Icon}
                    title={o.title}
                    line={o.blurb}
                    compact
                    onPress={() => onPick(o)}
                  />
                </View>
              ))}
            </View>

            {!!onCampusConnect && (
              <TouchableOpacity onPress={onCampusConnect} activeOpacity={0.7} style={s.quiet} accessibilityRole="link">
                <Text style={[s.quietText, { color: colors.textSecondary }]}>
                  {'Looking for rides or lost property? '}
                  <Text style={[s.quietLink, { color: colors.textPrimary }]}>{'Find them in Campus\u00A0Connect.'}</Text>
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, maxHeight: '90%' },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  title: { fontFamily: fonts.serif, fontSize: 26 },
  sub: { fontFamily: fonts.sans, fontSize: 14, marginTop: 2 },
  close: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  cell: { width: '47.5%', flexGrow: 1, flexDirection: 'column' },
  quiet: { marginTop: 22, paddingVertical: 6, alignItems: 'center' },
  quietText: { fontFamily: fonts.sans, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  quietLink: { fontFamily: fonts.sansMedium, textDecorationLine: 'underline' },
})
