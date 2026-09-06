import { useRef, useState, useEffect, useMemo } from 'react'
import { View, Text, Pressable, Animated, PanResponder, StyleSheet } from 'react-native'
import { Plus, X } from 'lucide-react-native'
import { colors, fonts, radius, shadows } from '../../constants/theme'

// ─── Layout constants ───────────────────────────────────────────────────────
const COLUMNS     = 2
const GAP         = 10
const CARD_HEIGHT = 112

function slotPosition(index, cardWidth) {
  const col = index % COLUMNS
  const row = Math.floor(index / COLUMNS)
  return { x: col * (cardWidth + GAP), y: row * (CARD_HEIGHT + GAP) }
}

function nearestIndex(x, y, cardWidth, count) {
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

function QuickAccessCard({
  item, index, cardWidth, itemCount, editing, isDragging,
  onNavigate, onRemove, onLongPressToggle, onDragStart, onDragMove, onDragEnd,
}) {
  const pan      = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current
  const jiggle   = useRef(new Animated.Value(0)).current
  const opacity  = useRef(new Animated.Value(1)).current
  const removing = useRef(false)

  // Classic iOS-style jiggle — a small looping rotate oscillation, phase
  // offset per column so cards don't all wobble in lockstep.
  useEffect(() => {
    let loop
    if (editing && !isDragging) {
      jiggle.setValue(0)
      const delay = (index % COLUMNS) * 60
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(jiggle, { toValue: 1, duration: 130, delay, useNativeDriver: true }),
          Animated.timing(jiggle, { toValue: -1, duration: 260, useNativeDriver: true }),
          Animated.timing(jiggle, { toValue: 0, duration: 130, useNativeDriver: true }),
        ])
      )
      loop.start()
    } else {
      jiggle.setValue(0)
    }
    return () => { loop?.stop() }
  }, [editing, isDragging, index])

  // panResponder is rebuilt whenever inputs it closes over change, so its
  // handlers never read stale index/cardWidth/itemCount values.
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => editing,
    onMoveShouldSetPanResponder: (_, g) => editing && (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
    onPanResponderGrant: () => {
      pan.setValue({ x: 0, y: 0 })
      onDragStart(index)
    },
    onPanResponderMove: (_, g) => {
      pan.setValue({ x: g.dx, y: g.dy })
      const home = slotPosition(index, cardWidth)
      const target = nearestIndex(home.x + g.dx, home.y + g.dy, cardWidth, itemCount)
      onDragMove(index, target)
    },
    onPanResponderRelease: () => {
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true, friction: 7 }).start()
      onDragEnd()
    },
    onPanResponderTerminate: () => {
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start()
      onDragEnd()
    },
  }), [editing, index, cardWidth, itemCount])

  function handleRemove() {
    if (removing.current) return
    removing.current = true
    Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      onRemove(item.key)
    })
  }

  const home = slotPosition(index, cardWidth)
  const rotate = jiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-1.4deg', '1.4deg'] })
  const Icon = item.homeIcon || item.Icon

  return (
    <Animated.View
      {...(editing ? panResponder.panHandlers : {})}
      style={[
        styles.slot,
        {
          width: cardWidth, height: CARD_HEIGHT,
          left: home.x, top: home.y,
          opacity,
          zIndex: isDragging ? 20 : 1,
          elevation: isDragging ? 8 : 0,
          transform: [
            { translateX: pan.x }, { translateY: pan.y },
            { rotate: isDragging ? '0deg' : rotate },
            { scale: isDragging ? 1.04 : 1 },
          ],
        },
      ]}
    >
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
