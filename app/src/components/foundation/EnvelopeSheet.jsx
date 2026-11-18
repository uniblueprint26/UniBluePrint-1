import { useEffect, useRef, useCallback, useState } from 'react'
import {
  Animated, Easing, Modal, Pressable, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, useWindowDimensions, Platform, AccessibilityInfo,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Polygon, Line } from 'react-native-svg'
import { X, Zap } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts } from '../../constants/theme'
import { envelopePaper, FLAP_DEPTH } from './envelopePaper'
import { STATUS_TEXT } from './EnvelopeTile'

// The opened envelope. Tapping an envelope in the grid mounts this: the flap
// rotates open on its top edge, the letter slides up out of the envelope and
// shows what the Foundation Blueprint is, with the button that starts it.
// Built on the Animated API only (no extra dependencies).
//
// Layers, bottom to top: envelope back, open flap (inside paper), letter,
// envelope front, closed flap with the seal. The closed flap and open flap
// are the same triangle; at the half-way point of the turn the closed one
// hides and the open one shows, so the flap is in front of the letter while
// closed and behind it once open.

const NATIVE = Platform.OS !== 'web'

export default function EnvelopeSheet({
  service, status, isIOS, weekend, primary, secondary, onClose, colors, isDark,
}) {
  const paper = envelopePaper(isDark)
  const insets = useSafeAreaInsets()
  const { width: winW, height: winH } = useWindowDimensions()

  const W = Math.min(winW - 48, 340)
  const E = Math.round(W * 0.52)
  const Fh = Math.round(E * FLAP_DEPTH)
  const tuck = Math.round(E * 0.3) // how much of the letter stays inside the envelope pocket
  const L = Math.max(340, Math.min(600, winH - insets.top - insets.bottom - 56 - 56 - Math.round(E * 0.7)))
  const envTop = L - tuck
  const stageH = envTop + E
  const letterW = W - 28
  const closedShift = envTop + Math.round(E * 0.2) // letter tucked just under the flap fold

  const flap = useRef(new Animated.Value(0)).current   // 0 closed, 1 open
  const letter = useRef(new Animated.Value(0)).current // 0 inside, 1 risen
  const fade = useRef(new Animated.Value(0)).current   // backdrop
  const closing = useRef(false)
  const [revealed, setRevealed] = useState(false)
  const [reduce, setReduce] = useState(false)

  useEffect(() => {
    let alive = true
    AccessibilityInfo.isReduceMotionEnabled?.().then(v => { if (alive) setReduce(!!v) }).catch(() => {})
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const d = reduce ? 0 : 1
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 220 * d, useNativeDriver: NATIVE }),
      Animated.timing(flap, { toValue: 1, duration: 460 * d, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }),
      Animated.timing(letter, { toValue: 1, duration: 620 * d, delay: 330 * d, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }),
    ]).start(({ finished }) => { if (finished) setRevealed(true) })
  }, [fade, flap, letter, reduce])

  const requestClose = useCallback(() => {
    if (closing.current) return
    closing.current = true
    setRevealed(false)
    const d = reduce ? 0 : 1
    Animated.parallel([
      Animated.timing(letter, { toValue: 0, duration: 260 * d, easing: Easing.in(Easing.cubic), useNativeDriver: NATIVE }),
      Animated.timing(flap, { toValue: 0, duration: 300 * d, delay: 160 * d, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE }),
      Animated.timing(fade, { toValue: 0, duration: 260 * d, delay: 200 * d, useNativeDriver: NATIVE }),
    ]).start(() => onClose())
  }, [fade, flap, letter, onClose, reduce])

  // Flap turn about its top edge. Same transform for both faces.
  const angle = flap.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })
  const flapTransform = [
    { perspective: 900 }, { translateY: -Fh / 2 }, { rotateX: angle }, { translateY: Fh / 2 },
  ]
  const closedOpacity = flap.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [1, 1, 0, 0] })
  const openOpacity = flap.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [0, 0, 1, 1] })

  const letterY = letter.interpolate({ inputRange: [0, 1], outputRange: [closedShift, 0] })
  // The envelope starts centred on screen and settles lower as the letter rises.
  const stageY = letter.interpolate({ inputRange: [0, 1], outputRange: [-envTop / 2, 0] })
  const titleOpacity = flap.interpolate({ inputRange: [0, 0.35], outputRange: [1, 0], extrapolate: 'clamp' })
  const contentOpacity = letter.interpolate({ inputRange: [0.45, 1], outputRange: [0, 1], extrapolate: 'clamp' })

  const { Icon, letter: copy } = service
  const steps = copy
    ? [
        ...copy.steps,
        `${copy.receive} ${weekend ? 'Standard is within 48 hours. Premium is by the end of Monday.' : 'Standard is within 48 hours. Premium is within 24 hours.'}`,
      ]
    : []
  const statusColor = status === 'delivered' ? (isDark ? '#7FD6A3' : '#2E8F5B') : colors.textSecondary

  return (
    <Modal visible transparent animationType="none" onRequestClose={requestClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay, opacity: fade }]} />
      {/* Tapping the dim area closes. A sibling, not a parent, so buttons are never nested. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} accessibilityLabel="Dismiss" />
      <View style={[s.fill, { paddingBottom: 56 + insets.bottom }]} pointerEvents="box-none">
        <Animated.View style={{ transform: [{ translateY: stageY }] }} pointerEvents="box-none">
          <View style={{ width: W, height: stageH, overflow: 'hidden' }} pointerEvents="box-none">
            {/* envelope back */}
            <View style={[s.abs, { top: envTop, left: 0, width: W, height: E, borderRadius: 16, backgroundColor: paper.inner, borderWidth: 1, borderColor: paper.edge }]} />

            {/* open flap: inside paper, sits behind the letter */}
            <Animated.View style={[s.abs, { top: envTop, left: 0, width: W, height: Fh, opacity: openOpacity, transform: flapTransform }]} pointerEvents="none">
              <Svg width={W} height={Fh}>
                <Polygon points={`0,0 ${W},0 ${W / 2},${Fh}`} fill={paper.inner} stroke={paper.edge} strokeWidth={1} strokeLinejoin="round" />
              </Svg>
            </Animated.View>

            {/* the letter */}
            <Animated.View
              style={[
                s.letter,
                { left: 14, width: letterW, height: L, paddingBottom: tuck + 14, backgroundColor: paper.letter, borderColor: paper.edge, shadowColor: paper.shadow, transform: [{ translateY: letterY }] },
              ]}
            >
              <Animated.View style={{ flex: 1, opacity: contentOpacity }} pointerEvents={revealed ? 'auto' : 'none'}>
                <View style={s.letterTop}>
                  <View style={[s.iconChip, { backgroundColor: paper.sealBg }]}>
                    <Icon size={18} color={paper.sealFg} strokeWidth={1.9} />
                  </View>
                  <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={2}>{service.title}</Text>
                </View>
                {status ? (
                  <View style={s.statusRow}>
                    <View style={[s.dot, { backgroundColor: statusColor }]} />
                    <Text style={[s.statusText, { color: statusColor }]}>{STATUS_TEXT[status]}</Text>
                  </View>
                ) : null}

                <View style={s.descWrap}>
                <ScrollView
                  style={s.descScroll}
                  contentContainerStyle={s.descContent}
                  showsVerticalScrollIndicator
                  indicatorStyle={isDark ? 'white' : 'black'}
                >
                  {copy ? (
                    <>
                      <Text style={[s.promise, { color: colors.textPrimary }]}>{copy.promise}</Text>
                      {copy.note ? <Text style={[s.note, { color: paper.letterText2 }]}>{copy.note}</Text> : null}

                      <Text style={[s.heading, { color: paper.letterText2 }]}>WHAT YOU GET</Text>
                      {copy.get.map(item => (
                        <View key={item} style={s.bulletRow}>
                          <View style={[s.bullet, { backgroundColor: paper.letterText2 }]} />
                          <Text style={[s.body, { color: colors.textPrimary }]}>{item}</Text>
                        </View>
                      ))}

                      {copy.ats ? (
                        <View style={[s.atsBox, { borderColor: paper.edge }]}>
                          <Text style={[s.atsTitle, { color: colors.textPrimary }]}>{copy.ats.title}</Text>
                          {copy.ats.intro.map(p => (
                            <Text key={p} style={[s.body, s.atsPara, { color: colors.textPrimary }]}>{p}</Text>
                          ))}
                          <Text style={[s.atsSub, { color: paper.letterText2 }]}>{copy.ats.howTitle}</Text>
                          {copy.ats.how.map(item => (
                            <View key={item} style={s.bulletRow}>
                              <View style={[s.bullet, { backgroundColor: paper.letterText2 }]} />
                              <Text style={[s.body, { color: colors.textPrimary }]}>{item}</Text>
                            </View>
                          ))}
                          <Text style={[s.body, s.atsPara, { color: paper.letterText2, marginTop: 10 }]}>{copy.ats.outro}</Text>
                        </View>
                      ) : null}

                      <Text style={[s.heading, { color: paper.letterText2 }]}>HOW IT WORKS</Text>
                      {steps.map((text, i) => (
                        <View key={i} style={s.bulletRow}>
                          <View style={[s.stepNum, { borderColor: paper.letterText2 }]}>
                            <Text style={[s.stepNumText, { color: colors.textPrimary }]}>{i + 1}</Text>
                          </View>
                          <Text style={[s.body, { color: colors.textPrimary }]}>{text}</Text>
                        </View>
                      ))}

                      <Text style={[s.heading, { color: paper.letterText2 }]}>WHY IT IS DIFFERENT</Text>
                      {copy.different.map(item => {
                        const cut = item.indexOf('. ')
                        const lead = cut > 0 ? item.slice(0, cut + 1) : item
                        const rest = cut > 0 ? item.slice(cut + 1) : ''
                        return (
                          <View key={item} style={s.bulletRow}>
                            <View style={[s.bullet, { backgroundColor: paper.letterText2 }]} />
                            <Text style={[s.body, { color: colors.textPrimary }]}>
                              <Text style={s.lead}>{lead}</Text>{rest}
                            </Text>
                          </View>
                        )
                      })}
                    </>
                  ) : (
                    <>
                      <Text style={[s.promise, { color: colors.textPrimary }]}>{service.tagline}</Text>
                      <Text style={[s.body, { color: colors.textPrimary, marginTop: 10 }]}>{service.description}</Text>
                    </>
                  )}
                </ScrollView>
                <LinearGradient pointerEvents="none" colors={[paper.letter + '00', paper.letter]} style={s.fade} />
                </View>

                {isIOS ? (
                  <Text style={[s.iosNote, { color: paper.letterText2 }]}>
                    {service.title} is ordered and paid for on uniblueprint.ie, not in the app.
                  </Text>
                ) : (
                  <View style={s.tiers}>
                    <View style={[s.tier, { borderColor: paper.edge }]}>
                      <Text style={[s.tierLabel, { color: paper.letterText2 }]}>Standard</Text>
                      <View style={s.tierValueRow}>
                        <Text style={[s.tierPrice, { color: colors.textPrimary }]}>{service.priceStd}</Text>
                        <Text style={[s.tierTime, { color: paper.letterText2 }]}>48hr</Text>
                      </View>
                    </View>
                    <View style={[s.tier, { borderColor: paper.edge }]}>
                      <View style={s.tierLabelRow}>
                        <Zap size={10} color={colors.goldText} fill={colors.goldText} />
                        <Text style={[s.tierLabel, { color: paper.letterText2 }]}>Premium</Text>
                      </View>
                      <View style={s.tierValueRow}>
                        <Text style={[s.tierPrice, { color: colors.textPrimary }]}>{service.pricePrem}</Text>
                        <Text style={[s.tierTime, { color: paper.letterText2 }]}>{weekend ? 'Monday' : '24hr'}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {primary ? (
                  <TouchableOpacity
                    style={[s.cta, { backgroundColor: colors.accentBg }]}
                    activeOpacity={0.85}
                    onPress={primary.onPress}
                    accessibilityRole="button"
                  >
                    <Text style={[s.ctaText, { color: colors.accentFg }]}>{primary.label}</Text>
                  </TouchableOpacity>
                ) : null}
                {secondary ? (
                  <TouchableOpacity style={s.secondary} activeOpacity={0.7} onPress={secondary.onPress} accessibilityRole="button">
                    <Text style={[s.secondaryText, { color: paper.letterText2 }]}>{secondary.label}</Text>
                  </TouchableOpacity>
                ) : null}
              </Animated.View>
            </Animated.View>

            {/* envelope front */}
            <View
              pointerEvents="none"
              style={[s.abs, { top: envTop, left: 0, width: W, height: E, borderRadius: 16, backgroundColor: paper.body, borderWidth: 1, borderColor: paper.edge }]}
            >
              <Svg width={W} height={E} style={StyleSheet.absoluteFill}>
                <Line x1={1} y1={E - 1} x2={W / 2} y2={E * 0.46} stroke={paper.edge} strokeWidth={1} />
                <Line x1={W - 1} y1={E - 1} x2={W / 2} y2={E * 0.46} stroke={paper.edge} strokeWidth={1} />
              </Svg>
            </View>
            <Animated.Text
              pointerEvents="none"
              style={[s.closedTitle, { top: envTop + Math.round(E * 0.72), color: colors.textPrimary, opacity: titleOpacity }]}
              numberOfLines={2}
            >
              {service.title}
            </Animated.Text>

            {/* closed flap + seal: in front of everything while closed */}
            <Animated.View style={[s.abs, { top: envTop, left: 0, width: W, height: Fh, opacity: closedOpacity, transform: flapTransform }]} pointerEvents="none">
              <Svg width={W} height={Fh}>
                <Polygon points={`0,0 ${W},0 ${W / 2},${Fh}`} fill={paper.flap} stroke={paper.edge} strokeWidth={1} strokeLinejoin="round" />
              </Svg>
              <View style={[s.seal, { backgroundColor: paper.sealBg, left: W / 2 - 20, top: Fh - 20 }]}>
                <Icon size={19} color={paper.sealFg} strokeWidth={1.9} />
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[s.closeWrap, { bottom: insets.bottom + 14, opacity: fade }]} pointerEvents="box-none">
        <TouchableOpacity
          style={[s.closeBtn, { backgroundColor: paper.letter, borderColor: paper.edge }]}
          onPress={requestClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
          activeOpacity={0.8}
        >
          <X size={18} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  )
}

const s = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  abs: { position: 'absolute' },
  letter: {
    position: 'absolute', top: 0, borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 18, paddingTop: 16,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 3,
  },
  letterTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconChip: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  title: { flex: 1, fontFamily: fonts.serif, fontSize: 22, lineHeight: 26 },
  descWrap: { flex: 1, marginTop: 10 },
  descScroll: { flex: 1 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 22 },
  descContent: { paddingBottom: 8, paddingRight: 4 },
  promise: { fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 20 },
  note: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, marginTop: 8 },
  heading: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1, marginTop: 22, marginBottom: 10 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 9 },
  bullet: { width: 4, height: 4, borderRadius: 2, marginTop: 9 },
  body: { flex: 1, fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20 },
  lead: { fontFamily: fonts.sansSemiBold },
  stepNum: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 0 },
  stepNumText: { fontFamily: fonts.sansSemiBold, fontSize: 11 },
  atsBox: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 14 },
  atsTitle: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 22, marginBottom: 8 },
  atsPara: { flex: 0, marginBottom: 8 },
  atsSub: { fontFamily: fonts.sansSemiBold, fontSize: 13, marginTop: 6, marginBottom: 8 },
  tiers: { flexDirection: 'row', gap: 8, marginTop: 10 },
  tier: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10 },
  tierLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tierLabel: { fontFamily: fonts.sansMedium, fontSize: 11 },
  tierValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 1 },
  tierPrice: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  tierTime: { fontFamily: fonts.sans, fontSize: 11.5 },
  iosNote: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, marginTop: 12 },
  cta: { height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  secondary: { alignItems: 'center', justifyContent: 'center', paddingTop: 10, paddingBottom: 2 },
  secondaryText: { fontFamily: fonts.sansMedium, fontSize: 13 },
  closedTitle: {
    position: 'absolute', left: 24, right: 24, textAlign: 'center',
    fontFamily: fonts.serif, fontSize: 20, lineHeight: 24,
  },
  seal: { position: 'absolute', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  closeWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  closeBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
})
