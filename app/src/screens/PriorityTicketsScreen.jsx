import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Alert, ActivityIndicator, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, ExternalLink, Ticket } from 'lucide-react-native'

import { priorityColors as pc, priorityFonts as pf } from '../constants/priorityTheme'
import {
  PRIORITY_URLS, fetchMyPriorityTickets, formatEventDate, formatEventTime,
} from '../constants/priorityEvents'
import { useSafeGoBack } from '../hooks/useSafeGoBack'
import { useAuth } from '../context/AuthContext'

// ─── Priority, My tickets ──────────────────────────────────────────────────
// The signed in person's own tickets (row level security returns only theirs).
// Each ticket shows its code. The app has no QR library, so the QR code for the
// door lives on the website: "Open my tickets on the website".

const STATUS = {
  valid: { text: 'Valid', color: pc.success, bg: pc.successBg },
  used:  { text: 'Used', color: pc.textMuted, bg: 'rgba(154,154,149,0.14)' },
  void:  { text: 'Cancelled', color: pc.danger, bg: 'rgba(217,134,119,0.14)' },
}

function TicketCard({ ticket }) {
  const event = ticket.event
  const status = STATUS[ticket.status] || STATUS.valid
  return (
    <View style={styles.card}>
      <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
        <Text style={[styles.statusText, { color: status.color }]}>{status.text.toUpperCase()}</Text>
      </View>
      <Text style={styles.cardTitle}>{event?.title || 'Priority event'}</Text>
      {!!event && (
        <Text style={styles.cardMeta}>
          {formatEventDate(event.starts_at)}
          {'\n'}
          {event.doors_at ? `Doors ${formatEventTime(event.doors_at)}` : `Starts ${formatEventTime(event.starts_at)}`}
          {'\n'}
          {event.venue}, {event.city}
        </Text>
      )}
      <Text style={styles.codeLabel}>TICKET CODE</Text>
      <Text style={styles.code} selectable accessibilityLabel={`Ticket code ${ticket.code}`}>{ticket.code}</Text>
    </View>
  )
}

export default function PriorityTicketsScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const safeGoBack = useSafeGoBack(navigation)
  const { user } = useAuth()

  const [tickets, setTickets] = useState(null) // null while loading
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    if (!user) { setTickets([]); return }
    setFailed(false)
    setTickets(null)
    try {
      setTickets(await fetchMyPriorityTickets())
    } catch (err) {
      console.warn('[PriorityTicketsScreen] could not load tickets', err)
      setFailed(true)
      setTickets([])
    }
  }, [user])

  useEffect(() => { load() }, [load])

  async function openWebsite() {
    try {
      await Linking.openURL(PRIORITY_URLS.tickets)
    } catch {
      Alert.alert('Could not open the website', `Go to ${PRIORITY_URLS.tickets} in your browser.`)
    }
  }

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
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>My tickets</Text>
        <Text style={styles.sub}>Keep your ticket code private. Anyone with it can use your ticket.</Text>

        {tickets === null ? (
          <View style={styles.centerBlock}><ActivityIndicator color={pc.gold} /></View>
        ) : !user ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sign in to see your tickets.</Text>
          </View>
        ) : failed ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>We could not load your tickets.</Text>
            <Text style={styles.emptySub}>Check your connection and try again.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85} accessibilityRole="button">
              <Text style={styles.retryBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ticket size={28} color={pc.textMuted} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { marginTop: 14 }]}>You have no tickets yet.</Text>
            <Text style={styles.emptySub}>When you buy tickets on the website they show up here.</Text>
          </View>
        ) : (
          <View style={{ gap: 16, marginTop: 24 }}>
            {tickets.map(t => <TicketCard key={t.id} ticket={t} />)}
          </View>
        )}

        <TouchableOpacity style={styles.webBtn} onPress={openWebsite} activeOpacity={0.85} accessibilityRole="link">
          <Text style={styles.webBtnText}>Open my tickets on the website</Text>
          <ExternalLink size={15} color={pc.textPrimary} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.webHint}>The QR code for the door is on the website.</Text>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  )
}

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' })

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: pc.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: pc.card, borderWidth: 1, borderColor: pc.border,
  },
  scroll: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 },

  title: { fontFamily: pf.serif, fontSize: 34, color: pc.textPrimary, marginTop: 4 },
  sub: { fontFamily: pf.sans, fontSize: 14, color: pc.textMuted, marginTop: 8, lineHeight: 21 },

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

  card: {
    padding: 20, borderRadius: 18, backgroundColor: pc.card,
    borderWidth: 1, borderColor: pc.borderStrong,
  },
  statusPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontFamily: pf.sansBold, fontSize: 10.5, letterSpacing: 1 },
  cardTitle: { fontFamily: pf.serif, fontSize: 24, lineHeight: 30, color: pc.textPrimary, marginTop: 12 },
  cardMeta: { fontFamily: pf.sans, fontSize: 13.5, lineHeight: 22, color: pc.textMuted, marginTop: 8 },
  codeLabel: { fontFamily: pf.sansBold, fontSize: 11, letterSpacing: 1.2, color: pc.gold, marginTop: 20 },
  code: { fontFamily: MONO, fontSize: 19, letterSpacing: 1, color: pc.textPrimary, marginTop: 6 },

  webBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: pc.borderStrong, backgroundColor: pc.card,
  },
  webBtnText: { fontFamily: pf.sansSemiBold, fontSize: 14, color: pc.textPrimary },
  webHint: { fontFamily: pf.sans, fontSize: 12, color: pc.textMuted, textAlign: 'center', marginTop: 10 },
})
