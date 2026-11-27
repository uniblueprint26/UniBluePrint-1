import { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native'
import { fonts } from '../../../constants/theme'
import ScratchPanel from './ScratchPanel'
import * as haptic from './haptics'

// The member code on the open card.
//   First time the card is opened: the code sits under a scratch panel.
//   After that: the code is masked ("UBP •••• 0007"). Press and hold reveals it,
//   with a slow haptic build and a tick. It masks again shortly after you let go.
// A screen reader can double tap the masked code to hear it revealed.

const BUILD_MS = 900
const SHOW_AFTER_RELEASE_MS = 1800

export default function CodeArea({ code, scratched, onScratched, onHoldReveal, color, s = 1, reducedMotion }) {
  const [shown, setShown] = useState(false)
  // Right after scratching, the code stays visible until the card is closed.
  const [justScratched, setJustScratched] = useState(false)
  const timers = useRef([])
  const progress = useRef(new Animated.Value(0)).current
  const textStyle = { fontFamily: fonts.sansBold, fontSize: Math.round(16 * s), letterSpacing: 2.2, color }
  const panelW = Math.round(180 * s)
  const panelH = Math.round(34 * s)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function later(fn, ms) { timers.current.push(setTimeout(fn, ms)) }
  function clearAll() { timers.current.forEach(clearTimeout); timers.current = [] }

  function pressIn() {
    clearAll()
    progress.setValue(0)
    Animated.timing(progress, { toValue: 1, duration: BUILD_MS, useNativeDriver: false }).start()
    haptic.light()
    later(haptic.light, 300)
    later(haptic.medium, 600)
    later(() => { setShown(true); haptic.tick(); onHoldReveal?.() }, BUILD_MS)
  }

  function pressOut() {
    clearAll()
    progress.stopAnimation()
    progress.setValue(0)
    if (shown) later(() => setShown(false), SHOW_AFTER_RELEASE_MS)
  }

  function a11yReveal() {
    clearAll()
    setShown(true)
    onHoldReveal?.()
    later(() => setShown(false), 4000)
  }

  return (
    <View>
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10, opacity: 0.85, color, marginBottom: 3 }}>Member code</Text>
      {!scratched ? (
        <View style={{ width: panelW, height: panelH, justifyContent: 'center' }}>
          <Text style={[textStyle, styles.under]} numberOfLines={1}>{code.full}</Text>
          <View style={StyleSheet.absoluteFill}>
            <ScratchPanel width={panelW} height={panelH} tile={Math.max(7, Math.round(9 * s))} reducedMotion={reducedMotion} onDone={() => { setJustScratched(true); onScratched?.() }} />
          </View>
        </View>
      ) : (
        <Pressable
          onPressIn={pressIn}
          onPressOut={pressOut}
          delayLongPress={0}
          accessibilityRole="button"
          accessibilityLabel={shown ? `Member code ${code.digits.split('').join(' ')}` : 'Member code hidden. Double tap to reveal.'}
          onAccessibilityTap={a11yReveal}
          style={{ minHeight: 34, justifyContent: 'center', alignSelf: 'flex-start' }}
        >
          <Text style={textStyle} numberOfLines={1}>{shown || justScratched ? code.full : code.masked}</Text>
          <View style={styles.track}>
            <Animated.View style={{ height: 2, borderRadius: 1, backgroundColor: color, opacity: 0.7, width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
          </View>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  under: { position: 'absolute', left: 4 },
  track: { height: 2, marginTop: 2 },
})
