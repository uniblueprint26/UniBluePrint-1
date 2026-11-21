import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Mail, Check, UserCheck } from 'lucide-react-native'
import { fonts, radius, spacing, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import Button from '../../components/ui/Button'
import SharePrompt from '../../components/feed/SharePrompt'

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
  const { colors } = useTheme()
  const styles = getStyles(colors)
  const insets = useSafeAreaInsets()
  const { serviceTitle, tier } = route.params || {}
  const isPremium = tier === 'premium'
  const [promptDismissed, setPromptDismissed] = useState(false)

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

  const when = isPremium ? 'Delivered within 24 hours' : 'Delivered within 48 hours'

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 20 }]}>
      <View style={{ flex: 1, width: '100%' }}>
        {phase === 'loading' ? (
          <View style={styles.loadingRing}>
            <Text style={styles.loadingLabel} numberOfLines={1}>
              Sealing your {serviceTitle || 'request'}
            </Text>
            <View style={styles.barTrack}>
              <Animated.View style={[styles.barFill, { width: barWidth }]} />
            </View>
          </View>
        ) : (
          <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] }}>
            <View style={styles.paper}>
              <Animated.View style={[styles.sealEnvelope, { transform: [{ scale: checkScale }] }]}>
                <Mail size={26} color={colors.accentFg} strokeWidth={1.6} />
                <View style={styles.sealTick}><Check size={11} color={colors.accentBg} strokeWidth={3.5} /></View>
              </Animated.View>
              <Text style={styles.title}>Submitted for review</Text>
              <Text style={styles.body}>Your {serviceTitle || 'request'} is on its way to a Campus Handler.</Text>

              <View style={styles.route}>
                {[
                  { t: 'Submitted', d: 'Your answers are in.', state: 'done' },
                  { t: 'With a Campus Handler', d: 'Reviewed by a real person, never AI only.', state: 'now' },
                  { t: when, d: 'We will tell you with a push notification, in Outputs and in your Notifications.', state: 'next' },
                ].map((r, i, arr) => (
                  <View key={r.t} style={styles.routeRow}>
                    <View style={styles.routeRail}>
                      <View style={[styles.dot, r.state === 'done' && styles.dotDone, r.state === 'now' && styles.dotNow]}>
                        {r.state === 'done' && <Check size={13} color={colors.accentFg} strokeWidth={3} />}
                        {r.state === 'now' && <View style={styles.dotCore} />}
                      </View>
                      {i < arr.length - 1 && <View style={styles.routeLine} />}
                    </View>
                    <View style={styles.routeText}>
                      <Text style={styles.routeTitle}>{r.t}</Text>
                      <Text style={styles.routeDesc}>{r.d}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
            <Text style={styles.subBody}>No need to keep this screen open.</Text>
          </Animated.View>
        )}
      </View>

      {phase === 'done' && (
        <View style={{ width: '100%' }}>
          <Button
            label="Back to Foundation"
            onPress={() => navigation.navigate('Foundation')}
            variant="primary"
            style={styles.primaryBtn}
          />
          <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.85} onPress={() => navigation.navigate('MyOutputs')} accessibilityRole="button">
            <Text style={styles.secondaryBtnText}>Go to Outputs</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'done' && (
        <SharePrompt
          visible={!promptDismissed}
          prefill={{
            initialTab: 'thread',
            initialMood: 'delira',
            initialText: `Just submitted my ${serviceTitle || 'Foundation output'}`,
          }}
          onShare={(prefill) => navigation.navigate('Composer', prefill)}
          onDismiss={() => setPromptDismissed(true)}
        />
      )}
    </View>
  )
}

function getStyles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md, alignItems: 'center' },
  iconWrap: { marginBottom: spacing.lg, minHeight: 56, justifyContent: 'center', alignItems: 'center' },

  loadingRing: { alignItems: 'center', gap: 12, marginTop: 120 },
  loadingLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
  barTrack: {
    width: 180, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(30,58,95,0.1)', overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: colors.accentBg },

  paper: {
    backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 22, paddingTop: 48, paddingBottom: 24, marginTop: 28, ...shadows.card,
  },
  sealEnvelope: {
    position: 'absolute', top: -30, alignSelf: 'center', width: 62, height: 62, borderRadius: 31,
    backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 5, borderColor: colors.background,
  },
  sealTick: {
    position: 'absolute', right: 8, bottom: 8, width: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.accentFg, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, color: colors.textPrimary, textAlign: 'center' },
  body: { fontFamily: fonts.sans, fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 23 },
  route: { marginTop: 26 },
  routeRow: { flexDirection: 'row', gap: 14 },
  routeRail: { alignItems: 'center', width: 28 },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  dotDone: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
  dotNow: { borderColor: colors.accentBg },
  dotCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentBg },
  routeLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2, minHeight: 22 },
  routeText: { flex: 1, paddingBottom: 18 },
  routeTitle: { fontFamily: fonts.sansSemiBold, fontSize: 17, color: colors.textPrimary },
  routeDesc: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.textSecondary, marginTop: 3 },
  subBody: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 16 },
  primaryBtn: { ...shadows.card },
  secondaryBtn: { alignItems: 'center', justifyContent: 'center', height: 54, marginTop: 10, borderRadius: radius.button, backgroundColor: colors.tabFill },
  secondaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.textPrimary },
  })
}
