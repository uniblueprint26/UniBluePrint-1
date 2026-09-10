/**
 * BoardPickerModal — the shared "which board?" step of Post to Board.
 *
 * Tapping "Post to Board" anywhere in Campus Connect opens this once;
 * choosing a board pushes BoardDetailScreen for that board with
 * `openPostForm: true`, which opens straight into that board's post form
 * (after the campus gate, and the carpool safety-terms gate if this is
 * Carpooling) rather than just landing on the browse view.
 */
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { X } from 'lucide-react-native'
import { CAMPUS_BOARDS } from '../../constants/campusBoards'
import { colors, fonts, spacing, radius } from '../../constants/theme'

export default function BoardPickerModal({ visible, onClose, onPick }) {
  const tiles = CAMPUS_BOARDS
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.headerRow}>
            <Text style={s.title}>Post to which board?</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Close">
              <X size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
            <View style={s.grid}>
              {tiles.map(board => (
                <TouchableOpacity
                  key={board.key}
                  style={[s.tile, { backgroundColor: board.color }]}
                  activeOpacity={0.8}
                  onPress={() => onPick(board)}
                  accessibilityRole="button"
                  accessibilityLabel={`Post to ${board.title}`}
                >
                  <Text style={s.tileIcon}>{board.icon}</Text>
                  <Text style={s.tileTitle}>{board.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: spacing.lg, paddingBottom: 34, maxHeight: '85%',
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontFamily: fonts.serif, fontSize: 20, color: colors.navy, flex: 1, marginRight: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '31%', borderRadius: radius.card, paddingVertical: 16, paddingHorizontal: 8,
    alignItems: 'center', gap: 8,
  },
  tileIcon: { fontSize: 24 },
  tileTitle: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: colors.navy, textAlign: 'center', lineHeight: 15 },
})
