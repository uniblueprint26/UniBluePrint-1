import { useState, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ChevronLeft, MapPin, Calendar, Clock, Minus, Plus, Disc3, Music2, Guitar,
  Sparkles, Users,
} from 'lucide-react-native'

import { priorityColors as pc, priorityFonts as pf, priorityGenres } from '../constants/priorityTheme'
import { findPriorityEvent } from '../constants/priorityEvents'

const GENRE_ICON = { house: Disc3, afrobeats: Music2, folk: Guitar }

function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.max(0, Math.min(255, (num >> 16) + amt))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt))
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt))
  return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`
}

// ─── Priority — Event detail + ticket selection ────────────────────────────
// Second step of the demo purchase flow: pick a tier, pick a quantity, see
// a running total, then "Continue to Checkout". No order is created here —
// PriorityCheckoutScreen is the one screen that touches "payment".

export default function PriorityEventScreen({ route, navigation }) {
  const insets = useSafeAreaInsets()
  const event = findPriorityEvent(route?.params?.eventId)

  const [tierId, setTierId] = useState(event?.tiers?.[0]?.id)
  const [qty, setQty] = useState(1)

  const tier = useMemo(() => event?.tiers.find(t => t.id === tierId), [event, tierId])
  const total = (tier?.price || 0) * qty

  if (!event) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.notFoundText}>Event not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
          <Text style={{ color: pc.gold, fontFamily: pf.sansSemiBold }}>Go back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const genre = priorityGenres[event.genre]
  const GenreIcon = GENRE_ICON[event.genre] || Sparkles

  function dec() { setQty(q => Math.max(1, q - 1)) }
  function inc() { setQty(q => Math.min(8, q + 1)) }

  function continueToCheckout() {
    if (!tier) {
      Alert.alert('Pick a ticket type', 'Choose a ticket tier before continuing.')
      return
    }
    navigation.navigate('PriorityCheckout', {
      eventId: event.id,
      tierId: tier.id,
      qty,
    })
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={event.flagship
            ? [pc.goldDeep, pc.gold, pc.goldLight]
            : [shade(genre.color, -22), genre.color, shade(genre.color, 20)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronLeft size={20} color="#fff" strokeWidth={2.2} />
          </TouchableOpacity>
          <GenreIcon size={64} color="rgba(255,255,255,0.22)" strokeWidth={1.2} style={styles.heroWatermark} />
          <View style={{ flex: 1 }} />
          <View style={styles.genrePill}>
            <GenreIcon size={11} color={event.flagship ? pc.bg : '#fff'} strokeWidth={2.2} />
            <Text style={[styles.genrePillText, event.flagship && { color: pc.bg }]}>{genre.tag}</Text>
          </View>
          <Text style={[styles.heroTitle, event.flagship && { color: pc.bg }]}>{event.title}</Text>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>Demo event — invented for this preview, not a real booking.</Text>
          </View>

          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <Calendar size={15} color={pc.gold} strokeWidth={2} />
              <Text style={styles.metaText}>{event.dateLabel}</Text>
            </View>
            <View style={styles.metaRow}>
              <Clock size={15} color={pc.gold} strokeWidth={2} />
              <Text style={styles.metaText}>{event.doorsLabel}</Text>
            </View>
            <View style={styles.metaRow}>
              <MapPin size={15} color={pc.gold} strokeWidth={2} />
              <Text style={styles.metaText}>{event.venue} · {event.address}</Text>
            </View>
          </View>

          <Text style={styles.blurb}>{event.blurb}</Text>

          {!!event.lineup?.length && (
            <View style={styles.lineupRow}>
              <Users size={14} color={pc.textMuted} strokeWidth={2} />
              <Text style={styles.lineupText}>{event.lineup.join(' · ')}</Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>SELECT TICKET TYPE</Text>
          <View style={{ gap: 10 }}>
            {event.tiers.map(t => {
              const active = t.id === tierId
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setTierId(t.id)}
                  activeOpacity={0.85}
                  style={[styles.tierRow, active && styles.tierRowActive]}
                >
                  <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                    {active && <View style={styles.radioInner} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tierLabel}>{t.label}</Text>
                    {!!t.note && <Text style={styles.tierNote}>{t.note}</Text>}
                  </View>
                  <Text style={styles.tierPrice}>€{t.price.toFixed(2)}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={styles.sectionLabel}>QUANTITY</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity onPress={dec} style={styles.qtyBtn} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Decrease quantity">
              <Minus size={16} color={pc.textPrimary} strokeWidth={2.4} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{qty}</Text>
            <TouchableOpacity onPress={inc} style={styles.qtyBtn} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Increase quantity">
              <Plus size={16} color={pc.textPrimary} strokeWidth={2.4} />
            </TouchableOpacity>
            <Text style={styles.qtyHint}>Up to 8 tickets per order</Text>
          </View>

          <View style={{ height: 110 }} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <View>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>€{total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.footerCta} activeOpacity={0.88} onPress={continueToCheckout}>
          <Text style={styles.footerCtaText}>Continue to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: pc.bg },
  notFoundText: { fontFamily: pf.sans, color: pc.textMuted },

  hero: { minHeight: 200, padding: 18, paddingTop: 14, overflow: 'hidden' },
  heroWatermark: { position: 'absolute', right: 16, bottom: 16 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  genrePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.28)', alignSelf: 'flex-start', marginTop: 6,
  },
  genrePillText: { fontFamily: pf.sansBold, fontSize: 10, letterSpacing: 1, color: '#fff' },
  heroTitle: { fontFamily: pf.serif, fontSize: 32, color: '#fff', marginTop: 8 },

  body: { padding: 20 },
  demoBanner: {
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 16,
    backgroundColor: 'rgba(185,185,180,0.12)', borderWidth: 1, borderColor: pc.borderStrong,
  },
  demoBannerText: { fontFamily: pf.sansMedium, fontSize: 12, color: pc.goldLight, lineHeight: 17 },

  metaCard: {
    backgroundColor: pc.card, borderRadius: 14, borderWidth: 1, borderColor: pc.border,
    padding: 14, gap: 10,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontFamily: pf.sansMedium, fontSize: 13.5, color: pc.textPrimary, flex: 1 },

  blurb: { fontFamily: pf.sans, fontSize: 14, color: pc.textMuted, lineHeight: 21, marginTop: 16 },
  lineupRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10 },
  lineupText: { fontFamily: pf.sans, fontSize: 12.5, color: pc.textFaint },

  sectionLabel: {
    fontFamily: pf.sansBold, fontSize: 11.5, letterSpacing: 1.2, color: pc.gold,
    marginTop: 26, marginBottom: 12,
  },

  tierRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14,
    backgroundColor: pc.card, borderWidth: 1, borderColor: pc.border,
  },
  tierRowActive: { borderColor: pc.gold, backgroundColor: pc.cardAlt },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: pc.textFaint,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: { borderColor: pc.gold },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: pc.gold },
  tierLabel: { fontFamily: pf.sansSemiBold, fontSize: 14.5, color: pc.textPrimary },
  tierNote: { fontFamily: pf.sans, fontSize: 11.5, color: pc.textFaint, marginTop: 2 },
  tierPrice: { fontFamily: pf.sansBold, fontSize: 16, color: pc.textPrimary },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  qtyBtn: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: pc.card, borderWidth: 1, borderColor: pc.border,
  },
  qtyValue: { fontFamily: pf.sansBold, fontSize: 18, color: pc.textPrimary, minWidth: 24, textAlign: 'center' },
  qtyHint: { fontFamily: pf.sans, fontSize: 11.5, color: pc.textFaint, marginLeft: 8 },

  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14,
    backgroundColor: pc.surface, borderTopWidth: 1, borderTopColor: pc.border,
  },
  footerTotalLabel: { fontFamily: pf.sans, fontSize: 11.5, color: pc.textMuted },
  footerTotalValue: { fontFamily: pf.serif, fontSize: 22, color: pc.textPrimary, marginTop: 1 },
  footerCta: { backgroundColor: pc.gold, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 14 },
  footerCtaText: { fontFamily: pf.sansBold, fontSize: 14, color: pc.bg },
})
