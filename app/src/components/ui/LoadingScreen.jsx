import { useEffect, useRef } from 'react'
import { View, Image, Animated, Easing, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, radius } from '../../constants/theme'

/**
 * LoadingScreen — the app's single loading/splash surface.
 *
 * Navy background, the baked-pixel UBP logomark (assets/icon.png — cream
 * "UBP" wordmark + underline on navy, exported as an image, not live Text)
 * with a soft diagonal gold "shine" sweeping across it on a loop, like a
 * light reflection passing over glass. Deliberately image-only: this screen
 * has to be safe to render *before* the brand fonts have finished loading
 * (see App.jsx), so nothing here can ever race the font-loading gate the
 * way a live <Text fontFamily="DMSerifDisplay..."> would.
 *
 * Used both pre-fonts-loaded (App.jsx) and post-fonts-loaded (the
 * auth-resolving splash in navigation/index.jsx) so there's exactly one
 * loading screen in the app, not two different ones.
 */
const MARK_SIZE = 168
const SWEEP_WIDTH = MARK_SIZE * 0.4
const SWEEP_DURATION = 1500
const SWEEP_PAUSE = 950

export default function LoadingScreen() {
  const sweep = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let cancelled = false
    function run() {
      if (cancelled) return
      sweep.setValue(0)
      Animated.sequence([
        Animated.delay(SWEEP_PAUSE),
        Animated.timing(sweep, {
          toValue: 1,
          duration: SWEEP_DURATION,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && !cancelled) run()
      })
    }
    run()
    return () => { cancelled = true }
  }, [sweep])

  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-MARK_SIZE * 0.9, MARK_SIZE * 1.3],
  })

  return (
    <View style={styles.root}>
      <View style={styles.markClip}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.mark}
          resizeMode="cover"
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.sweepBand, { transform: [{ translateX }, { rotate: '24deg' }] }]}
        >
          <LinearGradient
            colors={[
              'rgba(228,199,126,0)',
              'rgba(228,199,126,0.14)',
              'rgba(245,229,184,0.9)',
              'rgba(228,199,126,0.14)',
              'rgba(228,199,126,0)',
            ]}
            locations={[0, 0.32, 0.5, 0.68, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markClip: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.navy,
  },
  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
  },
  // Tall/wide relative to the mark so the sweep still fully covers every
  // corner once rotated 24° and translated across, rather than clipping
  // the band's own edges at the top/bottom of the square.
  sweepBand: {
    position: 'absolute',
    top: -MARK_SIZE * 0.7,
    bottom: -MARK_SIZE * 0.7,
    width: SWEEP_WIDTH,
  },
})
