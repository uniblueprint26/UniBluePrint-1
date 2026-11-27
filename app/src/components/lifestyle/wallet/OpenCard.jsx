import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View, Text, Image, ScrollView, Pressable, Animated, PanResponder, Platform, Linking, Share,
  StyleSheet, useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X, RotateCcw, MapPin, Send, Flag, Check, Maximize2, ChevronRight } from 'lucide-react-native'
import { fonts } from '../../../constants/theme'
import { useTheme } from '../../../context/ThemeContext'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import { useReport } from '../../safety/ReportProvider'
import { SITE_URL } from '../../../constants/site'
import { cleanCopy } from '../../../lib/plainCopy'
import { memberCode } from '../../../lib/memberCode'
import { useWallet } from '../../../lib/walletStore'
import { endsTag, tint, withAlpha } from '../../../data/partnerCards'
import BankCard, { cardSize } from './BankCard'
import CardBack from './CardBack'
import CodeArea from './CodeArea'
import Confetti from './Confetti'
import PartnerLinks from './PartnerLinks'
import QrCode from './QrCode'
import { useCardMotion } from './useCardMotion'
import * as haptic from './haptics'

// The open card, Apple Pay style. It rises from its place in the wallet to the
// top, settles, and the details slide in under it. Drag the card down and it peels
// back into the stack with a spring. The open card is the same landscape bank card.
// It never gets taller.
//
// Easter eggs (cosmetic, no prizes, one subtle hint each, shown once):
//   1 scratch or hold to reveal   2 tilt far for the hidden slogan
//   3 double tap the logo         4 shake to flip
//   5 tap the wave                6 peel back by dragging down

const NATIVE = Platform.OS !== 'web'
const HINTS = [
  { key: 'scratch', text: 'Scratch to reveal your code', when: ctx => !ctx.scratched },
  { key: 'hold', text: 'Press and hold to reveal', when: ctx => ctx.scratched },
  { key: 'tilt', text: 'Tilt for a hidden message', when: ctx => NATIVE && !ctx.reduced },
  { key: 'logo', text: 'Double tap the logo', when: () => true },
  { key: 'shake', text: 'Shake your phone to flip the card', when: ctx => NATIVE && !ctx.reduced },
  { key: 'wave', text: 'Tap the wave. Drag down to close', when: () => true },
]

function directionsUrl(partner, cfg) {
  const q = encodeURIComponent(cfg.address || `${partner.brand}, ${partner.county || partner.counties?.[0] || 'Ireland'}, Ireland`)
  if (Platform.OS === 'ios') return `http://maps.apple.com/?q=${q}`
  if (Platform.OS === 'android') return `geo:0,0?q=${q}`
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

function ActionRow({ Icon, label, onPress, colors, done, primary, accessibilityLabel }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={[
        styles.action,
        primary
          ? { backgroundColor: colors.accentBg, borderColor: colors.accentBg }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {done ? <Check size={18} color={primary ? colors.accentFg : colors.textPrimary} /> : <Icon size={18} color={primary ? colors.accentFg : colors.textPrimary} strokeWidth={1.9} />}
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: primary ? colors.accentFg : colors.textPrimary }}>{label}</Text>
    </Pressable>
  )
}

// A full screen version of the card to show at a till.
function TillView({ partner, cfg, code, revealed, onClose }) {
  const fg = cfg.textColor
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: cfg.brandColor, zIndex: 60, alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close the till view" />
      <Text style={{ fontFamily: fonts.serif, fontSize: 40, color: fg, textAlign: 'center' }}>{partner.brand}</Text>
      <View style={[styles.till, { borderColor: withAlpha(fg, 0.6) }]}>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 18, color: fg }}>{cfg.discountLabel}</Text>
      </View>
      <View style={styles.tillQr}>
        {revealed ? <QrCode value={code.full} size={200} /> : <Text style={{ fontFamily: fonts.sansMedium, color: '#444', textAlign: 'center' }}>Scratch your code on the card first.</Text>}
      </View>
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 28, letterSpacing: 3, color: fg, marginTop: 20 }}>{revealed ? code.full : code.masked}</Text>
      <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: fg, opacity: 0.9, marginTop: 14, textAlign: 'center' }}>{cleanCopy(cfg.claimText)}</Text>
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: fg, opacity: 0.7, marginTop: 28 }}>Tap anywhere to close</Text>
    </View>
  )
}

export default function OpenCard({ partner, cfg, originY = 0, onClose, onViewProfile }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { width: winW, height: winH } = useWindowDimensions()
  const reduced = useReducedMotion()
  const wallet = useWallet()
  const { openReport } = useReport()

  const cardW = Math.min(winW - 32, 440)
  const { w, h, s } = cardSize(cardW)
  const x = Math.round((winW - w) / 2)
  const topY = insets.top + 58

  const scratched = !!wallet.scratched[partner.id]
  const code = useMemo(() => memberCode(wallet.userId, partner.id), [wallet.userId, partner.id])
  const fav = wallet.isFav(partner.id)
  const used = wallet.uses[partner.id] || 0
  const tag = endsTag(cfg.endsOn)
  const blocks = cfg.openCardBlocks || ['links']
  const photos = cfg.photos || []

  const [flipped, setFlipped] = useState(false)
  const [till, setTill] = useState(false)
  const [hint, setHint] = useState(null)
  const [burst, setBurst] = useState(0)
  const [counted, setCounted] = useState(false)

  const peelTo = originY - topY
  const rise = useRef(new Animated.Value(reduced ? 0 : peelTo)).current
  const drag = useRef(new Animated.Value(0)).current
  const dim = useRef(new Animated.Value(0)).current
  const detail = useRef(new Animated.Value(0)).current
  const flip = useRef(new Animated.Value(0)).current
  const secret = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(0)).current
  const cardFade = useRef(new Animated.Value(reduced ? 0 : 1)).current
  const closing = useRef(false)
  const logoTaps = useRef(0)
  const logoTimer = useRef(null)
  const tilted = useRef(false)

  // Open: rise, settle, then the details slide in.
  useEffect(() => {
    if (reduced) {
      Animated.parallel([
        Animated.timing(dim, { toValue: 1, duration: 200, useNativeDriver: NATIVE }),
        Animated.timing(cardFade, { toValue: 1, duration: 220, useNativeDriver: NATIVE }),
        Animated.timing(detail, { toValue: 1, duration: 260, delay: 120, useNativeDriver: NATIVE }),
      ]).start()
      return
    }
    Animated.parallel([
      Animated.timing(dim, { toValue: 1, duration: 240, useNativeDriver: NATIVE }),
      Animated.spring(rise, { toValue: 0, speed: 11, bounciness: 7, useNativeDriver: NATIVE }),
    ]).start(() => {
      Animated.timing(detail, { toValue: 1, duration: 260, useNativeDriver: NATIVE }).start()
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // One subtle hint, once. The next unseen one each time a card is opened.
  const hintDone = useRef(false)
  useEffect(() => {
    if (hintDone.current || !wallet.ready) return
    hintDone.current = true
    const next = HINTS.find(hh => !wallet.hints[hh.key] && hh.when({ scratched, reduced }))
    if (next) { setHint(next.text); wallet.markHint(next.key) }
  }, [wallet.ready]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimeout(logoTimer.current), [])

  const close = useCallback((viaPeel = false) => {
    if (closing.current) return
    closing.current = true
    if (viaPeel) wallet.findSecret(6)
    if (reduced) {
      Animated.parallel([
        Animated.timing(dim, { toValue: 0, duration: 180, useNativeDriver: NATIVE }),
        Animated.timing(cardFade, { toValue: 0, duration: 180, useNativeDriver: NATIVE }),
        Animated.timing(detail, { toValue: 0, duration: 120, useNativeDriver: NATIVE }),
      ]).start(() => onClose?.())
      return
    }
    Animated.timing(detail, { toValue: 0, duration: 120, useNativeDriver: NATIVE }).start()
    Animated.parallel([
      Animated.spring(drag, { toValue: peelTo, speed: 12, bounciness: 8, useNativeDriver: NATIVE }),
      Animated.timing(dim, { toValue: 0, duration: 260, useNativeDriver: NATIVE }),
    ]).start(() => onClose?.())
  }, [reduced, peelTo, onClose]) // eslint-disable-line react-hooks/exhaustive-deps

  const closeRef = useRef(close)
  closeRef.current = close

  // Drag the card down to peel it back into the stack.
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 10 && Math.abs(g.dy) > Math.abs(g.dx) * 1.4,
    onPanResponderMove: (_, g) => { if (!closing.current) drag.setValue(Math.max(0, g.dy)) },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 90 || g.vy > 0.8) closeRef.current(true)
      else Animated.spring(drag, { toValue: 0, speed: 14, bounciness: 8, useNativeDriver: NATIVE }).start()
    },
    onPanResponderTerminate: () => Animated.spring(drag, { toValue: 0, useNativeDriver: NATIVE }).start(),
  })).current

  // Flip.
  const doFlip = useCallback((to) => {
    const target = typeof to === 'boolean' ? (to ? 1 : 0) : (flipped ? 0 : 1)
    setFlipped(target === 1)
    Animated.timing(flip, { toValue: target, duration: reduced ? 180 : 480, useNativeDriver: NATIVE }).start()
  }, [flipped, reduced, flip])

  // Tilt and shake (phone only, off with reduced motion).
  const onTiltFar = useCallback(() => {
    if (flipped) return
    wallet.findSecret(2)
    tilted.current = true
    Animated.sequence([
      Animated.timing(secret, { toValue: 1, duration: 420, useNativeDriver: NATIVE }),
      Animated.delay(2600),
      Animated.timing(secret, { toValue: 0, duration: 600, useNativeDriver: NATIVE }),
    ]).start()
  }, [flipped, wallet, secret])
  const onShake = useCallback(() => { wallet.findSecret(4); haptic.medium(); doFlip() }, [wallet, doFlip])
  const { tilt } = useCardMotion({ enabled: !reduced && !till, onTiltFar, onShake })

  function onWave() {
    haptic.tick()
    wallet.findSecret(5)
    pulse.setValue(0)
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 140, useNativeDriver: NATIVE }),
      Animated.timing(pulse, { toValue: 0, duration: 260, useNativeDriver: NATIVE }),
    ]).start()
  }

  function onLogo() {
    logoTaps.current += 1
    clearTimeout(logoTimer.current)
    if (logoTaps.current >= 2) {
      logoTaps.current = 0
      haptic.light()
      wallet.findSecret(3)
      setBurst(b => b + 1)
      return
    }
    logoTimer.current = setTimeout(() => { logoTaps.current = 0 }, 380)
  }

  function onScratched() { wallet.markScratched(partner.id); wallet.findSecret(1) }
  function onHoldReveal() { wallet.findSecret(1) }

  function shareFriend() {
    Share.share({
      message: `Check out the UBP Discount at ${partner.brand} on UniBlueprint. ${SITE_URL}`,
    }).catch(() => {})
  }
  function iUsedThis() {
    if (counted) return
    wallet.addUse(partner.id)
    haptic.done()
    setCounted(true)
    setTimeout(() => setCounted(false), 2500)
  }
  function report() {
    openReport({ contentType: 'lifestyle_partner', contentId: partner.id, noun: 'deal' })
  }

  const chips = [
    partner.county || (partner.counties || []).join(', ') || null,
    cleanCopy(partner.category),
  ].filter(Boolean)

  // ─── photo strip ───────────────────────────────────────────────────────────
  const itemW = Math.round(w * 0.46)
  const itemH = Math.round(itemW * 1.25)
  const [photoIdx, setPhotoIdx] = useState(0)

  const frontOpacity = reduced ? flip.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) : 1
  const backOpacity = reduced ? flip : 1
  const frontRot = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })
  const backRot = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] })

  const cardTransform = [{ translateY: Animated.add(rise, drag) }]

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]} pointerEvents="auto">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, opacity: dim }]} />

      {/* Close, always available (the drag down is a bonus) */}
      <Animated.View style={{ position: 'absolute', top: insets.top + 6, left: 8, opacity: detail }}>
        <Pressable onPress={() => close(false)} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close the card">
          <X size={22} color={colors.textPrimary} />
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary }}>Close</Text>
        </Pressable>
      </Animated.View>

      {/* The card */}
      <Animated.View
        {...pan.panHandlers}
        style={{ position: 'absolute', left: x, top: topY, width: w, height: h, opacity: cardFade, transform: cardTransform }}
      >
        <Animated.View
          pointerEvents={flipped ? 'none' : 'auto'}
          style={[styles.face, { opacity: frontOpacity, transform: reduced ? [] : [{ perspective: 1200 }, { rotateY: frontRot }] }]}
        >
          <BankCard
            partner={partner}
            cfg={cfg}
            width={w}
            variant="open"
            favorited={fav}
            onToggleFav={() => wallet.toggleFav(partner.id)}
            onWavePress={onWave}
            onLogoPress={onLogo}
            sheen={tilt}
            secret={secret}
            pulse={pulse}
            regular={wallet.isRegular(partner.id)}
            tag={tag}
            chips={chips}
            codeArea={(
              <CodeArea code={code} scratched={scratched} onScratched={onScratched} onHoldReveal={onHoldReveal} color={cfg.textColor} s={s} reducedMotion={reduced} />
            )}
            overlay={<Confetti colors={[cfg.brandColor, cfg.textColor, tint(cfg.brandColor, 0.5), '#FFFFFF']} width={w} height={h} reducedMotion={reduced} burstKey={burst} />}
          />
        </Animated.View>
        <Animated.View
          pointerEvents={flipped ? 'auto' : 'none'}
          style={[styles.face, styles.back, { opacity: backOpacity, transform: reduced ? [] : [{ perspective: 1200 }, { rotateY: backRot }] }]}
        >
          <CardBack partner={partner} cfg={cfg} width={w} code={code} revealed={scratched} todaySpecial={cfg.todaySpecial} />
        </Animated.View>
      </Animated.View>

      {/* Details under the card */}
      <Animated.View
        style={{
          position: 'absolute', left: 0, right: 0, top: topY + h + 10, bottom: 0, opacity: detail,
          transform: [{ translateY: detail.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        }}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: x, paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hintRow}>
            <Text style={[styles.hint, { color: colors.textSecondary }]} numberOfLines={2}>{hint || ' '}</Text>
            <Pressable
              onPress={() => doFlip()}
              hitSlop={6}
              style={[styles.flipBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              accessibilityRole="button"
              accessibilityLabel={flipped ? 'Show the front of the card' : 'Show the back of the card'}
            >
              <RotateCcw size={15} color={colors.textPrimary} />
              <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary }}>{flipped ? 'Front' : 'Back'}</Text>
            </Pressable>
          </View>

          {flipped ? (
            <View style={{ gap: 10, marginTop: 4 }}>
              <ActionRow Icon={MapPin} label="Get directions" colors={colors} onPress={() => Linking.openURL(directionsUrl(partner, cfg))} />
              <ActionRow Icon={Send} label="Send to a friend" colors={colors} onPress={shareFriend} />
              <ActionRow Icon={Flag} label="Report a problem" colors={colors} onPress={report} />
              <ActionRow Icon={Check} label={counted ? 'Counted' : 'I used this deal'} colors={colors} primary done={counted} onPress={iUsedThis} accessibilityLabel="I used this deal" />
              {used > 0 && <Text style={[styles.small, { color: colors.textSecondary }]}>You have used this deal {used} {used === 1 ? 'time' : 'times'}.</Text>}
            </View>
          ) : (
            <View style={{ gap: 14, marginTop: 2 }}>
              {photos.length > 0 && (
                <View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={itemW + 10}
                    decelerationRate="fast"
                    onScroll={e => setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / (itemW + 10)))}
                    scrollEventThrottle={32}
                    accessibilityLabel={`${partner.brand} photos, swipe for more`}
                    contentContainerStyle={{ gap: 10, paddingRight: 12 }}
                    style={{ marginHorizontal: 0 }}
                  >
                    {photos.map((p, i) => (
                      <Image key={i} source={typeof p === 'string' ? { uri: p } : p} resizeMode="cover" style={{ width: itemW, height: itemH, borderRadius: 14, backgroundColor: colors.surfaceSunk }} />
                    ))}
                  </ScrollView>
                  {photos.length > 1 && (
                    <View style={styles.dots}>
                      {photos.map((_, i) => (
                        <View key={i} style={[styles.dot, { backgroundColor: i === Math.min(photoIdx, photos.length - 1) ? colors.textPrimary : colors.border, width: i === Math.min(photoIdx, photos.length - 1) ? 16 : 6 }]} />
                      ))}
                    </View>
                  )}
                </View>
              )}

              {blocks.includes('claim') && (
                <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.blockLabel, { color: colors.textSecondary }]}>How to claim</Text>
                  <Text style={[styles.blockText, { color: colors.textPrimary }]}>{cleanCopy(cfg.claimText)}</Text>
                </View>
              )}
              {blocks.includes('where') && (
                <View style={[styles.block, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.blockLabel, { color: colors.textSecondary }]}>Where</Text>
                  <Text style={[styles.blockText, { color: colors.textPrimary }]}>{partner.county || (partner.counties || []).join(', ') || 'Ireland'}</Text>
                  {!!cfg.address && <Text style={[styles.blockText, { color: colors.textPrimary, marginTop: 2 }]}>{cleanCopy(cfg.address)}</Text>}
                  {!!cfg.hours && <Text style={[styles.blockSub, { color: colors.textSecondary }]}>{cleanCopy(cfg.hours)}</Text>}
                </View>
              )}
              {blocks.includes('links') && <PartnerLinks partner={partner} />}
              {blocks.includes('showAtTill') && (
                <ActionRow Icon={Maximize2} label="Show at the till" colors={colors} onPress={() => setTill(true)} />
              )}

              <Pressable
                onPress={() => onViewProfile?.(partner.id)}
                accessibilityRole="button"
                accessibilityLabel={`View profile of ${partner.brand}`}
                style={[styles.profileBtn, { backgroundColor: colors.accentBg }]}
              >
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: colors.accentFg }}>View profile</Text>
                <ChevronRight size={18} color={colors.accentFg} />
              </Pressable>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {till && <TillView partner={partner} cfg={cfg} code={code} revealed={scratched} onClose={() => setTill(false)} />}
    </View>
  )
}

const styles = StyleSheet.create({
  face: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backfaceVisibility: 'hidden' },
  back: {},
  closeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: 10 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, marginBottom: 4 },
  hint: { flex: 1, fontFamily: fonts.serifItalic, fontSize: 13.5, lineHeight: 18 },
  flipBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  action: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 50, borderRadius: 14, borderWidth: 1 },
  profileBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 54, borderRadius: 14 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { height: 6, borderRadius: 3 },
  block: { borderRadius: 14, borderWidth: 1, padding: 14 },
  blockLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  blockText: { fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 21 },
  blockSub: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, marginTop: 4 },
  small: { fontFamily: fonts.sans, fontSize: 12.5, textAlign: 'center' },
  till: { borderWidth: 1.5, borderRadius: 99, paddingHorizontal: 18, paddingVertical: 6, marginTop: 14 },
  tillQr: { marginTop: 24, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, minWidth: 120, minHeight: 80, alignItems: 'center', justifyContent: 'center' },
})
