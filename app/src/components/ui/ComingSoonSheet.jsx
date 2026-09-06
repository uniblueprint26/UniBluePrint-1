import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native'
import { X } from 'lucide-react-native'
import { colors, fonts, radius } from '../../constants/theme'

// Shared "Coming Soon" bottom sheet — opened both from a Lifestyle Blueprint
// coming-soon grid card and from tapping a greyed-out pin on the partner map.
// Deliberately reveals nothing about the partner beyond what's already
// visible on the card/pin (no name, no category-specific detail) — the
// partner's real identity stays anonymous until launch.
export default function ComingSoonSheet({ visible, onClose }) {
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
          <Text style={styles.title}>Coming Soon</Text>
          <Text style={styles.body}>This partner is launching soon. Stay tuned.</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Got it</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.card + 4,
    borderTopRightRadius: radius.card + 4,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    alignItems: 'center',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(30,58,95,0.15)', marginBottom: 18,
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: fonts.serif, fontSize: 20, color: colors.navy, marginTop: 8 },
  body: {
    fontFamily: fonts.sans, fontSize: 14, color: '#6B7280',
    textAlign: 'center', marginTop: 10, lineHeight: 20, maxWidth: 280,
  },
  doneBtn: {
    marginTop: 22, backgroundColor: colors.navy, borderRadius: radius.button,
    paddingHorizontal: 28, paddingVertical: 12,
  },
  doneBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },
})
