import { View, Text, TouchableOpacity, Modal, Pressable, Switch, StyleSheet } from 'react-native'
import { ArrowUp, ArrowDown } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { HOME_SECTIONS, DEFAULT_HOME_LAYOUT } from './homeLayout'

// "Edit Home": turn Home sections on or off and move them up or down.
export default function EditHomeSheet({ visible, layout, onChange, onClose }) {
  const { colors } = useTheme()
  const s = getStyles(colors)
  const meta = Object.fromEntries(HOME_SECTIONS.map(x => [x.key, x]))

  function toggle(key) {
    onChange(layout.map(l => l.key === key ? { ...l, on: !l.on } : l))
  }
  function move(index, dir) {
    const j = index + dir
    if (j < 0 || j >= layout.length) return
    const next = layout.slice()
    ;[next[index], next[j]] = [next[j], next[index]]
    onChange(next)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={e => e.stopPropagation?.()}>
          <View style={s.grabber} />
          <Text style={s.title}>Edit Home</Text>
          <Text style={s.hint}>Choose what shows on Home and the order it comes in. Your header and stories stay put.</Text>

          <View style={s.list}>
            {layout.map((l, i) => {
              const m = meta[l.key]
              return (
                <View key={l.key} style={[s.row, i > 0 && s.rowBorder]}>
                  <View style={s.arrows}>
                    <TouchableOpacity
                      onPress={() => move(i, -1)} disabled={i === 0} hitSlop={6}
                      style={[s.arrowBtn, i === 0 && s.arrowOff]}
                      accessibilityRole="button" accessibilityLabel={`Move ${m.label} up`}
                    >
                      <ArrowUp size={16} color={colors.textPrimary} strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => move(i, 1)} disabled={i === layout.length - 1} hitSlop={6}
                      style={[s.arrowBtn, i === layout.length - 1 && s.arrowOff]}
                      accessibilityRole="button" accessibilityLabel={`Move ${m.label} down`}
                    >
                      <ArrowDown size={16} color={colors.textPrimary} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                  <View style={s.rowText}>
                    <Text style={[s.rowTitle, !l.on && { color: colors.textSecondary }]}>{m.label}</Text>
                    <Text style={s.rowHint} numberOfLines={2}>{m.hint}</Text>
                  </View>
                  <Switch
                    value={l.on}
                    onValueChange={() => toggle(l.key)}
                    trackColor={{ false: colors.border, true: "#3F9B6B" }}
                    activeThumbColor="#FFFFFF"
                    thumbColor="#FFFFFF"
                    accessibilityLabel={`Show ${m.label}`}
                  />
                </View>
              )
            })}
          </View>

          <View style={s.footer}>
            <TouchableOpacity onPress={() => onChange(DEFAULT_HOME_LAYOUT)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Reset Home to the default layout">
              <Text style={s.reset}>Reset to default</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.done} activeOpacity={0.85} onPress={onClose} accessibilityRole="button" accessibilityLabel="Done">
              <Text style={s.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function getStyles(colors) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22,
      paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30,
    },
    grabber: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 16 },
    title: { fontFamily: fonts.serif, fontSize: 24, color: colors.textPrimary },
    hint: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary, marginTop: 6, marginBottom: 14 },
    list: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12 },
    rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    arrows: { flexDirection: 'row', gap: 4 },
    arrowBtn: {
      width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    arrowOff: { opacity: 0.3 },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
    rowHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
    reset: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.textSecondary },
    done: { backgroundColor: colors.accentBg, borderRadius: 14, height: 46, paddingHorizontal: 34, alignItems: 'center', justifyContent: 'center' },
    doneText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.accentFg },
  })
}
