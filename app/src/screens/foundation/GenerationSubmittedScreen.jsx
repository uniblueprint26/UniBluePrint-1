import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CheckCircle2, UserCheck } from 'lucide-react-native'
import { colors, fonts, radius, spacing, shadows } from '../../constants/theme'
import BlueprintGrid from '../../components/ui/BlueprintGrid'
import Button from '../../components/ui/Button'

// Generic confirmation screen for every Foundation Blueprint generator service —
// built once here rather than duplicated per service, since the message is the
// same regardless of which one just got submitted: it's with a Campus Handler now,
// not something the student sees the raw AI output of directly.
//
// This is the single biggest commitment moment in the Foundation Blueprint flow
// (15 questions answered, real intent to submit/pay) — previously a flat, static
// confirmation. Now a short loading->complete sequence: a progress bar fills,
// a checkmark pops in with a spring bounce, then the confirmation content fades
// up — reusing the same dot-grid ("Blueprint") motif, serif display type, and
// spring/pop animation language already established on the marketing side (see
// BlueprintGrid.jsx's reference note).

const LOADING_DURATION = 1100

export default function GenerationSubmittedScreen({ navigation, route }) {
  const insets = useSafeAreaInsets()
  const { serviceTitle, tier } = route.params || {}
  const isPremium = tier === 'premium'

  const [phase, setPhase] = useState('loading') // 'loading' | 'done'

  const progress = useRef(new Animated.Value(0)).current
  const checkScale = useRef(new Animated.Value(0)).current
  const contentOpacity = useRef(new Animated.Value(0)).current
  const contentTranslateY = useRef(new Animated.Value(14)).current

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: LOADING_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width isn't supported by the native driver
    }).start(() => {
      setPhase('done')
      Animated.sequence([
        // A slight overshoot-then-settle pop, not a plain fade — the same
        // "pop" feel the artifact's own keyframes use for a completed moment.
        Animated.spring(checkScale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(contentOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
          Animated.timing(contentTranslateY, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]),
      ]).start()
    })
  }, [])

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <BlueprintGrid color="rgba(30,58,95,0.05)" />

      <View style={styles.iconWrap}>
        {phase === 'loading' ? (
          <View style={styles.loadingRing}>
            <Text style={styles.loadingLabel} numberOfLines={1}>
              Finalising your {serviceTitle || 'request'}…
            </Text>
            <View style={styles.barTrack}>
              <Animated.View style={[styles.barFill, { width: barWidth }]} />
            </View>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale: checkScale }] }}>
            <CheckCircle2 size={56} color={colors.success} />
          </Animated.View>
        )}
      </View>

      <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }], alignItems: 'center' }}>
        <Text style={styles.title}>Submitted for review</Text>
        <Text style={styles.body}>
          Your {serviceTitle || 'request'} has been generated and is now with a trained Campus Handler for review —{' '}
          {isPremium ? 'delivered within 24 hours (priority queue).' : 'delivered within 48 hours.'}
        </Text>

        <View style={styles.reviewBadge}>
          <UserCheck size={14} color={colors.navy} strokeWidth={2} />
          <Text style={styles.reviewBadgeText}>Reviewed by a real Campus Handler, never AI-only</Text>
        </View>

        <Text style={styles.subBody}>
          We'll let you know the moment it's ready — a push notification plus an update in My Outputs and your Notifications. No need to keep this screen open.
        </Text>

        <Button
          label="Back to Foundation Blueprint"
          onPress={() => navigation.navigate('Foundation')}
          variant="primary"
          style={styles.primaryBtn}
        />

        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('MyOutputs')}
        >
          <Text style={styles.secondaryBtnText}>Go to My Outputs</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: spacing.lg, alignItems: 'center' },
  iconWrap: { marginBottom: spacing.lg, minHeight: 56, justifyContent: 'center', alignItems: 'center' },

  loadingRing: { alignItems: 'center', gap: 12 },
  loadingLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
  barTrack: {
    width: 180, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(30,58,95,0.1)', overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: colors.navy },

  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy, textAlign: 'center' },
  body: { fontFamily: fonts.sans, fontSize: 15, color: colors.navy, textAlign: 'center', marginTop: 12, lineHeight: 22 },

  reviewBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: colors.white, borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 8, marginTop: 16,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  reviewBadgeText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy },

  subBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 14, lineHeight: 19 },
  primaryBtn: { marginTop: spacing.xl, ...shadows.card },

  secondaryBtn: { alignItems: 'center', marginTop: spacing.lg },
  secondaryBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy },
})
