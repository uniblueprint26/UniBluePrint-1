import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronRight } from 'lucide-react-native'
import { colors, fonts, radius, shadows } from '../../constants/theme'

// ─── Home dashboard "Spotlight" carousel ──────────────────────────────────
//
// The founder's own words: the old Home feed leaned on "two random deals
// that aren't even real". This is the replacement — a small, hand-curated
// (featured_content, see lib/featuredContent.js), auto-advancing rotation
// of the app's actual real content: a real Foundation Blueprint service, a
// real coach, a real Lifestyle partner, a real Campus/Course Connect board.
// Every field on a slide is live-resolved, not static copy — see
// fetchSpotlightSlides().
//
// Visual treatment aims at the founder's "studio lighting" brief: a deep
// navy gradient card with a soft gold highlight glancing off one corner
// (the `LinearGradient` overlay below), rather than a flat colour block —
// the same technique WeeklyBlueprintScreen uses for its editorial pages.

const AUTO_ADVANCE_MS = 5500

function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.max(0, Math.min(255, (num >> 16) + amt))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt))
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt))
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`
}

function SlideMedia({ slide }) {
  if (slide.photoUrl) {
    return <Image source={{ uri: slide.photoUrl }} style={styles.mediaPhoto} />
  }
  if (slide.emoji) {
    return (
      <View style={[styles.mediaEmojiWrap, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
        <Text style={styles.mediaEmoji}>{slide.emoji}</Text>
      </View>
    )
  }
  return (
    <View style={[styles.mediaEmojiWrap, { backgroundColor: slide.initBg || 'rgba(201,162,75,0.25)' }]}>
      <Text style={styles.mediaInitials}>{slide.initials || slide.title?.[0] || '★'}</Text>
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
      <LinearGradient
        colors={[shade(colors.navy, -10), colors.navy, shade(colors.navy, 14)]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.slideGradient}
      >
        {/* Soft gold "studio light" glancing off the top-right corner */}
        <View pointerEvents="none" style={styles.lightGlow} />

        <View style={styles.slideTopRow}>
          <Text style={styles.kicker}>{slide.kicker?.toUpperCase()}</Text>
          <SlideMedia slide={slide} />
        </View>

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

const SLIDE_HEIGHT = 172

const styles = StyleSheet.create({
  scroller: { borderRadius: radius.card, overflow: 'hidden' },
  slideOuter: { height: SLIDE_HEIGHT, ...shadows.elevated },
  slideGradient: {
    flex: 1, padding: 16, justifyContent: 'space-between', overflow: 'hidden',
  },
  lightGlow: {
    position: 'absolute', top: -60, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(228,199,126,0.16)',
  },
  slideTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  kicker: {
    fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 1.1,
    color: colors.gold,
  },
  slideTitle: {
    fontFamily: fonts.serif, fontSize: 22, color: colors.cream,
    marginTop: 10, lineHeight: 25,
  },
  slideSubtitle: {
    fontFamily: fonts.sans, fontSize: 12, color: 'rgba(245,240,232,0.78)',
    marginTop: 4, lineHeight: 17,
  },
  slideMeta: {
    fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.goldLight,
    marginTop: 6,
  },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.gold },

  mediaPhoto: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, borderColor: 'rgba(245,240,232,0.35)',
  },
  mediaEmojiWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(245,240,232,0.2)',
  },
  mediaEmoji: { fontSize: 20 },
  mediaInitials: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.cream },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(30,58,95,0.18)' },
  dotActive: { backgroundColor: colors.gold, width: 16 },
})
