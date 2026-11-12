import { useState, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ChevronLeft, MapPin, Calendar, Disc3, Music2, Guitar, Sparkles, Ticket,
} from 'lucide-react-native'

import { priorityColors as pc, priorityFonts as pf, priorityGenres } from '../constants/priorityTheme'
import { PRIORITY_EVENTS } from '../constants/priorityEvents'

// ─── Priority — UniBlueprint's events arm ──────────────────────────────────
// Demo screen for Ross. Every event listed here is invented demo content
// (see src/constants/priorityEvents.js) — real cities, fake nights, so this
// can never be mistaken for a live booking. Brand treatment is Priority's
// own (dark + gold), deliberately not UBP's navy/cream — see the note at
// the top of priorityTheme.js for exactly what's real vs. a reasonable
// extension made for this demo.

const GENRE_ICON = { house: Disc3, afrobeats: Music2, folk: Guitar }

const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'house',     label: 'House' },
  { key: 'afrobeats', label: 'Afrobeats' },
  { key: 'folk',      label: 'Folk' },
]

function EventCard({ event, onPress }) {
  const genre = priorityGenres[event.genre]
  const GenreIcon = GENRE_ICON[event.genre] || Sparkles
  const fromPrice = Math.min(...event.tiers.map(t => t.price))

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.card}>
      <LinearGradient
        colors={event.flagship
          ? [pc.goldDeep, pc.gold, pc.goldLight]
          : [shade(genre.color, -22), genre.color, shade(genre.color, 20)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardArt}
      >
        <View style={styles.cardArtTopRow}>
          <View style={styles.genrePill}>
            <GenreIcon size={11} color={event.flagship ? pc.bg : '#fff'} strokeWidth={2.2} />
            <Text style={[styles.genrePillText, event.flagship && { color: pc.bg }]}>{genre.tag}</Text>
          </View>
          {event.flagship && (
            <View style={styles.flagshipPill}><Text style={styles.flagshipPillText}>FLAGSHIP LAUNCH</Text></View>
          )}
        </View>
        <GenreIcon size={46} color="rgba(255,255,255,0.22)" strokeWidth={1.3} style={styles.cardArtWatermark} />
        <Text style={[styles.cardArtTitle, event.flagship && { color: pc.bg }]} numberOfLines={2}>{event.title}</Text>
      </LinearGradient>

      <View style={styles.cardBody}>
        <View style={styles.cardMetaRow}>
          <Calendar size={13} color={pc.textMuted} strokeWidth={2} />
          <Text style={styles.cardMetaText}>{event.dateLabel}</Text>
        </View>
        <View style={styles.cardMetaRow}>
          <MapPin size={13} color={pc.textMuted} strokeWidth={2} />
          <Text style={styles.cardMetaText} numberOfLines={1}>{event.venue} · {event.city}</Text>
        </View>
        <View style={styles.cardFooterRow}>
          <Text style={styles.cardPrice}>From €{fromPrice.toFixed(2)}</Text>
          <View style={styles.cardCta}>
            <Ticket size={12} color={pc.bg} strokeWidth={2.4} />
            <Text style={styles.cardCtaText}>Get tickets</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.max(0, Math.min(255, (num >> 16) + amt))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt))
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt))
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`
}

export default function PrioritiesScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [filter, setFilter] = useState('all')

  const events = useMemo(() => {
    if (filter === 'all') return PRIORITY_EVENTS
    return PRIORITY_EVENTS.filter(e => e.genre === filter)
  }, [filter])

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={20} color={pc.textPrimary} strokeWidth={2.2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.brandEyebrow}>UNIBLUEPRINT PRESENTS</Text>
        <Text style={styles.brandTitle}>Priority</Text>
        <Text style={styles.brandSub}>
          House, Afrobeats and Folk nights across Ireland — ticketed through the UBP app.
        </Text>

        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>
            Demo content — every event below is invented for this preview, not a real booking.
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 20 }}
          contentContainerStyle={{ gap: 8, paddingRight: 20 }}
        >
          {FILTERS.map(f => {
            const active = filter === f.key
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.8}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        <View style={styles.grid}>
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => navigation.navigate('PriorityEvent', { eventId: event.id })}
            />
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: pc.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: pc.card, borderWidth: 1, borderColor: pc.border,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 },

  brandEyebrow: { fontFamily: pf.sansBold, fontSize: 11, letterSpacing: 2, color: pc.gold },
  brandTitle: { fontFamily: pf.serif, fontSize: 40, color: pc.textPrimary, marginTop: 4 },
  brandSub: { fontFamily: pf.sans, fontSize: 14, color: pc.textMuted, marginTop: 6, lineHeight: 20 },

  demoBanner: {
    marginTop: 16, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: 'rgba(185,185,180,0.12)', borderWidth: 1, borderColor: pc.borderStrong,
  },
  demoBannerText: { fontFamily: pf.sansMedium, fontSize: 12, color: pc.goldLight, lineHeight: 17 },

  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
    backgroundColor: pc.card, borderWidth: 1, borderColor: pc.border,
  },
  filterChipActive: { backgroundColor: pc.gold, borderColor: pc.gold },
  filterChipText: { fontFamily: pf.sansSemiBold, fontSize: 12.5, color: pc.textMuted },
  filterChipTextActive: { color: pc.bg },

  grid: { marginTop: 18, gap: 14 },

  card: {
    borderRadius: 18, backgroundColor: pc.card, borderWidth: 1, borderColor: pc.border, overflow: 'hidden',
  },
  cardArt: { height: 128, padding: 14, justifyContent: 'space-between', overflow: 'hidden' },
  cardArtTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardArtWatermark: { position: 'absolute', right: 10, bottom: -8 },
  genrePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.28)',
  },
  genrePillText: { fontFamily: pf.sansBold, fontSize: 10, letterSpacing: 1, color: '#fff' },
  flagshipPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(11,11,16,0.85)' },
  flagshipPillText: { fontFamily: pf.sansBold, fontSize: 9.5, letterSpacing: 0.6, color: pc.goldLight },
  cardArtTitle: { fontFamily: pf.serif, fontSize: 26, color: '#fff', lineHeight: 28 },

  cardBody: { padding: 14, gap: 6 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaText: { fontFamily: pf.sans, fontSize: 12.5, color: pc.textMuted },
  cardFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  cardPrice: { fontFamily: pf.sansBold, fontSize: 15, color: pc.textPrimary },
  cardCta: {
    flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: pc.gold,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  cardCtaText: { fontFamily: pf.sansBold, fontSize: 12, color: pc.bg },
})
