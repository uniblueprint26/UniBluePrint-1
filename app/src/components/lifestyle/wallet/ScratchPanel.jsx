import { useEffect, useRef, useState } from 'react'
import { View, Text, Animated, PanResponder, StyleSheet } from 'react-native'
import { fonts } from '../../../constants/theme'

// A silver scratch panel the member rubs off with a finger. A grid of tiles sits
// over the code. PanResponder clears the tiles under the finger. When about 60
// percent are clear the rest fades away and onDone fires. No dependency, no prize.
// A screen reader can double tap the panel to reveal the code instead.

const CLEAR_TARGET = 0.6

export default function ScratchPanel({ width = 180, height = 40, tile = 9, onDone, reducedMotion = false }) {
  const cols = Math.ceil(width / tile)
  const rows = Math.ceil(height / tile)
  const total = cols * rows
  const cleared = useRef(new Set())
  const last = useRef(null)
  const done = useRef(false)
  const [, bump] = useState(0)
  const fade = useRef(new Animated.Value(1)).current
  const raf = useRef(null)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => () => { if (raf.current) cancelAnimationFrame?.(raf.current) }, [])

  function finish() {
    if (done.current) return
    done.current = true
    Animated.timing(fade, { toValue: 0, duration: reducedMotion ? 120 : 260, useNativeDriver: false }).start(() => doneRef.current?.())
  }

  function clearAround(x, y) {
    const R = tile * 1.7
    const c0 = Math.max(0, Math.floor((x - R) / tile))
    const c1 = Math.min(cols - 1, Math.floor((x + R) / tile))
    const r0 = Math.max(0, Math.floor((y - R) / tile))
    const r1 = Math.min(rows - 1, Math.floor((y + R) / tile))
    let changed = false
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const cx = c * tile + tile / 2
        const cy = r * tile + tile / 2
        if ((cx - x) * (cx - x) + (cy - y) * (cy - y) <= R * R) {
          const k = r * cols + c
          if (!cleared.current.has(k)) { cleared.current.add(k); changed = true }
        }
      }
    }
    return changed
  }

  function scratchTo(x, y) {
    if (done.current) return
    let changed = false
    const prev = last.current
    if (prev) {
      const dist = Math.hypot(x - prev.x, y - prev.y)
      const steps = Math.max(1, Math.ceil(dist / (tile * 0.6)))
      for (let i = 1; i <= steps; i++) {
        if (clearAround(prev.x + ((x - prev.x) * i) / steps, prev.y + ((y - prev.y) * i) / steps)) changed = true
      }
    } else if (clearAround(x, y)) changed = true
    last.current = { x, y }
    if (changed) {
      bump(n => n + 1)
      if (cleared.current.size / total >= CLEAR_TARGET) finish()
    }
  }

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: e => { last.current = null; scratchTo(e.nativeEvent.locationX, e.nativeEvent.locationY) },
    onPanResponderMove: e => scratchTo(e.nativeEvent.locationX, e.nativeEvent.locationY),
    onPanResponderRelease: () => { last.current = null },
    onPanResponderTerminate: () => { last.current = null },
  })).current

  const tiles = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const k = r * cols + c
      if (cleared.current.has(k)) continue
      tiles.push(
        <View
          key={k}
          pointerEvents="none"
          style={{
            position: 'absolute', left: c * tile, top: r * tile, width: tile + 0.5, height: tile + 0.5,
            backgroundColor: (r + c) % 2 === 0 ? '#C9CED6' : '#AEB5C0',
          }}
        />,
      )
    }
  }
  const showLabel = cleared.current.size / total < 0.12

  return (
    <Animated.View
      {...pan.panHandlers}
      style={[styles.panel, { width, height, opacity: fade }]}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Scratch panel. Double tap to reveal your code."
      onAccessibilityTap={finish}
    >
      {tiles}
      {showLabel && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={styles.labelWrap}>
            <Text style={styles.label}>SCRATCH</Text>
          </View>
        </View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  panel: { borderRadius: 6, overflow: 'hidden', backgroundColor: 'transparent' },
  labelWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 3, color: '#5D6673' },
})
