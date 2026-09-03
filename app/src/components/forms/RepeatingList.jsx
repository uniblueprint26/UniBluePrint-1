import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Plus, Trash2 } from 'lucide-react-native'
import Card from '../ui/Card'
import { colors, fonts, radius, spacing } from '../../constants/theme'

// A list of repeatable entry cards — education history, work experience, etc.
// `renderEntry(entry, onChangeEntry)` renders one entry's fields; `emptyEntry` is
// the shape of a fresh blank one. Always keeps at least one entry visible (an empty
// list reads as broken, not "add your first one").

export default function RepeatingList({ entries, onChange, renderEntry, emptyEntry, addLabel }) {
  const list = entries && entries.length > 0 ? entries : [emptyEntry]

  function updateEntry(i, next) {
    const copy = [...list]
    copy[i] = next
    onChange(copy)
  }
  function removeEntry(i) {
    const copy = list.filter((_, idx) => idx !== i)
    onChange(copy.length > 0 ? copy : [emptyEntry])
  }
  function addEntry() {
    onChange([...list, emptyEntry])
  }

  return (
    <View style={{ gap: 12 }}>
      {list.map((entry, i) => (
        <Card key={i} style={s.entryCard}>
          {list.length > 1 && (
            <TouchableOpacity style={s.removeBtn} activeOpacity={0.7} onPress={() => removeEntry(i)}>
              <Trash2 size={15} color={colors.muted} />
            </TouchableOpacity>
          )}
          {renderEntry(entry, next => updateEntry(i, next))}
        </Card>
      ))}
      <TouchableOpacity style={s.addBtn} activeOpacity={0.8} onPress={addEntry}>
        <Plus size={16} color={colors.navy} />
        <Text style={s.addBtnText}>{addLabel}</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  entryCard: { padding: 16, gap: 12 },
  removeBtn: { position: 'absolute', top: 10, right: 10, padding: 4, zIndex: 1 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 48, borderRadius: radius.button, borderWidth: 1.5, borderColor: colors.navy,
    borderStyle: 'dashed',
  },
  addBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
})
