import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native'
import { X } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// Shared "Coming Soon" bottom sheet — opened both from a Lifestyle Blueprint
// coming-soon grid card and from tapping a greyed-out pin on the partner map.
// Deliberately reveals nothing beyond what's already visible on the
// card/pin (name, county, category) — it's the partner's specific deal
// (pricing, how-to-start) that's still pending, not their identity.
export default function ComingSoonSheet({ visible, onClose, title = 'Coming soon', message = 'Stay tuned. Coming soon.' }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation?.()}>
          <View style={styles.handle} />
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={16} color={colors.muted} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{message}</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Got it</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function __gs_styles(colors) {
  return StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.card + 4,
    borderTopRightRadius: radius.card + 4,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: 'center',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, marginBottom: 18,
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary, marginTop: 8 },
  body: {
    fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary,
    textAlign: 'center', marginTop: 10, lineHeight: 20, maxWidth: 280,
  },
  doneBtn: {
    marginTop: 22, backgroundColor: colors.accentBg, borderRadius: radius.button,
    paddingHorizontal: 28, paddingVertical: 12,
  },
  doneBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.accentFg },
  })
}
