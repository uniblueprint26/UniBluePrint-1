import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal, Pressable, KeyboardAvoidingView, Platform, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ExternalLink, X } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../ui/AppHeader'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// Shared pieces for the Explore tool screens, so every tool looks like one
// family: the app header, a serif page title, rounded cards, plain fields.

export function openLink(url) {
  if (!url) return
  const href = /^(https?|mailto):/i.test(url) ? url : `https://${url}`
  Linking.openURL(href).catch(() => {})
}

// The page frame: header, scrollable body, big serif title.
export function ToolScreen({ navigation, title, subtitle, right, children, footer }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {title ? <PageTitle title={title} subtitle={subtitle} right={right} style={s.title} /> : <View style={{ height: 14 }} />}
        {children}
      </ScrollView>
      {footer || null}
    </View>
  )
}

export function Card({ children, style }) {
  const { colors } = useTheme()
  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {children}
    </View>
  )
}

export function Eyebrow({ children, style }) {
  const { colors } = useTheme()
  return <Text style={[s.eyebrow, { color: colors.textSecondary }, style]}>{children}</Text>
}

export function H2({ children, style }) {
  const { colors } = useTheme()
  return <Text style={[s.h2, { color: colors.textPrimary }, style]}>{children}</Text>
}

export function Body({ children, style, secondary }) {
  const { colors } = useTheme()
  return <Text style={[s.body, { color: secondary ? colors.textSecondary : colors.textPrimary }, style]}>{children}</Text>
}

// Primary (filled), secondary (outline) and quiet (text only) buttons.
export function Btn({ label, onPress, kind = 'primary', Icon, disabled, style, color, textColor }) {
  const { colors } = useTheme()
  const filled = kind === 'primary'
  const bg = color || colors.accentBg
  const fg = textColor || colors.accentFg
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={[
        s.btn,
        filled ? { backgroundColor: bg } : kind === 'secondary' ? { borderWidth: 1, borderColor: colors.border, backgroundColor: 'transparent' } : { backgroundColor: 'transparent' },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      <Text style={[s.btnText, { color: filled ? fg : colors.textPrimary }]}>{label}</Text>
      {Icon ? <Icon size={16} color={filled ? fg : colors.textPrimary} strokeWidth={2} /> : null}
    </TouchableOpacity>
  )
}

export function Chip({ label, active, onPress, style }) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={label}
      style={[
        s.chip,
        active ? { backgroundColor: colors.accentBg, borderColor: colors.accentBg } : { backgroundColor: 'transparent', borderColor: colors.border },
        style,
      ]}
    >
      <Text style={[s.chipText, { color: active ? colors.accentFg : colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  )
}

export function Field({ label, value, onChangeText, placeholder, keyboardType, hint, multiline, style, maxLength, autoCapitalize = 'sentences' }) {
  const { colors } = useTheme()
  return (
    <View style={[s.field, style]}>
      {!!label && <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        multiline={multiline}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        accessibilityLabel={label}
        style={[
          s.input,
          { color: colors.textPrimary, backgroundColor: colors.background, borderColor: colors.border },
          multiline && { height: 88, paddingTop: 12, textAlignVertical: 'top' },
        ]}
      />
      {!!hint && <Text style={[s.fieldHint, { color: colors.textSecondary }]}>{hint}</Text>}
    </View>
  )
}

// A link row that opens the browser: name, web address, external icon.
export function LinkRow({ Icon, title, sub, url, onPress, last }) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress || (() => openLink(url))}
      accessibilityRole="link"
      accessibilityLabel={`${title}${sub ? `, ${sub}` : ''}`}
      style={[s.linkRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
    >
      {Icon ? (
        <View style={[s.linkIcon, { backgroundColor: colors.tabFill }]}>
          <Icon size={18} color={colors.textPrimary} strokeWidth={1.7} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.linkTitle, { color: colors.textPrimary }]} numberOfLines={2}>{title}</Text>
        {!!sub && <Text style={[s.linkSub, { color: colors.textSecondary }]} numberOfLines={2}>{sub}</Text>}
      </View>
      <ExternalLink size={16} color={colors.textTertiary} strokeWidth={1.8} />
    </TouchableOpacity>
  )
}

// A centred bottom sheet for short forms.
export function FormSheet({ visible, onClose, title, children }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={[s.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
          <Pressable
            style={[s.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 20 }]}
            onPress={e => e.stopPropagation?.()}
          >
            <View style={[s.handle, { backgroundColor: colors.border }]} />
            <View style={s.sheetHead}>
              <Text style={[s.sheetTitle, { color: colors.textPrimary }]}>{title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
                <X size={20} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ maxHeight: 560 }}>
              {children}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export const bits = StyleSheet.create({
  section: { marginTop: 28 },
  row: { flexDirection: 'row', alignItems: 'center' },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
})

const s = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 16 },
  title: { paddingHorizontal: 2, paddingTop: 18, paddingBottom: 14 },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, letterSpacing: 1.1, textTransform: 'uppercase' },
  h2: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28 },
  body: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: 14, paddingHorizontal: 18 },
  btnText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  chip: { minHeight: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 13.5 },
  field: { marginTop: 14 },
  fieldLabel: { fontFamily: fonts.sansMedium, fontSize: 12.5, marginBottom: 6 },
  input: { fontFamily: fonts.sans, fontSize: 15, minHeight: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, outlineStyle: 'none' },
  fieldHint: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, marginTop: 6 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, minHeight: 64 },
  linkIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  linkTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15.5 },
  linkSub: { fontFamily: fonts.sans, fontSize: 13, marginTop: 2 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 14 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 24, flex: 1, paddingRight: 12 },
})
