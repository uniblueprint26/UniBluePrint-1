import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable, StyleSheet } from 'react-native'
import { X, ChevronRight, GraduationCap, ShoppingBag, Car, Search, Briefcase, FileText, Megaphone } from 'lucide-react-native'
import { fonts, shadows } from '../../constants/theme'
import { PILLARS } from '../../constants/pillars'
import { useAdTokens } from './adTheme'

// The "Post a listing" entry. Each row opens the existing post flow for that
// board (BoardDetail with openPostForm), so the same form, campus gate,
// carpool safety terms and paid-skill checkout all apply as they do today.
// The paid ad row opens the existing Post an Ad flow unchanged.
export const POST_OPTIONS = [
  { key: 'tutor',  Icon: GraduationCap, visual: 'tutor', title: 'Tutoring or a skill', blurb: 'Offer a skill, or ask for help.', route: { boardKey: 'skills', registry: 'marketplace' } },
  { key: 'sale',   Icon: ShoppingBag,   visual: 'sale',  title: 'Something to sell',   blurb: 'Sell an item, or say what you want.', route: { boardKey: 'buysell', registry: 'marketplace' } },
  { key: 'ride',   Icon: Car,           visual: 'ride',  title: 'A ride',              blurb: 'Offer seats on a route.', route: { boardKey: 'carpool' }, pillar: 'campus' },
  { key: 'lost',   Icon: Search,        visual: 'lost',  title: 'Lost or found',       blurb: 'Lost something, or found it.', route: { boardKey: 'lost-found' }, pillar: 'campus' },
  { key: 'job',    Icon: Briefcase,     visual: 'job',   title: 'A job or opportunity', blurb: 'Part-time work, internships and more.', route: { boardKey: 'opportunities' }, pillar: 'campus' },
  { key: 'notes',  Icon: FileText,      visual: 'notes', title: 'Notes',               blurb: 'Share notes with other students.', route: { boardKey: 'notes', registry: 'course' }, pillar: 'course' },
  { key: 'ad',     Icon: Megaphone,     visual: 'ad',    title: 'Advertise with us',   blurb: 'A paid ad. Your first each month is free.', paid: true },
]

export default function PostListingSheet({ visible, onClose, onPick }) {
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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {POST_OPTIONS.map(o => {
              const v = t.visual(o.visual)
              const p = o.pillar ? PILLARS[o.pillar] : null
              return (
                <TouchableOpacity
                  key={o.key}
                  activeOpacity={0.8}
                  onPress={() => onPick(o)}
                  style={[s.row, { borderBottomColor: colors.divider }]}
                  accessibilityRole="button"
                  accessibilityLabel={o.title}
                >
                  <View style={[s.tile, { backgroundColor: v.bg }]}>
                    <o.Icon size={22} color={v.fg} strokeWidth={1.8} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[s.rowTitle, { color: colors.textPrimary }]}>{o.title}</Text>
                    <Text style={[s.rowBlurb, { color: colors.textSecondary }]}>
                      {o.blurb}{p ? ` Posts to ${p.label}.` : ''}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, maxHeight: '88%' },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 6 },
  title: { fontFamily: fonts.serif, fontSize: 26 },
  sub: { fontFamily: fonts.sans, fontSize: 14, marginTop: 2 },
  close: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  tile: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  rowBlurb: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginTop: 2 },
})
