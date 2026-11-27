import { useEffect, useMemo, useRef } from 'react'
import { View, Animated, Easing, Platform, StyleSheet } from 'react-native'

// A short burst of confetti in the brand colours. Cosmetic only. With reduced
// motion on, it is a soft colour wash that fades, no falling pieces.
const NATIVE = Platform.OS !== 'web'

function Piece({ color, x, delay, size, drift, spin, height, duration }) {
  const t = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration, delay, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }).start()
  }, [t, duration, delay])
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute', left: x, top: 0, width: size, height: size * 1.6, borderRadius: 2, backgroundColor: color,
        opacity: t.interpolate({ inputRange: [0, 0.08, 0.8, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-12, height] }) },
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, drift] }) },
          { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${spin}deg`] }) },
        ],
      }}
    />
  )
}

export default function Confetti({ colors, width, height, reducedMotion = false, burstKey = 0 }) {
  const pieces = useMemo(() => {
    const list = colors && colors.length ? colors : ['#FFFFFF']
    return Array.from({ length: 26 }, (_, i) => ({
      key: `${burstKey}-${i}`,
      color: list[i % list.length],
      x: Math.round(((i * 37) % 100) / 100 * width),
      delay: (i % 7) * 60,
      size: 5 + (i % 3) * 2,
      drift: ((i % 5) - 2) * 18,
      spin: 180 + (i % 4) * 140,
      duration: 1100 + (i % 6) * 140,
    }))
  }, [colors, width, burstKey])

  const wash = useRef(new Animated.Value(0)).current
  useEffect(() => {
    if (!reducedMotion) return
    wash.setValue(0)
    Animated.sequence([
      Animated.timing(wash, { toValue: 1, duration: 180, useNativeDriver: NATIVE }),
      Animated.timing(wash, { toValue: 0, duration: 700, useNativeDriver: NATIVE }),
    ]).start()
  }, [burstKey, reducedMotion, wash])

  if (!burstKey) return null
  if (reducedMotion) {
    return (
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: wash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }), backgroundColor: (colors && colors[1]) || '#FFFFFF', borderRadius: 16 }]} />
    )
  }
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {pieces.map(p => <Piece key={p.key} {...p} height={height} />)}
    </View>
  )
}
