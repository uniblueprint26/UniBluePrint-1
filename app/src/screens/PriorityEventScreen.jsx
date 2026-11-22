import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ChevronLeft, MapPin, Calendar, Clock, Disc3, Music2, Guitar, Sparkles, Users, ExternalLink,
} from 'lucide-react-native'

import { priorityColors as pc, priorityFonts as pf, priorityGenres } from '../constants/priorityTheme'
import {
  PRIORITY_URLS, PRIORITY_TERMS_SHORT, PRIORITY_TERMS_CONTACT, PRIORITY_CANCELLED_TITLE, PRIORITY_CANCELLED_TEXT, fetchPriorityEvent, formatEventDate, formatEventTime, formatPriceCents,
} from '../constants/priorityEvents'
import { NATIVE_NEUTRAL_BILLING } from '../constants/platformPolicy'
import { useSafeGoBack } from '../hooks/useSafeGoBack'

const GENRE_ICON = { house: Disc3, afrobeats: Music2, folk: Guitar }

function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.max(0, Math.min(255, (num >> 16) + amt))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt))
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt))
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`
}

// Plain words for where a ticket type is in its sale window.
function tierNote(tier, now) {
  if (tier.sale_starts_at && new Date(tier.sale_starts_at) > now) return `On sale ${formatEventDate(tier.sale_starts_at)}`
  if (tier.sale_ends_at && new Date(tier.sale_ends_at) <= now) return 'This release has closed'
  return ''
}

// ─── Priority, event detail ────────────────────────────────────────────────
// Reads one event and its ticket types from the database. Prices are shown for
// information only. Tickets are bought on the website: "Get tickets" opens
// uniblueprint.ie/priority/<slug>. Nothing is bought in the app.

export default function PriorityEventScreen({ route, navigation }) {
  const insets = useSafeAreaInsets()
  const safeGoBack = useSafeGoBack(navigation)
  const slug = route?.params?.slug

  const [event, setEvent] = useState(undefined) // undefined loading, null not found
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setFailed(false)
    setEvent(undefined)
    try {
      setEvent(slug ? await fetchPriorityEvent(slug) : null)
    } catch (err) {
      console.warn('[PriorityEventScreen] could not load event', err)
      setFailed(true)
      setEvent(null)
    }
  }, [slug])

  useEffect(() => { load() }, [load])

  async function getTickets() {
    try {
      await Linking.openURL(PRIORITY_URLS.event(slug))
    } catch {
      Alert.alert('Could not open the website', `Go to ${PRIORITY_URLS.events} in your browser to get tickets.`)
    }
  }

  if (event === undefined) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={pc.gold} />
      </View>
    )
  }

  if (event === null) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top, paddingHorizontal: 32 }]}>
        <Text style={styles.notFoundText}>
          {failed ? 'We could not load this event.' : 'We could not find that event.'}
        </Text>
        <TouchableOpacity onPress={failed ? load : safeGoBack} style={{ marginTop: 14 }} accessibilityRole="button">
          <Text style={{ color: pc.gold, fontFamily: pf.sansSemiBold }}>{failed ? 'Try again' : 'Go back'}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const now = new Date()
  const genreKey = String(event.genre || '').toLowerCase()
  const genre = priorityGenres[genreKey] || null
  const GenreIcon = GENRE_ICON[genreKey] || Sparkles
  const art = genre
    ? [shade(genre.color, -22), genre.color, shade(genre.color, 20)]
    : [pc.goldDeep, pc.gold, pc.goldLight]
  const onLight = !genre
  const ageMin = Math.max(event.age_min || 18, 18)
  const ended = event.status === 'ended' || new Date(event.starts_at) <= now
  const soldOut = event.status === 'sold_out'
  const cancelled = event.status === 'cancelled'
  const canGet = !ended && !soldOut && !cancelled

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={art} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={safeGoBack}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronLeft size={20} color="#fff" strokeWidth={2.2} />
          </TouchableOpacity>
          <GenreIcon size={64} color="rgba(255,255,255,0.22)" strokeWidth={1.2} style={styles.heroWatermark} />
          <View style={{ flex: 1 }} />
          <View style={styles.pillRow}>
            <View style={styles.genrePill}>
              <GenreIcon size={11} color={onLight ? pc.bg : '#fff'} strokeWidth={2.2} />
              <Text style={[styles.genrePillText, onLight && { color: pc.bg }]}>
                {genre?.tag || String(event.genre || '').toUpperCase()}
              </Text>
            </View>
            <View style={styles.genrePill}>
              <Text style={[styles.genrePillText, onLight && { color: pc.bg }]}>{ageMin}+</Text>
            </View>
          </View>
          <Text style={[styles.heroTitle, onLight && { color: pc.bg }]}>{event.title}</Text>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <Calendar size={15} color={pc.gold} strokeWidth={2} />
              <Text style={styles.metaText}>{formatEventDate(event.starts_at)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Clock size={15} color={pc.gold} strokeWidth={2} />
              <Text style={styles.metaText}>
                {event.doors_at ? `Doors ${formatEventTime(event.doors_at)}` : `Starts ${formatEventTime(event.starts_at)}`}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <MapPin size={15} color={pc.gold} strokeWidth={2} />
              <Text style={styles.metaText}>
                {event.venue}{event.address ? `, ${event.address}` : ''}, {event.city}
              </Text>
            </View>
          </View>

          {!!event.blurb && <Text style={styles.blurb}>{event.blurb}</Text>}

          {!!event.lineup?.length && (
            <View style={styles.lineupRow}>
              <Users size={14} color={pc.textMuted} strokeWidth={2} />
              <Text style={styles.lineupText}>{event.lineup.join(', ')}</Text>
            </View>
          )}

          {event.tiers.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>TICKET TYPES</Text>
              <View style={{ gap: 10 }}>
                {event.tiers.map(t => {
                  const note = tierNote(t, now)
                  return (
                    <View key={t.id} style={styles.tierRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tierLabel}>{t.label}</Text>
                        {!!note && <Text style={styles.tierNote}>{note}</Text>}
                      </View>
                      {!NATIVE_NEUTRAL_BILLING && <Text style={styles.tierPrice}>{formatPriceCents(t.price_cents)}</Text>}
                    </View>
                  )
                })}
              </View>
            </>
          )}

          <Text style={styles.sectionLabel}>TERMS OF SALE</Text>
          <View style={styles.termsCard}>
            {PRIORITY_TERMS_SHORT.map(line => (
              <Text key={line} style={styles.termsLine}>{line}</Text>
            ))}
            <Text style={styles.termsLine}>{PRIORITY_TERMS_CONTACT}</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(PRIORITY_URLS.terms).catch(() => {})}
              accessibilityRole="link"
              accessibilityLabel="Read the full terms of sale on the website"
              style={styles.termsLink}
            >
              <Text style={styles.termsLinkText}>Read the full terms of sale</Text>
              <ExternalLink size={13} color={pc.gold} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 150 }} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        {canGet ? (
          <>
            <TouchableOpacity
              style={styles.footerCta}
              activeOpacity={0.88}
              onPress={getTickets}
              accessibilityRole="link"
              accessibilityLabel="Get tickets on the UniBlueprint website"
            >
              <Text style={styles.footerCtaText}>Get tickets</Text>
              <ExternalLink size={16} color={pc.bg} strokeWidth={2.4} />
            </TouchableOpacity>
            <Text style={styles.footerHint}>Opens uniblueprint.ie. 18 plus. No refunds unless the event is cancelled.</Text>
          </>
        ) : (
          cancelled ? (
            <>
              <Text style={styles.footerClosed}>{PRIORITY_CANCELLED_TITLE}</Text>
              <Text style={styles.footerHint}>{PRIORITY_CANCELLED_TEXT}</Text>
            </>
          ) : (
            <Text style={styles.footerClosed}>{ended ? 'This event has ended.' : 'This event is sold out.'}</Text>
          )
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: pc.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontFamily: pf.sans, color: pc.textMuted, textAlign: 'center' },

  hero: { minHeight: 200, padding: 18, paddingTop: 14, overflow: 'hidden' },
  heroWatermark: { position: 'absolute', right: 16, bottom: 16 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  genrePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.28)', alignSelf: 'flex-start',
  },
  genrePillText: { fontFamily: pf.sansBold, fontSize: 10, letterSpacing: 1, color: '#fff' },
  heroTitle: { fontFamily: pf.serif, fontSize: 32, color: '#fff', marginTop: 8 },

  body: { padding: 20 },

  metaCard: {
    backgroundColor: pc.card, borderRadius: 14, borderWidth: 1, borderColor: pc.border,
    padding: 16, gap: 12,
  },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  metaText: { fontFamily: pf.sansMedium, fontSize: 13.5, lineHeight: 19, color: pc.textPrimary, flex: 1 },

  blurb: { fontFamily: pf.sans, fontSize: 14.5, color: pc.textMuted, lineHeight: 22, marginTop: 20 },
  lineupRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 14 },
  lineupText: { fontFamily: pf.sans, fontSize: 13, lineHeight: 19, color: pc.textMuted, flex: 1 },

  sectionLabel: {
    fontFamily: pf.sansBold, fontSize: 11.5, letterSpacing: 1.2, color: pc.gold,
    marginTop: 32, marginBottom: 14,
  },

  tierRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14,
    backgroundColor: pc.card, borderWidth: 1, borderColor: pc.border,
  },
  tierLabel: { fontFamily: pf.sansSemiBold, fontSize: 14.5, color: pc.textPrimary },
  tierNote: { fontFamily: pf.sans, fontSize: 12, color: pc.textMuted, marginTop: 3 },
  termsCard: {
    padding: 16, borderRadius: 14, gap: 8,
    backgroundColor: pc.card, borderWidth: 1, borderColor: pc.border,
  },
  termsLine: { fontFamily: pf.sans, fontSize: 13.5, lineHeight: 20, color: pc.textMuted },
  termsLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, minHeight: 32 },
  termsLinkText: { fontFamily: pf.sansSemiBold, fontSize: 13.5, color: pc.gold },
  tierPrice: { fontFamily: pf.sansBold, fontSize: 15, color: pc.textPrimary },

  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 20, paddingTop: 14,
    backgroundColor: pc.surface, borderTopWidth: 1, borderTopColor: pc.border,
  },
  footerCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: pc.gold, paddingVertical: 15, borderRadius: 14,
  },
  footerCtaText: { fontFamily: pf.sansBold, fontSize: 15, color: pc.bg },
  footerHint: { fontFamily: pf.sans, fontSize: 12, color: pc.textMuted, textAlign: 'center', marginTop: 10 },
  footerClosed: { fontFamily: pf.sansSemiBold, fontSize: 14, color: pc.textMuted, textAlign: 'center', paddingVertical: 8 },
})
