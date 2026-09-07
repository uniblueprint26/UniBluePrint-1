import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { X } from 'lucide-react-native'
import { colors, fonts, radius } from '../../constants/theme'

// Add-a-shortcut picker — shown from the Quick Access "+" slot while editing.
// Lists every destination not already on the board; tapping one adds it and
// closes. `slotsLeft` is purely informational copy (the "+" slot itself
// already stops appearing once 4 are selected).
//
// This picker deliberately offers everything, including sections that are
// also always reachable from the sidebar/drawer menu — Quick Access is a
// personal "pin your favourites" board, not a second copy of the full site
// map, so overlap with the menu is expected, not a bug. The copy below
// exists to make that framing explicit rather than let the two features
// read as duplicates.
export default function DestinationPickerModal({ visible, options, slotsLeft, onPick, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Add a Shortcut</Text>
              <Text style={s.sub}>
                {slotsLeft > 0
                  ? `Pin anything to your board — ${slotsLeft} slot${slotsLeft !== 1 ? 's' : ''} left`
                  : 'Pin anything to your board'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {options.map(item => (
              <TouchableOpacity
                key={item.key}
                style={s.row}
                onPress={() => onPick(item.key)}
                activeOpacity={0.75}
              >
                <View style={[s.rowIcon, { backgroundColor: item.bg }]}>
                  <item.Icon size={16} color={colors.navy} strokeWidth={1.8} />
                </View>
                <Text style={s.rowLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
            {options.length === 0 && (
              <Text style={s.emptyText}>Every destination is already on your board.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  sheet: { backgroundColor: colors.white, borderRadius: radius.card, padding: 20, width: '100%', maxWidth: 380 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 12 },
  title: { fontFamily: fonts.serif, fontSize: 18, color: colors.navy },
  sub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 3 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)',
  },
  rowIcon: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowLabel: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', paddingVertical: 20 },
})
