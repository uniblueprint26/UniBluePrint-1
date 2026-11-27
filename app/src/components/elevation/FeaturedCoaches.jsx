import { useRef, useState } from 'react'
import { View, Text, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { NameWithTick } from '../ui/VerifiedTick'
import { coachDisplayName, coachFirstName, coachTagline } from '../../lib/coachDisplay'
import { pillarTint } from '../../constants/pillarTints'

// Featured coach hero cards: swipe sideways, one coach at a time, snap, the
// neighbours peek in at the edges, dots below. Tall portrait cards (about 3 wide
// to 4.1 high). Each card shows the photo, the name large in the display font with
// the verified tick, and the tagline (the speciality when there is no tagline).

export const HERO_ASPECT = 4.1 / 3

export function CoachHeroCard({ coach, width, aspect = HERO_ASPECT, onPress, style }) {
  const { isDark } = useTheme()
  const height = Math.round(width * aspect)
  const raw = coach.cardImage || coach.heroImage
  const src = typeof raw === 'string' ? { uri: raw } : raw
  const contain = coach.cardFit === 'contain'
  const tint = pillarTint('elevation', isDark)
  const name = coachDisplayName(coach)
  const tagline = coachTagline(coach)
  const big = width >= 220
  const body = (
    <View style={[styles.card, { width, height, borderRadius: 22, backgroundColor: contain ? (coach.cardBg || '#1E1B2E') : '#1E1B2E' }, style]}>
      {src ? (
        <Image
          source={src}
          resizeMode={contain ? 'contain' : 'cover'}
          style={contain ? { position: 'absolute', left: 0, right: 0, top: '14%', height: '56%', width: '100%' } : StyleSheet.absoluteFill}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 64, color: '#FFFFFF', opacity: 0.9 }}>{name.slice(0, 1)}</Text>
        </View>
      )}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.38)', 'rgba(0,0,0,0.82)']}
        locations={[0.38, 0.66, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.text, { padding: big ? 18 : 14 }]}>
        <NameWithTick
          name={name}
          verified={coach.verified !== false}
          color="#FFFFFF"
          tickSize={big ? 20 : 17}
          textStyle={{ fontFamily: fonts.serif, fontSize: big ? 28 : 22, lineHeight: big ? 32 : 26 }}
        />
        {!!tagline && (
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: big ? 13.5 : 12.5, lineHeight: big ? 19 : 17, color: 'rgba(255,255,255,0.92)', marginTop: 6 }} numberOfLines={3}>{tagline}</Text>
        )}
      </View>
    </View>
  )
  if (!onPress) return body
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${name}. ${tagline}. View profile`}>
      {body}
    </Pressable>
  )
}

export default function FeaturedCoaches({ coaches, onOpen }) {
  const { colors } = useTheme()
  const { width } = useWindowDimensions()
  const cardW = Math.min(Math.round(width * 0.68), 300)
  const gap = 12
  const side = Math.round((width - cardW) / 2)
  const [index, setIndex] = useState(0)
  const ref = useRef(null)
  if (!coaches || coaches.length === 0) return null
  const current = coaches[Math.min(index, coaches.length - 1)]
  const first = index === 0 && current.id === coaches[0].id

  return (
    <View>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardW + gap}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={e => setIndex(Math.max(0, Math.min(coaches.length - 1, Math.round(e.nativeEvent.contentOffset.x / (cardW + gap)))))}
        contentContainerStyle={{ paddingHorizontal: side, columnGap: gap }}
        accessibilityLabel="Featured coaches, swipe sideways"
      >
        {coaches.map((c, i) => (
          <View key={c.id} style={{ opacity: i === index ? 1 : 0.72 }}>
            <CoachHeroCard coach={c} width={cardW} onPress={() => onOpen(c)} />
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {coaches.map((c, i) => (
          <View key={c.id} style={[styles.dot, { backgroundColor: i === index ? colors.textPrimary : colors.border, width: i === index ? 18 : 6 }]} />
        ))}
      </View>

      <Pressable
        onPress={() => onOpen(current)}
        accessibilityRole="button"
        accessibilityLabel={first ? `Meet ${coachFirstName(current)}` : `View profile of ${coachDisplayName(current)}`}
        style={[styles.btn, { width: cardW, backgroundColor: colors.accentBg }]}
      >
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: colors.accentFg }}>{first ? `Meet ${coachFirstName(current)}` : 'View profile'}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  text: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16, minHeight: 10 },
  dot: { height: 6, borderRadius: 3 },
  btn: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: 14, marginTop: 16 },
})
