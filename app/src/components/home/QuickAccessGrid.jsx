import { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Plus, X } from 'lucide-react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withRepeat, withSequence, withDelay,
  runOnJS,
} from 'react-native-reanimated'
import { colors, fonts, radius, shadows } from '../../constants/theme'

// ─── Layout constants ───────────────────────────────────────────────────────
const COLUMNS     = 2
const GAP         = 10
const CARD_HEIGHT = 112

function slotPosition(index, cardWidth) {
  'worklet'
  const col = index % COLUMNS
  const row = Math.floor(index / COLUMNS)
  return { x: col * (cardWidth + GAP), y: row * (CARD_HEIGHT + GAP) }
}

function nearestIndex(x, y, cardWidth, count) {
  'worklet'
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < count; i++) {
    const p = slotPosition(i, cardWidth)
    const dx = x - p.x
    const dy = y - p.y
    const dist = dx * dx + dy * dy
    if (dist < bestDist) { bestDist = dist; best = i }
  }
  return best
}

// ─── One card ────────────────────────────────────────────────────────────────
//
// Drag tracking runs entirely on the UI thread via react-native-gesture-
// handler's Gesture API + Reanimated shared values (the same pair the rest
// of the app already depends on — gesture-handler is required at the app
// entrypoint for React Navigation, and Reanimated's worklets babel plugin is
// already wired up in babel.config.js — so this isn't a new dependency,
// just the first place the app's own code drives them directly). The old
// implementation used PanResponder + the legacy Animated API: every touch-
// move had to round-trip through the JS bridge to update `pan`, and — the
// bigger issue — a card's rest position (`left`/`top`) was plain numbers
// that jumped instantly whenever its `index` changed, so every *other* card
// would pop into its new slot the instant a drag reordered them instead of
// sliding there. Both are fixed below: position is a pair of shared values
// driven by worklets (no bridge traffic while dragging), and any card whose
// slot changes animates to it with a spring instead of snapping.
function QuickAccessCard({
  item, index, cardWidth, itemCount, editing, isDragging,
  onNavigate, onRemove, onLongPressToggle, onDragStart, onDragMove, onDragEnd,
}) {
  const home = slotPosition(index, cardWidth)

  const translateX = useSharedValue(home.x)
  const translateY = useSharedValue(home.y)
  const dragStartX  = useSharedValue(home.x)
  const dragStartY  = useSharedValue(home.y)
  const scale       = useSharedValue(1)
  const jiggle       = useSharedValue(0)
  const opacity      = useSharedValue(1)
  const removingRef  = useRef(false)

  // A reorder mid-drag changes THIS card's `index` (and, if the grid
  // resizes, `cardWidth`/`itemCount`) — but the pan gesture below is built
  // once and never recreated, so those live values are mirrored into shared
  // values it can read on the UI thread instead of closing over the props
  // directly. Recreating the gesture object whenever `index` changed (the
  // first version of this did exactly that, keyed via useMemo like the old
  // PanResponder was) turned out to drop the in-progress native touch the
  // moment a drag caused a reorder — confirmed by a Playwright drag test
  // that moved a card, saw the sibling swap animate, and then never got the
  // onReorder commit because the gesture's onEnd never fired again after
  // GestureDetector swapped in the recreated gesture mid-touch.
  const indexSV     = useSharedValue(index)
  const cardWidthSV = useSharedValue(cardWidth)
  const itemCountSV = useSharedValue(itemCount)
  useEffect(() => { indexSV.value = index }, [index])
  useEffect(() => { cardWidthSV.value = cardWidth }, [cardWidth])
  useEffect(() => { itemCountSV.value = itemCount }, [itemCount])

  // Same idea for the JS-thread callbacks the gesture calls via runOnJS —
  // proxied through refs kept current every render, so the never-recreated
  // gesture always ends up invoking this render's actual handler instead of
  // whichever one existed when the gesture object was first built.
  const onDragStartRef = useRef(onDragStart)
  const onDragMoveRef  = useRef(onDragMove)
  const onDragEndRef   = useRef(onDragEnd)
  onDragStartRef.current = onDragStart
  onDragMoveRef.current  = onDragMove
  onDragEndRef.current   = onDragEnd
  function callDragStart(i) { onDragStartRef.current(i) }
  function callDragMove(from, to) { onDragMoveRef.current(from, to) }
  function callDragEnd() { onDragEndRef.current() }

  // Slide to this card's slot whenever its index (or the grid width)
  // changes. Skipped while this is the card being dragged — its position
  // is driven live by the finger instead (see the pan gesture below).
  useEffect(() => {
    if (isDragging) return
    translateX.value = withSpring(home.x, { damping: 20, stiffness: 220, mass: 0.6 })
    translateY.value = withSpring(home.y, { damping: 20, stiffness: 220, mass: 0.6 })
  }, [home.x, home.y, isDragging])

  useEffect(() => {
    scale.value = withTiming(isDragging ? 1.05 : 1, { duration: 150 })
  }, [isDragging])

  // Classic iOS-style jiggle — a small looping rotate oscillation, phase
  // offset per column so cards don't all wobble in lockstep. Runs as a
  // worklet on the UI thread, so it stays steady even while a drag is
  // simultaneously animating other cards' positions.
  useEffect(() => {
    if (editing && !isDragging) {
      const delay = (index % COLUMNS) * 60
      jiggle.value = withDelay(delay, withRepeat(
        withSequence(
          withTiming(1, { duration: 130 }),
          withTiming(-1, { duration: 260 }),
          withTiming(0, { duration: 130 }),
        ),
        -1,
      ))
    } else {
      jiggle.value = withTiming(0, { duration: 120 })
    }
  }, [editing, isDragging, index])

  function handleRemove() {
    if (removingRef.current) return
    removingRef.current = true
    opacity.value = withTiming(0, { duration: 220 }, finished => {
      if (finished) runOnJS(onRemove)(item.key)
    })
  }

  // Only rebuilt when `editing` flips (mirrors .enabled(), which really
  // does need to be set at creation time) — never on index/cardWidth/
  // itemCount, so an in-progress touch is never handed to a freshly built
  // gesture object mid-drag. Everything it needs that *can* change moves
  // through the shared values and ref-callbacks above instead.
  const pan = useMemo(() => Gesture.Pan()
    .enabled(editing)
    .minDistance(4)
    .onStart(() => {
      dragStartX.value = translateX.value
      dragStartY.value = translateY.value
      runOnJS(callDragStart)(indexSV.value)
    })
    .onUpdate(e => {
      translateX.value = dragStartX.value + e.translationX
      translateY.value = dragStartY.value + e.translationY
      const liveHome = slotPosition(indexSV.value, cardWidthSV.value)
      const target = nearestIndex(liveHome.x + e.translationX, liveHome.y + e.translationY, cardWidthSV.value, itemCountSV.value)
      runOnJS(callDragMove)(indexSV.value, target)
    })
    .onEnd(() => {
      runOnJS(callDragEnd)()
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [editing])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: isDragging ? '0deg' : `${jiggle.value * 1.4}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: isDragging ? 20 : 1,
    elevation: isDragging ? 8 : 0,
  }))

  const Icon = item.homeIcon || item.Icon

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.slot, { width: cardWidth, height: CARD_HEIGHT }, animatedStyle]}>
        <Pressable
          style={[styles.card, { backgroundColor: item.bg }]}
          onPress={() => { if (!editing) onNavigate(item) }}
          onLongPress={onLongPressToggle}
          delayLongPress={420}
          accessibilityRole="button"
          accessibilityLabel={item.homeLabel || item.label}
        >
          <View style={styles.iconWrap}>
            <Icon size={17} color={colors.navy} strokeWidth={1.8} />
          </View>
          <Text style={styles.label} numberOfLines={2}>{item.homeLabel || item.label}</Text>
          <Text style={styles.sub} numberOfLines={2}>{item.homeSub || item.sub}</Text>
        </Pressable>

        {editing && (
          <Pressable
            style={styles.removeBadge}
            onPress={handleRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.homeLabel || item.label} from Quick Access`}
          >
            <X size={11} color="#fff" strokeWidth={3} />
          </Pressable>
        )}
      </Animated.View>
    </GestureDetector>
  )
}

// ─── Grid ────────────────────────────────────────────────────────────────────
//
// `order` (an array of keys) is this component's own working copy of the
// arrangement so a drag can reshuffle cards live; it re-syncs from `items`
// whenever the parent's committed set/order actually changes (add, remove,
// or a reorder this component itself just reported back up).

export default function QuickAccessGrid({
  items, editing, onNavigate, onReorder, onRemove, onAddPress, onLongPressToggle,
}) {
  const [containerWidth, setContainerWidth] = useState(0)
  const [order, setOrder] = useState(items.map(i => i.key))
  const [draggingIndex, setDraggingIndex] = useState(null)
  const orderAtDragStartRef = useRef(order)

  useEffect(() => {
    setOrder(items.map(i => i.key))
  }, [items.map(i => i.key).join('|')])

  const cardWidth = containerWidth > 0 ? (containerWidth - GAP) / COLUMNS : 0
  const canAdd = items.length < 4
  const orderedItems = order.map(k => items.find(i => i.key === k)).filter(Boolean)
  const slotCount = orderedItems.length + (canAdd ? 1 : 0)
  const rows = Math.max(1, Math.ceil(slotCount / COLUMNS))
  const gridHeight = rows * CARD_HEIGHT + (rows - 1) * GAP

  function handleDragStart(index) {
    orderAtDragStartRef.current = order
    setDraggingIndex(index)
  }

  function handleDragMove(fromIndex, targetIndex) {
    if (targetIndex === fromIndex) return
    setOrder(prev => {
      const cur = [...prev]
      const [moved] = cur.splice(fromIndex, 1)
      cur.splice(targetIndex, 0, moved)
      return cur
    })
    setDraggingIndex(targetIndex)
  }

  function handleDragEnd() {
    setDraggingIndex(null)
    if (order.join('|') !== orderAtDragStartRef.current.join('|')) {
      onReorder(order)
    }
  }

  const addSlotIndex = orderedItems.length

  return (
    <View
      style={{ height: containerWidth > 0 ? gridHeight : undefined, position: 'relative' }}
      onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && orderedItems.map((item, i) => (
        <QuickAccessCard
          key={item.key}
          item={item}
          index={i}
          itemCount={orderedItems.length}
          cardWidth={cardWidth}
          editing={editing}
          isDragging={draggingIndex === i}
          onNavigate={onNavigate}
          onRemove={onRemove}
          onLongPressToggle={onLongPressToggle}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
      ))}

      {containerWidth > 0 && canAdd && (
        <View
          style={[
            styles.slot,
            {
              width: cardWidth, height: CARD_HEIGHT,
              left: slotPosition(addSlotIndex, cardWidth).x,
              top: slotPosition(addSlotIndex, cardWidth).y,
            },
          ]}
        >
          <Pressable
            style={styles.addCard}
            onPress={onAddPress}
            accessibilityRole="button"
            accessibilityLabel="Add a Quick Access shortcut"
          >
            <Plus size={20} color={colors.navy} strokeWidth={2} />
            <Text style={styles.addLabel}>Add shortcut</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  slot: { position: 'absolute' },
  card: {
    flex: 1, borderRadius: radius.card, padding: 13,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.07)',
  },
  addCard: {
    flex: 1, borderRadius: radius.card, padding: 13,
    borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.18)', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(30,58,95,0.03)',
  },
  addLabel: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy },
  iconWrap: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy, lineHeight: 16, marginBottom: 4 },
  sub:   { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, lineHeight: 14 },
  removeBadge: {
    position: 'absolute', top: -7, right: -7,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#DC2626',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.cream,
    ...shadows.card,
  },
})
