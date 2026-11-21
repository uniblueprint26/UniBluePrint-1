import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// The pictures chosen for a Post, before it is sent. A row of thumbnails, each
// with a remove button and left and right arrows to change the order. The first
// is the cover and says so. A dashed tile adds more until the limit.
//
// photos: [{ key, uri }] in the member's order.

const THUMB_W = 100
const THUMB_H = 128

export default function ImageStrip({ photos, max = 6, onAdd, onRemove, onMove }) {
  const { colors } = useTheme()
  const s = styles(colors)
  return (
    <View style={s.wrap}>
      <View style={s.headRow}>
        <Text style={s.count}>{photos.length} of {max} pictures</Text>
        <Text style={s.hint}>The first one is the cover</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {photos.map((p, i) => (
          <View key={p.key} style={s.thumb}>
            <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            {i === 0 && (
              <View style={s.cover}><Text style={s.coverText}>Cover</Text></View>
            )}
            <TouchableOpacity
              style={s.remove}
              onPress={() => onRemove(p.key)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove picture ${i + 1}`}
            >
              <X size={13} color="#fff" strokeWidth={2.4} />
            </TouchableOpacity>
            <View style={s.moveRow}>
              <TouchableOpacity
                style={[s.moveBtn, i === 0 && s.moveOff]}
                onPress={() => onMove(p.key, -1)}
                disabled={i === 0}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`Move picture ${i + 1} earlier`}
              >
                <ChevronLeft size={15} color="#fff" strokeWidth={2.4} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.moveBtn, i === photos.length - 1 && s.moveOff]}
                onPress={() => onMove(p.key, 1)}
                disabled={i === photos.length - 1}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={`Move picture ${i + 1} later`}
              >
                <ChevronRight size={15} color="#fff" strokeWidth={2.4} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {photos.length < max && (
          <TouchableOpacity style={s.add} onPress={onAdd} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Add more pictures">
            <Plus size={22} color={colors.textSecondary} strokeWidth={1.8} />
            <Text style={s.addText}>Add</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  )
}

function styles(colors) {
  return StyleSheet.create({
    wrap: { marginBottom: 22 },
    headRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
    count: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
    hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary },
    row: { gap: 10, paddingRight: 4 },
    thumb: {
      width: THUMB_W, height: THUMB_H, borderRadius: radius.card, overflow: 'hidden',
      backgroundColor: colors.border,
    },
    cover: {
      position: 'absolute', top: 8, left: 8, borderRadius: 8,
      backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 3,
    },
    coverText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: '#fff' },
    remove: {
      position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12,
      backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
    },
    moveRow: {
      position: 'absolute', bottom: 8, left: 8, right: 8,
      flexDirection: 'row', justifyContent: 'space-between',
    },
    moveBtn: {
      width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center', justifyContent: 'center',
    },
    moveOff: { opacity: 0.25 },
    add: {
      width: THUMB_W, height: THUMB_H, borderRadius: radius.card,
      borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center', gap: 6,
    },
    addText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textSecondary },
  })
}
