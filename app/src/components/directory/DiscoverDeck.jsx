import { useMemo, useRef, useState } from 'react'
import { View, Text, Animated, PanResponder, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { X, UserPlus } from 'lucide-react-native'
import { PersonCardFace } from './PersonCardModal'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// The Tinder feel for Discover. One person at a time: swipe right to follow,
// swipe left to skip, or use the two buttons. Tap the card to open it large
// with View full profile. Skipping only hides someone for this visit.
export default function DiscoverDeck({ people, viewerInterests, follows, onOpenCard }) {
  const { colors } = useTheme()
  const { width } = useWindowDimensions()
  const [skipped, setSkipped] = useState(() => new Set())
  const queue = useMemo(
    () => people.filter(p => !skipped.has(p.id) && !follows.isFollowing(p.id)),
    [people, skipped, follows],
  )
  const top = queue[0]
  const next = queue[1]
  const pos = useRef(new Animated.ValueXY()).current
  const topRef = useRef(top)
  topRef.current = top

  function fling(dir) {
    const p = topRef.current
    if (!p) return
    Animated.timing(pos, { toValue: { x: dir * width * 1.2, y: 0 }, duration: 200, useNativeDriver: false }).start(() => {
      pos.setValue({ x: 0, y: 0 })
      if (dir > 0) follows.toggleFollow(p.id)
      else setSkipped(prev => new Set(prev).add(p.id))
    })
  }
  const flingRef = useRef(fling)
  flingRef.current = fling

  const responder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: Animated.event([null, { dx: pos.x }], { useNativeDriver: false }),
    onPanResponderRelease: (_, g) => {
      if (g.dx > 110) flingRef.current(1)
      else if (g.dx < -110) flingRef.current(-1)
      else Animated.spring(pos, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start()
    },
  })).current

  const rotate = pos.x.interpolate({ inputRange: [-width, 0, width], outputRange: ['-8deg', '0deg', '8deg'] })

  if (!top) {
    return (
      <View style={[s.done, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={[s.doneTitle, { color: colors.textPrimary }]}>You have seen everyone for now</Text>
        <Text style={[s.doneBody, { color: colors.textSecondary }]}>Check back soon. More people join every week.</Text>
        {skipped.size > 0 && (
          <TouchableOpacity onPress={() => setSkipped(new Set())} accessibilityRole="button" style={[s.again, { backgroundColor: colors.tabFill }]}>
            <Text style={[s.againText, { color: colors.textPrimary }]}>Show skipped people again</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <View>
      <View style={s.stack}>
        {!!next && <PersonCardFace person={next} viewerInterests={viewerInterests} style={s.behind} />}
        <Animated.View {...responder.panHandlers} style={{ transform: [{ translateX: pos.x }, { rotate }] }}>
          <TouchableOpacity activeOpacity={0.95} onPress={() => onOpenCard(top)} accessibilityRole="button" accessibilityLabel={`Open ${top.full_name || 'member'}`}>
            <PersonCardFace person={top} viewerInterests={viewerInterests} />
          </TouchableOpacity>
        </Animated.View>
      </View>
      <View style={s.buttons}>
        <TouchableOpacity
          style={[s.round, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => fling(-1)}
          accessibilityRole="button"
          accessibilityLabel="Skip"
        >
          <X size={26} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.round, { backgroundColor: colors.accentBg, borderColor: colors.accentBg }]}
          onPress={() => fling(1)}
          accessibilityRole="button"
          accessibilityLabel={`Follow ${top.full_name || 'member'}`}
        >
          <UserPlus size={26} color={colors.accentFg} strokeWidth={2} />
        </TouchableOpacity>
      </View>
      <Text style={[s.hint, { color: colors.textSecondary }]}>Swipe right to follow, left to skip</Text>
    </View>
  )
}

const s = StyleSheet.create({
  stack: { marginTop: 4 },
  behind: { position: 'absolute', top: 10, left: 12, right: 12, opacity: 0.55, transform: [{ scale: 0.97 }] },
  buttons: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 20 },
  round: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { fontFamily: fonts.sans, fontSize: 13, textAlign: 'center', marginTop: 14 },
  done: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 28, alignItems: 'center', gap: 6 },
  doneTitle: { fontFamily: fonts.serif, fontSize: 22, textAlign: 'center' },
  doneBody: { fontFamily: fonts.sans, fontSize: 14.5, textAlign: 'center', lineHeight: 21 },
  again: { marginTop: 14, paddingHorizontal: 16, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  againText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
})
