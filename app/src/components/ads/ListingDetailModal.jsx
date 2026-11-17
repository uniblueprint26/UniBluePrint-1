import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable, StyleSheet } from 'react-native'
import { X, MessageSquare, ExternalLink, Download, Flag, ChevronRight } from 'lucide-react-native'
import { fonts, shadows } from '../../constants/theme'
import { useAdTokens } from './adTheme'
import { UbpTag, PillarLabel, ReviewedMark } from './OriginTag'

// The detail and contact step for student listings: what it is, the facts we
// have, and how to get in touch (message the poster in-app, open a link, or
// open the file). Partner deals and paid ads still open the partner contact
// card or their own link, exactly as before.
export default function ListingDetailModal({ item, visible, isOwn, onClose, onMessage, onOpenLink, onOpenFile, onOpenBoard, onReport }) {
  const t = useAdTokens()
  const { colors } = t
  if (!item) return null
  const pillar = item.origin === 'campus' || item.origin === 'course'
  const v = t.visual(item.visual)
  const Tile = pillar ? t.pillar(item.origin).Icon : v.Icon
  const tileBg = pillar ? t.pillar(item.origin).tileBg : v.bg
  const tileFg = pillar ? t.pillar(item.origin).iconColor : v.fg

  const primary = { backgroundColor: t.accent }
  const primaryText = { color: t.accentInk }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[s.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[s.sheet, { backgroundColor: colors.surface }, t.isDark ? t.cardBorder : shadows.elevated]} onPress={e => e.stopPropagation?.()}>
          <View style={[s.grabber, { backgroundColor: colors.border }]} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 6 }}>
            <View style={s.head}>
              <View style={[s.tile, { backgroundColor: tileBg }]}><Tile size={26} color={tileFg} strokeWidth={1.8} /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={s.tags}>
                  {pillar
                    ? <PillarLabel origin={item.origin} extra={item.typeLabel} />
                    : <Text style={[s.type, { color: colors.textSecondary }]}>{item.typeLabel}</Text>}
                  {item.origin === 'ubp' && <UbpTag />}
                  {item.reviewed && <ReviewedMark />}
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={[s.close, { backgroundColor: colors.tabFill }]} accessibilityRole="button" accessibilityLabel="Close">
                <X size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[s.title, { color: colors.textPrimary }]}>{item.title}</Text>
            {item.price && (
              <Text style={[s.price, { color: colors.textPrimary }]}>
                {item.price.main}{item.price.sub ? <Text style={[s.priceSub, { color: colors.textSecondary }]}>{`  ${item.price.sub}`}</Text> : null}
              </Text>
            )}

            {!!item.description && <Text style={[s.desc, { color: colors.textPrimary }]}>{item.description}</Text>}

            {item.details.length > 0 && (
              <View style={[s.facts, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                {item.details.map((d, i) => (
                  <View key={d.label} style={[s.fact, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }]}>
                    <Text style={[s.factLabel, { color: colors.textSecondary }]}>{d.label}</Text>
                    <Text style={[s.factValue, { color: colors.textPrimary }]}>{d.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {!!item.contact && (
              <Text style={[s.contact, { color: colors.textSecondary }]}>
                Contact: <Text style={{ color: colors.textPrimary, fontFamily: fonts.sansMedium }}>{item.contact}</Text>
              </Text>
            )}
            {!!item.posterName && <Text style={[s.posted, { color: colors.textSecondary }]}>Posted by {item.posterName}</Text>}

            <View style={s.actions}>
              {!!item.fileUrl && (
                <TouchableOpacity style={[s.btn, primary]} activeOpacity={0.85} onPress={() => onOpenFile(item)}>
                  <Download size={16} color={t.accentInk} strokeWidth={2} />
                  <Text style={[s.btnText, primaryText]}>Open the file</Text>
                </TouchableOpacity>
              )}
              {!!item.link && (
                <TouchableOpacity style={[s.btn, primary]} activeOpacity={0.85} onPress={() => onOpenLink(item.link)}>
                  <ExternalLink size={16} color={t.accentInk} strokeWidth={2} />
                  <Text style={[s.btnText, primaryText]}>Open the link</Text>
                </TouchableOpacity>
              )}
              {!isOwn && item.source !== 'shared_notes' && item.source !== 'ads' && (
                <TouchableOpacity
                  style={[s.btn, item.link ? s.btnOutline : primary, item.link && { borderColor: colors.border }]}
                  activeOpacity={0.85}
                  onPress={() => onMessage(item)}
                >
                  <MessageSquare size={16} color={item.link ? colors.textPrimary : t.accentInk} strokeWidth={2} />
                  <Text style={[s.btnText, { color: item.link ? colors.textPrimary : t.accentInk }]}>Message</Text>
                </TouchableOpacity>
              )}
              {!!item.board && (
                <TouchableOpacity style={s.linkRow} activeOpacity={0.8} onPress={() => onOpenBoard(item)}>
                  <Text style={[s.linkText, { color: colors.textPrimary }]}>See all on {item.board.title}</Text>
                  <ChevronRight size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              {!isOwn && (
                <TouchableOpacity style={s.report} activeOpacity={0.8} onPress={() => onReport(item)} accessibilityRole="button" accessibilityLabel="Report listing">
                  <Flag size={13} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={[s.reportText, { color: colors.textSecondary }]}>Report</Text>
                </TouchableOpacity>
              )}
            </View>
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
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tile: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tags: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 2 },
  type: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  close: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 31, marginTop: 16 },
  price: { fontFamily: fonts.serif, fontSize: 22, marginTop: 8 },
  priceSub: { fontFamily: fonts.sans, fontSize: 13 },
  desc: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, marginTop: 14 },
  facts: { borderRadius: 14, borderWidth: 1, marginTop: 16, paddingHorizontal: 14 },
  fact: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 11 },
  factLabel: { fontFamily: fonts.sans, fontSize: 13.5 },
  factValue: { fontFamily: fonts.sansMedium, fontSize: 13.5, flexShrink: 1, textAlign: 'right' },
  contact: { fontFamily: fonts.sans, fontSize: 13.5, marginTop: 14 },
  posted: { fontFamily: fonts.sans, fontSize: 12.5, marginTop: 4 },
  actions: { marginTop: 20, gap: 10 },
  btn: { height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnOutline: { borderWidth: 1 },
  btnText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10 },
  linkText: { fontFamily: fonts.sansMedium, fontSize: 14 },
  report: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  reportText: { fontFamily: fonts.sans, fontSize: 13 },
})
