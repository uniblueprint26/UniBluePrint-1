import { memo, useRef, useState } from 'react'
import { View, Text, Image, Pressable, Animated, Platform, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Heart } from 'lucide-react-native'
import Svg, { Path } from 'react-native-svg'
import { fonts } from '../../../constants/theme'
import { NameWithTick } from '../../ui/VerifiedTick'
import { blendKind, tint, withAlpha } from '../../../data/partnerCards'
import { cleanCopy } from '../../../lib/plainCopy'

// The Lifestyle discount card. Always the real bank card shape: width to height
// 1.586 (85.6 by 54), corners about 5 percent of the width, never taller.
// It is a discount display card only. It shows a member code, never a card number.
//
// variant 'stack'  the card in the wallet. Only its top strip shows, the next card overlaps the rest.
// variant 'open'   the full face with the member code area and detail chips.
// variant 'static' the full face with no code area (Home Spotlight, previews).

export const CARD_RATIO = 1.586
export const STRIP_BASE = 112

export function cardSize(width) {
  const w = Math.round(width)
  const s = w / 358
  return { w, h: Math.round(w / CARD_RATIO), radius: Math.round(w * 0.05), s, strip: Math.round(STRIP_BASE * s) }
}

const web = Platform.OS === 'web'
const invertFilter = web ? 'invert(1)' : [{ invert: 1 }]

// The offer pill is one line. Longer offers get a slightly smaller font so a word is
// never cut. On iOS and Android adjustsFontSizeToFit is the safety net.
function pillFont(label) {
  const n = String(label).length
  return n > 20 ? 9.5 : n > 15 ? 10 : 11
}

function nameFont(name, s) {
  const n = String(name).length
  const px = n <= 13 ? 23 : n <= 17 ? 20 : 17.5
  return Math.round(px * s * 10) / 10
}

// ─── Faint tiled logo (or initials) across the card ──────────────────────────
const Pattern = memo(function Pattern({ cfg, w, h }) {
  if (cfg.cardStyle === 'mono') return null
  const dark = blendKind(cfg.brandColor) === 'dark'
  const blend = dark
    ? { mixBlendMode: 'screen', filter: invertFilter, opacity: 0.1 }
    : { mixBlendMode: 'multiply', opacity: 0.13 }
  const cw = Math.round(w * 1.55)
  const ch = Math.round(h * 1.8)
  const base = { position: 'absolute', width: cw, height: ch, left: -Math.round((cw - w) / 2), top: -Math.round((ch - h) / 2), transform: [{ rotate: '-14deg' }] }
  if (cfg.logo) {
    const size = Math.round(w * (web ? 0.12 : 0.2))
    const gap = Math.round(size * 0.7)
    const cols = Math.ceil(cw / (size + gap)) + 1
    const rows = Math.ceil(ch / (size + gap)) + 1
    const items = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        items.push(
          <Image
            key={`${r}-${c}`}
            source={cfg.logo}
            resizeMode="contain"
            style={{ position: 'absolute', width: size, height: size, left: c * (size + gap) + (r % 2 ? (size + gap) / 2 : 0), top: r * (size + gap) }}
          />,
        )
      }
    }
    return <View pointerEvents="none" style={[base, blend]}>{items}</View>
  }
  const line = `${cfg.initials}   `.repeat(14)
  const text = Array.from({ length: 9 }, (_, i) => (i % 2 ? '  ' : '') + line).join('\n')
  return (
    <View pointerEvents="none" style={[base, { opacity: 0.07 }]}>
      <Text style={{ fontFamily: fonts.sansBold, fontSize: Math.round(w * 0.06), lineHeight: Math.round(w * 0.1), letterSpacing: 4, color: cfg.textColor }}>{text}</Text>
    </View>
  )
})

// ─── One large faint watermark, top right ────────────────────────────────────
const Watermark = memo(function Watermark({ cfg, w, h }) {
  const size = Math.round(w * 0.64)
  const pos = { position: 'absolute', right: -Math.round(w * 0.1), top: -Math.round(h * 0.16), width: size, height: size, alignItems: 'center', justifyContent: 'center' }
  if (cfg.logo) {
    const dark = blendKind(cfg.brandColor) === 'dark'
    const blend = dark
      ? { mixBlendMode: 'screen', filter: invertFilter, opacity: 0.12 }
      : { mixBlendMode: 'multiply', opacity: 0.2 }
    return <Image pointerEvents="none" source={cfg.logo} resizeMode="contain" style={[pos, blend]} />
  }
  return (
    <View pointerEvents="none" style={[pos, { opacity: 0.1 }]}>
      <Text style={{ fontFamily: fonts.serif, fontSize: Math.round(w * 0.36), color: cfg.textColor }}>{cfg.initials}</Text>
    </View>
  )
})

// ─── UBP chip mark and contactless wave ──────────────────────────────────────
export function ChipMark({ color, s = 1 }) {
  return (
    <View style={[styles.chipMark, { borderColor: withAlpha(color, 0.55), borderRadius: Math.round(6 * s) }]}>
      <View style={{ width: 12 * s, height: 9 * s, borderRadius: 2, backgroundColor: withAlpha(color, 0.25) }} />
      <Text style={{ fontFamily: fonts.sansBold, fontSize: Math.max(8.5, 9 * s), letterSpacing: 0.8, color }}>UBP</Text>
    </View>
  )
}

export function WaveMark({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
      <Path d="M8 7c2 3 2 7 0 10" />
      <Path d="M12 5c3 4 3 10 0 14" />
      <Path d="M16 3c4 5 4 13 0 18" />
    </Svg>
  )
}

function BankCardBase({
  partner, cfg, width, variant = 'stack', favorited = false, onToggleFav, onWavePress, onLogoPress,
  sheen, secret, pulse, regular = false, tag = null, codeArea = null, chips = null, overlay = null, hideHeart = false,
}) {
  const { w, h, radius, s } = cardSize(width)
  const fg = cfg.textColor
  const open = variant === 'open'
  const light = blendKind(cfg.brandColor) === 'light'
  const pad = Math.round(14 * s)
  const logoSize = Math.round(52 * s)
  const nameLeft = pad + logoSize + 8 + Math.round(12 * s)
  const rightCol = Math.round(98 * s)
  const nameRight = rightCol
  const slogan = cleanCopy(cfg.slogan)
  const [logoFailed, setLogoFailed] = useState(false)
  const [artFailed, setArtFailed] = useState(false)
  const useArt = !!cfg.art && !artFailed
  const showLogo = !!cfg.logo && !logoFailed
  const tileBg = (cfg.logo && !logoFailed) ? cfg.logoBg : (light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.22)')
  const ringBg = light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.2)'

  return (
    <View
      style={[styles.card, { width: w, height: h, borderRadius: radius, backgroundColor: cfg.brandColor }]}
      accessibilityLabel={`${partner.brand}. ${cfg.discountLabel}`}
    >
      {/* Decoration, clipped to the rounded corners. It carries the brand colour itself so the
          blend modes (multiply, screen) have the colour behind them inside the same group. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden', backgroundColor: cfg.brandColor }]}>
        {useArt ? (
          <Image source={cfg.art} resizeMode="cover" onError={() => setArtFailed(true)} style={StyleSheet.absoluteFill} />
        ) : (
          <>
            {open && <Pattern cfg={cfg} w={w} h={h} />}
            <Watermark cfg={cfg} w={w} h={h} />
            <LinearGradient
              colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.14)']}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </>
        )}
        {open && (
          <Animated.View
            style={[styles.sheen, {
              width: Math.round(w * 0.42), height: Math.round(h * 2), top: -Math.round(h * 0.5),
              transform: [
                { translateX: sheen ? sheen.interpolate({ inputRange: [-1, 1], outputRange: [-w * 0.1, w * 0.8] }) : Math.round(w * 0.52) },
                { rotate: '16deg' },
              ],
            }]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0)', withAlpha(tint(cfg.brandColor, light ? 0.8 : 0.6), light ? 0.4 : 0.3), 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
        {open && secret && (
          <Animated.View pointerEvents="none" style={[styles.secret, { left: pad, right: pad, bottom: Math.round(44 * s), opacity: secret }]}>
            <Text style={[styles.secretText, { color: fg, fontSize: Math.round(13 * s) }]} numberOfLines={2}>{slogan}</Text>
          </Animated.View>
        )}
      </View>

      {/* Logo tile with ring, top left */}
      <View style={{ position: 'absolute', left: pad, top: pad }}>
        <Pressable
          onPress={onLogoPress}
          disabled={!onLogoPress}
          accessibilityRole={onLogoPress ? 'button' : undefined}
          accessibilityLabel={`${partner.brand} logo`}
          style={[styles.ring, { padding: 4, borderRadius: Math.round(18 * s), backgroundColor: ringBg, borderColor: withAlpha(fg, 0.28) }]}
        >
          <View style={{ width: logoSize, height: logoSize, borderRadius: Math.round(14 * s), backgroundColor: tileBg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {showLogo ? (
              <Image source={cfg.logo} resizeMode="contain" onError={() => setLogoFailed(true)} style={{ width: logoSize - 8, height: logoSize - 8 }} />
            ) : (
              <Text style={{ fontFamily: fonts.serif, fontSize: Math.round(20 * s), color: fg }}>{cfg.initials}</Text>
            )}
          </View>
        </Pressable>
        {regular && (
          <View style={[styles.regular, { borderColor: withAlpha(fg, 0.5) }]}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 9.5, color: fg, letterSpacing: 0.3 }}>Regular</Text>
          </View>
        )}
      </View>

      {/* Name, then the pill below it, then the slogan */}
      <View style={{ position: 'absolute', left: nameLeft, top: pad - 1, right: nameRight }}>
        <NameWithTick
          name={partner.brand}
          verified={partner.verified !== false}
          color={fg}
          tickSize={Math.round(17 * s)}
          textStyle={{ fontFamily: fonts.serif, fontSize: nameFont(partner.brand, s), lineHeight: Math.round(nameFont(partner.brand, s) * 1.18) }}
        />
        <View style={styles.pillRow}>
          <View style={[styles.pill, { borderColor: withAlpha(fg, 0.6) }]}>
            <Text
              style={{ fontFamily: fonts.sansBold, fontSize: pillFont(cfg.discountLabel), color: fg, letterSpacing: 0.1 }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              maxFontSizeMultiplier={1.1}
            >{cfg.discountLabel}</Text>
          </View>
          {!!tag && (
            <View style={[styles.pill, { borderColor: withAlpha(fg, 0.35), backgroundColor: withAlpha(fg, 0.1) }]}>
              <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: fg }} numberOfLines={1}>{tag}</Text>
            </View>
          )}
        </View>
        {!!slogan && (
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, lineHeight: 16, color: fg, opacity: 0.92, marginTop: 4 }} numberOfLines={open ? 2 : 1}>{slogan}</Text>
        )}
      </View>

      {/* UBP chip and contactless wave, top right */}
      <View style={[styles.marks, { right: pad - 2, top: pad - 2 }]}>
        <ChipMark color={fg} s={s} />
        <Pressable
          onPress={onWavePress}
          disabled={!onWavePress}
          hitSlop={12}
          accessibilityRole={onWavePress ? 'button' : undefined}
          accessibilityLabel="Contactless wave mark"
        >
          <Animated.View style={pulse ? { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }], opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }) } : null}>
            <WaveMark color={fg} size={Math.round(22 * s)} />
          </Animated.View>
        </Pressable>
      </View>

      {/* Heart, under the marks */}
      {!hideHeart && !!onToggleFav && (
        <Pressable
          onPress={onToggleFav}
          style={[styles.heart, { right: Math.round(6 * s), top: Math.round(38 * s) }]}
          accessibilityRole="button"
          accessibilityLabel={favorited ? `Remove ${partner.brand} from favourites` : `Add ${partner.brand} to favourites`}
          accessibilityState={{ selected: favorited }}
        >
          <Heart size={20} color={fg} fill={favorited ? fg : 'transparent'} strokeWidth={2} />
        </Pressable>
      )}

      {/* Open card only: member code and detail chips */}
      {open && !!codeArea && (
        <View style={{ position: 'absolute', left: pad, top: Math.round(122 * s) }}>{codeArea}</View>
      )}
      {open && !!chips && chips.length > 0 && (
        <View style={[styles.chips, { left: pad, right: pad, bottom: pad }]}>
          {chips.map((c, i) => (
            <View key={i} style={[styles.chip, { borderColor: withAlpha(fg, 0.38), flexShrink: i === chips.length - 1 ? 1 : 0 }]}>
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11, color: fg }} numberOfLines={1}>{c}</Text>
            </View>
          ))}
        </View>
      )}
      {overlay}
    </View>
  )
}

const BankCard = memo(BankCardBase)
export default BankCard

const styles = StyleSheet.create({
  card: {
    shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 9, shadowOffset: { width: 0, height: -3 }, elevation: 4,
  },
  sheen: { position: 'absolute', left: 0 },
  secret: { position: 'absolute' },
  secretText: { fontFamily: fonts.serifItalic, textAlign: 'left' },
  ring: { borderWidth: 1 },
  regular: { marginTop: 5, alignSelf: 'center', borderWidth: 1, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 1 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'nowrap' },
  pill: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3, flexShrink: 1 },
  marks: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 8 },
  heart: { position: 'absolute', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  chipMark: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 3 },
  chips: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
})
