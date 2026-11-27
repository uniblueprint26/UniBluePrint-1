import { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { fonts } from '../../constants/theme'

// The light blue circle check that sits beside a verified name. Every live
// partner and every coach has one. Tapping it says "Verified by UBP".
// The blue is a brand colour, so it is the same in light and dark.
export const VERIFIED_BLUE = '#4FC3F7'
export const VERIFIED_LABEL = 'Verified by UBP'

export function TickIcon({ size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="11" fill={VERIFIED_BLUE} />
      <Path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export default function VerifiedTick({ size = 16, style, forceTip = false }) {
  const [tip, setTip] = useState(forceTip)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  function onPress() {
    setTip(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setTip(false), 2200)
  }
  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Pressable
        onPress={onPress}
        hitSlop={14}
        accessibilityRole="button"
        accessibilityLabel={VERIFIED_LABEL}
        style={{ width: size, height: size }}
      >
        <TickIcon size={size} />
      </Pressable>
      {tip && (
        <View pointerEvents="none" style={[styles.tip, { bottom: size + 6 }]}>
          <Text style={styles.tipText} numberOfLines={1}>{VERIFIED_LABEL}</Text>
        </View>
      )}
    </View>
  )
}

// A name with the tick attached to its last word, so the tick can never wrap
// onto a line of its own. Earlier words wrap normally, the last word and the
// tick always stay together.
export function NameWithTick({ name, textStyle, tickSize = 16, verified = true, color }) {
  const words = String(name || '').trim().split(/\s+/)
  const last = words.pop()
  const gap = Math.round(((StyleSheet.flatten(textStyle) || {}).fontSize || 16) * 0.26)
  return (
    <View style={styles.nameRow} accessible accessibilityRole="header" accessibilityLabel={verified ? `${name}, ${VERIFIED_LABEL}` : name}>
      {words.map((w, i) => (
        <Text key={i} style={[textStyle, color && { color }, { marginRight: gap }]}>{w}</Text>
      ))}
      <View style={styles.lastWord}>
        <Text style={[textStyle, color && { color }]}>{last}</Text>
        {verified && <VerifiedTick size={tickSize} style={{ marginLeft: Math.max(4, Math.round(tickSize * 0.3)) }} />}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', zIndex: 20 },
  tip: {
    position: 'absolute', alignSelf: 'center', backgroundColor: '#0F1B2D', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, minWidth: 108, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 6,
  },
  tipText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: '#FFFFFF' },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  lastWord: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
})
