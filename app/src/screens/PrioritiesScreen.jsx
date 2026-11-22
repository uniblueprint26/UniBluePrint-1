import { useState, useMemo, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ChevronLeft, ChevronRight, MapPin, Calendar, Disc3, Music2, Guitar, Sparkles, Ticket,
} from 'lucide-react-native'

import { priorityColors as pc, priorityFonts as pf, priorityGenres } from '../constants/priorityTheme'
import {
  PRIORITY_FILTERS, fetchPriorityEvents, formatEventDate, formatPriceCents, cheapestTierCents,
} from '../constants/priorityEvents'
import { useSafeGoBack } from '../hooks/useSafeGoBack'

// ─── Priority, UniBlueprint's events arm ───────────────────────────────────
// Real events from the database (priority_events). When there are none on sale
// the screen says so plainly. Tickets are bought on the website, so nothing
// here takes payment. Brand treatment is Priority's own (black and silver),
// deliberately not UBP's navy and cream. See priorityTheme.js.

const GENRE_ICON = { house: Disc3, afrobeats: Music2, folk: Guitar }

function genreOf(event) {
  return priorityGenres[String(event.genre || '').toLowerCase()] || null
}

function EventCard({ event, onPress }) {
  const genre = genreOf(event)
  const GenreIcon = GENRE_ICON[String(event.genre || '').toLowerCase()] || Sparkles
  const from = cheapestTierCents(event)
  const soldOut = event.status === 'sold_out'
  const art = genre
    ? [shade(genre.color, -22), genre.color, shade(genre.color, 20)]
    : [pc.goldDeep, pc.gold, pc.goldLight]
  const onLight = !genre

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${formatEventDate(event.starts_at)}`}
    >
      <LinearGradient colors={art} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardArt}>
        <View style={styles.cardArtTopRow}>
          <View style={styles.genrePill}>
            <GenreIcon size={11} color={onLight ? pc.bg : '#fff'} strokeWidth={2.2} />
            <Text style={[styles.genrePillText, onLight && { color: pc.bg }]}>
              {(genre?.tag || String(event.genre || '').toUpperCase())}
            </Text>
          </View>
          {soldOut && (
            <View style={styles.soldPill}><Text style={styles.soldPillText}>SOLD OUT</Text></View>
          )}
        </View>
        <GenreIcon size={46} color="rgba(255,255,255,0.22)" strokeWidth={1.3} style={styles.cardArtWatermark} />
        <Text style={[styles.cardArtTitle, onLight && { color: pc.bg }]} numberOfLines={2}>{event.title}</Text>
      </LinearGradient>

      <View style={styles.cardBody}>
        <View style={styles.cardMetaRow}>
          <Calendar size={13} color={pc.textMuted} strokeWidth={2} />
          <Text style={styles.cardMetaText}>{formatEventDate(event.starts_at)}</Text>
        </View>
        <View style={styles.cardMetaRow}>
          <MapPin size={13} color={pc.textMuted} strokeWidth={2} />
          <Text style={styles.cardMetaText} numberOfLines={1}>{event.venue}, {event.city}</Text>
        </View>
        <View style={styles.cardFooterRow}>
          <Text style={styles.cardPrice}>
            {from != null && !soldOut ? `Tickets from ${formatPriceCents(from)}` : ' '}
          </Text>
          <View style={styles.cardCta}>
            <Text style={styles.cardCtaText}>View event</Text>
            <ChevronRight size={13} color={pc.textPrimary} strokeWidth={2.4} />
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
  const safeGoBack = useSafeGoBack(navigation)
  const [filter, setFilter] = useState('all')
  const [allEvents, setAllEvents] = useState(null) // null while loading
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setFailed(false)
    setAllEvents(null)
    try {
      setAllEvents(await fetchPriorityEvents())
    } catch (err) {
      console.warn('[PrioritiesScreen] could not load events', err)
      setFailed(true)
      setAllEvents([])
    }
  }, [])

  useEffect(() => { load() }, [load])

  const events = useMemo(() => {
    if (!allEvents) return []
    if (filter === 'all') return allEvents
    return allEvents.filter(e => String(e.genre || '').toLowerCase() === filter)
  }, [allEvents, filter])

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={safeGoBack}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={20} color={pc.textPrimary} strokeWidth={2.2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.ticketsBtn}
          onPress={() => navigation.navigate('PriorityTickets')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="My tickets"
        >
          <Ticket size={14} color={pc.textPrimary} strokeWidth={2.2} />
          <Text style={styles.ticketsBtnText}>My tickets</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.brandEyebrow}>UNIBLUEPRINT PRESENTS</Text>
        <Text style={styles.brandTitle}>Priority</Text>
        <Text style={styles.brandSub}>
          Nights out across Ireland. All events are 18+. You buy tickets on the UniBlueprint website.
        </Text>

        {allEvents === null ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator color={pc.gold} />
          </View>
        ) : failed ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>We could not load events.</Text>
            <Text style={styles.emptySub}>Check your connection and try again.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85} accessibilityRole="button">
              <Text style={styles.retryBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : allEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Priority events on sale right now.</Text>
            <Text style={styles.emptySub}>New nights appear here first.</Text>
          </View>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 24 }}
              contentContainerStyle={{ gap: 8, paddingRight: 20 }}
            >
              {PRIORITY_FILTERS.map(f => {
                const active = filter === f.key
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setFilter(f.key)}
                    activeOpacity={0.8}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            {events.length === 0 ? (
              <Text style={styles.noMatch}>No events in this genre right now.</Text>
            ) : (
              <View style={styles.grid}>
                {events.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={() => navigation.navigate('PriorityEvent', { slug: event.slug })}
                  />
                ))}
              </View>
            )}
          </>
        )}

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
  ticketsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 36, borderRadius: 18,
    backgroundColor: pc.card, borderWidth: 1, borderColor: pc.borderStrong,
  },
  ticketsBtnText: { fontFamily: pf.sansSemiBold, fontSize: 13, color: pc.textPrimary },
  scroll: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 },

  brandEyebrow: { fontFamily: pf.sansBold, fontSize: 11, letterSpacing: 2, color: pc.gold },
  brandTitle: { fontFamily: pf.serif, fontSize: 40, color: pc.textPrimary, marginTop: 4 },
  brandSub: { fontFamily: pf.sans, fontSize: 14, color: pc.textMuted, marginTop: 8, lineHeight: 21 },

  centerBlock: { paddingVertical: 56, alignItems: 'center' },
  emptyCard: {
    marginTop: 28, padding: 28, borderRadius: 18, alignItems: 'center',
    backgroundColor: pc.surface, borderWidth: 1, borderColor: pc.border,
  },
  emptyTitle: { fontFamily: pf.serif, fontSize: 20, lineHeight: 27, color: pc.textPrimary, textAlign: 'center' },
  emptySub: { fontFamily: pf.sans, fontSize: 14, lineHeight: 21, color: pc.textMuted, marginTop: 8, textAlign: 'center' },
  retryBtn: {
    marginTop: 18, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12,
    borderWidth: 1, borderColor: pc.borderStrong,
  },
  retryBtnText: { fontFamily: pf.sansSemiBold, fontSize: 13.5, color: pc.textPrimary },
  noMatch: { fontFamily: pf.sans, fontSize: 14, color: pc.textMuted, marginTop: 24 },

  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
    backgroundColor: pc.card, borderWidth: 1, borderColor: pc.border,
  },
  filterChipActive: { backgroundColor: pc.gold, borderColor: pc.gold },
  filterChipText: { fontFamily: pf.sansSemiBold, fontSize: 12.5, color: pc.textMuted },
  filterChipTextActive: { color: pc.bg },

  grid: { marginTop: 20, gap: 16 },

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
  soldPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(11,11,16,0.85)' },
  soldPillText: { fontFamily: pf.sansBold, fontSize: 9.5, letterSpacing: 0.6, color: pc.danger },
  cardArtTitle: { fontFamily: pf.serif, fontSize: 26, color: '#fff', lineHeight: 28 },

  cardBody: { padding: 16, gap: 8 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMetaText: { fontFamily: pf.sans, fontSize: 12.5, color: pc.textMuted, flex: 1 },
  cardFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  cardPrice: { fontFamily: pf.sansSemiBold, fontSize: 13, color: pc.textPrimary },
  cardCta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  cardCtaText: { fontFamily: pf.sansBold, fontSize: 12.5, color: pc.textPrimary },
})
