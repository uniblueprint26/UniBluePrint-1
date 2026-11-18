import { useEffect, useRef } from 'react'
import { View, Text, Animated, Easing, StyleSheet } from 'react-native'
import { fonts } from '../../constants/theme'

// The UBP loading mark: the "UBP" letters breathe softly while a thin line
// beneath them draws across and resets. Calm on purpose, so a slow connection
// feels looked after rather than broken. Built with Animated only (no extra
// dependencies), and it works on a dark tile or a light page: pass `color`.
//
// size    letter size in px (the whole mark scales from it)
// color   letters and line
// label   optional small caption under the mark ("Opening clip")
export default function UbpLoader({ size = 30, color = '#F5F0E8', label, style }) {
  const breathe = useRef(new Animated.Value(0)).current
  const draw = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    )
    const d = Animated.loop(
      Animated.sequence([
        Animated.timing(draw, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        Animated.delay(250),
        Animated.timing(draw, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    )
    b.start()
    d.start()
    return () => { b.stop(); d.stop() }
  }, [breathe, draw])

  const lineW = Math.round(size * 2.1)
  const opacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] })
  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] })
  // Scale from the left edge: translate by half the width to pin the origin.
  const lineScale = draw.interpolate({ inputRange: [0, 1], outputRange: [0.02, 1] })
  const lineShift = draw.interpolate({ inputRange: [0, 1], outputRange: [-lineW * 0.49, 0] })

  return (
    <View style={[s.wrap, style]} accessibilityRole="progressbar" accessibilityLabel={label || 'Loading'}>
      <Animated.Text style={[s.mark, { fontSize: size, color, opacity, transform: [{ scale }] }]}>UBP</Animated.Text>
      <View style={{ width: lineW, height: 2, marginTop: Math.round(size * 0.18), overflow: 'hidden' }}>
        <Animated.View
          style={{
            width: lineW, height: 2, backgroundColor: color,
            transform: [{ translateX: lineShift }, { scaleX: lineScale }],
          }}
        />
      </View>
      {!!label && <Text style={[s.label, { color }]}>{label}</Text>}
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  mark: { fontFamily: fonts.serif, includeFontPadding: false, letterSpacing: 0.5 },
  label: { fontFamily: fonts.sansMedium, fontSize: 12, marginTop: 12, opacity: 0.8 },
})
