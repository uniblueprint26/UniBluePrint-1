import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronRight } from 'lucide-react-native'
import { colors, fonts, radius, shadows } from '../../constants/theme'
import { PartnerHeroImage } from '../lifestyle/PartnerCards'

// ─── Home dashboard "Trending Right Now" carousel ─────────────────────────
//
// The founder's own words: the old Home feed leaned on "two random deals
// that aren't even real". This is the replacement — a hand-curated
// (featured_content, see lib/featuredContent.js), auto-advancing rotation
// of the app's actual real content: a real Foundation Blueprint service, a
// real coach, a real Lifestyle partner, a real Campus/Course Connect board.
// Every field on a slide is live-resolved, not static copy — see
// fetchSpotlightSlides(), which now also rotates a capped 2-3 item window
// per category rather than dumping every pinned item on Home at once.
//
// Phase 20: promoted from a small strip under Quick Access to Home's visual
// anchor — a big, letterboxed photo up top (reusing PartnerCards'
// PartnerHeroImage, the same aspect-ratio-safe, never-cropped frame used
// for Lifestyle partner photos) with the navy "studio lighting" caption
// panel from the original design underneath it, rather than a small corner
// chip. A photo, wherever it comes from — a bundled coach/partner
// require()'d asset or a founder-uploaded Storage URL — is always shown
// full-frame via resizeMode 'contain', never cropped to fit.
//
// Visual treatment aims at the founder's "studio lighting" brief: a deep
// navy gradient caption panel with a soft gold highlight glancing off one
// corner (the `LinearGradient` overlay below), rather than a flat colour
// block — the same technique WeeklyBlueprintScreen uses for its editorial
// pages.

const AUTO_ADVANCE_MS = 5500
const HERO_ASPECT_RATIO = 16 / 10

function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.max(0, Math.min(255, (num >> 16) + amt))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt))
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt))
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`
}

// Big hero visual up top — a real photo (PartnerHeroImage's cream-letterbox,
// resizeMode 'contain' frame, so it's never cropped) when the slide has one,
// or a large emoji/initials treatment on a tinted panel of the same aspect
// ratio when it doesn't, so every slide holds the same overall height.
function SlideHero({ slide }) {
  if (slide.photoUrl) {
    // photoUrl is either a remote URL string (a founder-uploaded photo/logo)
    // or a local require()'d image module (a bundled coach/partner hero
    // shot) — PartnerHeroImage already handles both source shapes.
    return (
      <PartnerHeroImage
        source={slide.photoUrl}
        aspectRatio={HERO_ASPECT_RATIO}
        style={styles.heroFrame}
      />
    )
  }
  const tint = slide.initBg ? shade(slide.initBg, -20) : shade(colors.navy, -6)
  return (
    <View style={[styles.heroFallback, { backgroundColor: tint }]}>
      {slide.emoji ? (
        <Text style={styles.heroFallbackEmoji}>{slide.emoji}</Text>
      ) : (
        <Text style={styles.heroFallbackInitials}>{slide.initials || slide.title?.[0] || '★'}</Text>
      )}
    </View>
  )
}

function Slide({ slide, width, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[styles.slideOuter, { width }]}
      accessibilityRole="button"
      accessibilityLabel={`${slide.title}, ${slide.ctaLabel}`}
    >
      <View style={styles.slideCard}>
        <SlideHero slide={slide} />

        <LinearGradient
          colors={[shade(colors.navy, -10), colors.navy, shade(colors.navy, 14)]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.captionArea}
        >
          {/* Soft gold "studio light" glancing off the top-right corner */}
          <View pointerEvents="none" style={styles.lightGlow} />

          <Text style={styles.kicker}>{slide.kicker?.toUpperCase()}</Text>
          <Text style={styles.slideTitle} numberOfLines={2}>{slide.title}</Text>
          {!!slide.subtitle && (
            <Text style={styles.slideSubtitle} numberOfLines={2}>{slide.subtitle}</Text>
          )}
          {!!(slide.priceLabel || slide.body) && (
            <Text style={styles.slideMeta} numberOfLines={1}>{slide.priceLabel || slide.body}</Text>
          )}

          <View style={styles.ctaRow}>
            <Text style={styles.ctaText}>{slide.ctaLabel}</Text>
            <ChevronRight size={14} color={colors.gold} strokeWidth={2.4} />
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  )
}

export default function SpotlightCarousel({ slides, onSlidePress }) {
  const [containerWidth, setContainerWidth] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef(null)
  const indexRef = useRef(0)
  const interactingRef = useRef(false)

  // Auto-advance, paused while the user has a finger on the carousel — a
  // manual swipe always wins, per spec ("manual swipe override").
  useEffect(() => {
    if (slides.length < 2 || containerWidth === 0) return
    const id = setInterval(() => {
      if (interactingRef.current) return
      const next = (indexRef.current + 1) % slides.length
      scrollRef.current?.scrollTo({ x: next * containerWidth, animated: true })
      indexRef.current = next
      setActiveIndex(next)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [slides.length, containerWidth])

  function goTo(i) {
    indexRef.current = i
    setActiveIndex(i)
    scrollRef.current?.scrollTo({ x: i * containerWidth, animated: true })
  }

  function onMomentumEnd(e) {
    interactingRef.current = false
    if (containerWidth === 0) return
    const idx = Math.round(e.nativeEvent.contentOffset.x / containerWidth)
    indexRef.current = idx
    setActiveIndex(idx)
  }

  if (slides.length === 0) return null

  return (
    <View onLayout={e => setContainerWidth(e.nativeEvent.layout.width)}>
      {containerWidth > 0 && (
        <>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={() => { interactingRef.current = true }}
            onMomentumScrollEnd={onMomentumEnd}
            style={styles.scroller}
          >
            {slides.map(slide => (
              <Slide
                key={slide.id}
                slide={slide}
                width={containerWidth}
                onPress={() => onSlidePress(slide)}
              />
            ))}
          </ScrollView>

          {slides.length > 1 && (
            <View style={styles.dots}>
              {slides.map((s, i) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => goTo(i)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Show slide ${i + 1}`}
                >
                  <View style={[styles.dot, i === activeIndex && styles.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  scroller: { borderRadius: radius.card + 4, overflow: 'hidden' },
  slideOuter: { ...shadows.elevated },
  // Outer card clips both the hero photo (top) and the caption panel
  // (bottom) to one shared, slightly larger radius than a normal card —
  // this is Home's visual anchor now, so it reads a step above a regular
  // Card. Height is never fixed: it's the natural sum of the hero's
  // aspect-ratio box (HERO_ASPECT_RATIO, same width every slide) plus the
  // caption panel's own content, so every slide in the row lines up.
  slideCard: {
    borderRadius: radius.card + 4, overflow: 'hidden', backgroundColor: colors.navy,
  },
  // Hero frame — PartnerHeroImage supplies the aspect-ratio box, cream
  // letterbox fill, and resizeMode 'contain'; this just removes its own
  // corner radius so the outer card's radius is the only one that shows.
  heroFrame: { borderRadius: 0 },
  // Same aspect ratio as the photo frame (not a fixed height) so a
  // no-photo slide (emoji/initials) still lines up with its photo-bearing
  // neighbours as the carousel auto-advances.
  heroFallback: {
    width: '100%', aspectRatio: HERO_ASPECT_RATIO,
    alignItems: 'center', justifyContent: 'center',
  },
  heroFallbackEmoji: { fontSize: 52 },
  heroFallbackInitials: {
    fontFamily: fonts.sansBold, fontSize: 44, color: 'rgba(245,240,232,0.85)', letterSpacing: 1,
  },
  captionArea: {
    padding: 18, paddingTop: 15, overflow: 'hidden',
  },
  lightGlow: {
    position: 'absolute', top: -60, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(228,199,126,0.16)',
  },
  kicker: {
    fontFamily: fonts.sansSemiBold, fontSize: 10.5, letterSpacing: 1.2,
    color: colors.gold,
  },
  slideTitle: {
    fontFamily: fonts.serif, fontSize: 24, color: colors.cream,
    marginTop: 8, lineHeight: 27,
  },
  slideSubtitle: {
    fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.78)',
    marginTop: 5, lineHeight: 18,
  },
  slideMeta: {
    fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.goldLight,
    marginTop: 7,
  },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 13 },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.gold },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(30,58,95,0.18)' },
  dotActive: { backgroundColor: colors.gold, width: 16 },
})
