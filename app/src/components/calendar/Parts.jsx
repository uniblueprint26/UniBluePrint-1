import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { X, ChevronRight } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { KIND_META, typeMeta, calendarName, itemColor, withAlpha, fmtTime, sourceLine } from '../../lib/calendar/model'

// Small shared pieces for the Calendar screens.

export function Segmented({ value, options, onChange }) {
  const { colors } = useTheme()
  return (
    <View style={[s.seg, { backgroundColor: colors.tabFill }]} accessibilityRole="tablist">
      {options.map(o => {
        const on = o.key === value
        return (
          <TouchableOpacity
            key={o.key}
            style={[s.segItem, on && { backgroundColor: colors.surface }]}
            onPress={() => onChange(o.key)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
          >
            <Text style={[s.segText, { color: on ? colors.textPrimary : colors.textSecondary, fontFamily: on ? fonts.sansSemiBold : fonts.sansMedium }]}>{o.label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export function Chip({ label, Icon, dot, on, onPress, style, soft }) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      style={[s.chip, soft
        ? { borderColor: colors.border, backgroundColor: on ? colors.tabFill : 'transparent', opacity: on ? 1 : 0.5 }
        : { borderColor: on ? colors.accentBg : colors.border, backgroundColor: on ? colors.accentBg : 'transparent' }, style]}
    >
      {!!dot && <View style={[s.chipDot, { backgroundColor: dot }]} />}
      {!!Icon && <Icon size={14} color={on && !soft ? colors.accentFg : colors.textPrimary} strokeWidth={1.9} />}
      <Text style={[s.chipText, { color: on && !soft ? colors.accentFg : colors.textPrimary }]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  )
}

// Bottom sheet used for Add event, Import and item details.
export function Sheet({ visible, onClose, title, children, footer, bodyRef }) {
  const { colors } = useTheme()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={[s.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
          <Pressable style={[s.sheet, { backgroundColor: colors.surface }]} onPress={e => e.stopPropagation?.()}>
            <View style={[s.handle, { backgroundColor: colors.border }]} />
            <View style={s.sheetHead}>
              <Text style={[s.sheetTitle, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: colors.tabFill }]} accessibilityRole="button" accessibilityLabel="Close">
                <X size={18} color={colors.textPrimary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView ref={bodyRef} style={s.sheetBody} contentContainerStyle={{ paddingBottom: 8 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
            {!!footer && <View style={s.sheetFoot}>{footer}</View>}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export function PrimaryButton({ label, onPress, disabled, Icon, style }) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      style={[s.primary, { backgroundColor: colors.accentBg, opacity: disabled ? 0.5 : 1 }, style]}
    >
      {!!Icon && <Icon size={16} color={colors.accentFg} strokeWidth={2.2} />}
      <Text style={[s.primaryText, { color: colors.accentFg }]}>{label}</Text>
    </TouchableOpacity>
  )
}

export function SecondaryButton({ label, onPress, disabled, style }) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      style={[s.secondary, { backgroundColor: colors.tabFill, opacity: disabled ? 0.5 : 1 }, style]}
    >
      <Text style={[s.primaryText, { color: colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  )
}

// One event as a row: time, colour bar, title, "Label · From", type icon.
export function EventRow({ ev, customCalendars, onPress, showDate, dateText }) {
  const { colors, isDark } = useTheme()
  const color = itemColor(ev, customCalendars, isDark)
  const meta = ev.kind === 'member' || ev.kind === 'ics' ? typeMeta(ev.type) : null
  const KindIcon = meta ? meta.Icon : (KIND_META[ev.kind]?.Icon || KIND_META.other.Icon)
  const sub = ev.kind === 'member'
    ? `${calendarName(ev.calendar, customCalendars)} · ${meta.label}`
    : ev.kind === 'ics'
      ? `${calendarName(ev.calendar, customCalendars)} · ${meta.label}`
      : sourceLine(ev)
  const time = ev.allDay ? 'All day' : fmtTime(ev.start)
  return (
    <TouchableOpacity
      style={s.row}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${ev.title}, ${showDate ? `${dateText}, ` : ''}${time}. ${sub}`}
    >
      <View style={s.rowTime}>
        <Text style={[s.rowTimeMain, { color: colors.textPrimary }]} numberOfLines={1}>{showDate ? dateText : time}</Text>
        {showDate ? <Text style={[s.rowTimeSub, { color: colors.textSecondary }]} numberOfLines={1}>{time}</Text> : null}
      </View>
      <View style={[s.rowBar, { backgroundColor: color }]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.rowTitle, { color: colors.textPrimary }]} numberOfLines={2}>{ev.title}</Text>
        <Text style={[s.rowSub, { color: colors.textSecondary }]} numberOfLines={1}>{sub}</Text>
      </View>
      <View style={[s.rowIcon, { backgroundColor: colors.tabFill }]}>
        {KindIcon ? <KindIcon size={16} color={colors.textPrimary} strokeWidth={1.8} /> : <ChevronRight size={16} color={colors.textPrimary} />}
      </View>
    </TouchableOpacity>
  )
}

export { withAlpha }

const s = StyleSheet.create({
  seg: { flexDirection: 'row', borderRadius: 14, padding: 4 },
  segItem: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  segText: { fontSize: 14.5 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
  chipDot: { width: 10, height: 10, borderRadius: 5 },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 14 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, maxHeight: '92%' },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 12 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 26, flex: 1, paddingRight: 12 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sheetBody: { flexGrow: 0 },
  sheetFoot: { paddingTop: 12, paddingBottom: 28 },
  primary: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 18 },
  secondary: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryText: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowTime: { width: 52 },
  rowTimeMain: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  rowTimeSub: { fontFamily: fonts.sans, fontSize: 12, marginTop: 1 },
  rowBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, minHeight: 34 },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15.5, lineHeight: 20 },
  rowSub: { fontFamily: fonts.sansMedium, fontSize: 12.5, marginTop: 2 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
})
