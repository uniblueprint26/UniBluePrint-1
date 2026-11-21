import { Modal, View, Text, TouchableOpacity, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { X } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// A plain bottom sheet used by the campus toolkit screens.
export default function Sheet({ visible, onClose, title, subtitle, children }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={[s.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} accessibilityLabel="Close" />
        <View style={[s.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
          <View style={s.head}>
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: colors.textPrimary }]}>{title}</Text>
              {!!subtitle && <Text style={[s.sub, { color: colors.textSecondary }]}>{subtitle}</Text>}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityRole="button" accessibilityLabel="Close">
              <X size={22} color={colors.textSecondary} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export function FieldLabel({ children }) {
  const { colors } = useTheme()
  return <Text style={[s.label, { color: colors.textPrimary }]}>{children}</Text>
}

const s = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '88%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  title: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 32 },
  sub: { fontFamily: fonts.sans, fontSize: 14, marginTop: 2 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 14, marginTop: 16, marginBottom: 8 },
})
