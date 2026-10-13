import { useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import {
  ChevronRight, Inbox, Power, Clock,
} from 'lucide-react-native'

import Card from '../../components/ui/Card'
import ScreenHeader from '../../components/ui/ScreenHeader'
import StudioTabBar from '../../components/ui/StudioTabBar'
import { fonts, spacing, radius, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useHandlerShift } from '../../hooks/useHandlerShift'
import { useHandlerTickets, ticketUrgency, getTicketDisplayName } from '../../hooks/useHandlerTickets'

// Urgency dot colours. Note: per the assignment algorithm rules, a Standard
// ticket that reaches "red" urgency is elevated to the same visual urgency
// as a Premium ticket regardless of tier, the colour dot does not soften
// for Standard tickets, red always means red.
const URGENCY_COLOR = {
  green: '#16A34A',
  amber: '#F59E0B',
  red: '#DC2626',
}

// "Today, 6:00pm" / "Tomorrow, 8:00pm" / "Thu, 12 Mar, 5:00pm" — matches the
// original demo copy's style while working off a real turnaround_deadline.
function formatDeadline(iso) {
  if (!iso) return 'No deadline set'
  const d = new Date(iso)
  const now = new Date()
  const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayDiff = Math.round((startOfDay(d) - startOfDay(now)) / 86400000)
  const time = d.toLocaleTimeString('en-IE', { hour: 'numeric', minute: '2-digit' }).replace(' ', '').toLowerCase()
  if (dayDiff === 0) return `Today, ${time}`
  if (dayDiff === 1) return `Tomorrow, ${time}`
  return `${d.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' })}, ${time}`
}

function StatusChip({ online }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  return (
    <View style={[styles.statusChip, online ? styles.statusChipOn : styles.statusChipOff]}>
      <View style={[styles.statusDot, { backgroundColor: online ? '#16A34A' : colors.light }]} />
      <Text style={[styles.statusChipText, online && styles.statusChipTextOn]}>
        {online ? 'Online' : 'Offline'}
      </Text>
    </View>
  )
}

function TicketCard({ ticket }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const tierLabel = ticket.tier === 'premium' ? 'Pro' : 'Standard'
  const isPro = tierLabel === 'Pro'
  const serviceType = ticket.services?.name || 'Service'
  const deadlineText = formatDeadline(ticket.turnaround_deadline)
  const urgency = ticketUrgency(ticket.turnaround_deadline, ticket.tier)
  const displayName = getTicketDisplayName(ticket)
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => Alert.alert(
        `${displayName}: ${serviceType}`,
        `${tierLabel} · Due ${deadlineText}\n\nFull ticket detail view is coming soon.`,
      )}
    >
      <Card style={styles.ticketCard}>
        <View style={[styles.urgencyDot, { backgroundColor: URGENCY_COLOR[urgency] }]} />
        <View style={{ flex: 1 }}>
          <View style={styles.ticketTopRow}>
            <Text style={styles.ticketName}>{displayName}</Text>
            <View style={[styles.tierBadge, isPro && styles.tierBadgePro]}>
              <Text style={[styles.tierBadgeText, isPro && styles.tierBadgeTextPro]}>
                {tierLabel}
              </Text>
            </View>
          </View>
          <Text style={styles.ticketService}>{serviceType}</Text>
          <View style={styles.ticketMetaRow}>
            <Clock size={11} color={colors.muted} />
            <Text style={styles.ticketDeadline}>{deadlineText}</Text>
          </View>
        </View>
        <ChevronRight size={16} color={colors.light} />
      </Card>
    </TouchableOpacity>
  )
}

export default function StudioQueueScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { clockedIn, busy, clockIn, clockOut, reload: reloadShift } = useHandlerShift(user?.id)
  const { loading, loadError, tickets, reload: reloadTickets } = useHandlerTickets(user?.id)

  useFocusEffect(useCallback(() => { reloadShift(); reloadTickets() }, [reloadShift, reloadTickets]))

  async function handleClockToggle() {
    if (clockedIn && tickets.length > 0) {
      Alert.alert(
        'Clock Out',
        `You have ${tickets.length} active ticket${tickets.length !== 1 ? 's' : ''}. Are you sure you want to clock out?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clock Out', style: 'destructive', onPress: () => clockOut() },
        ],
      )
      return
    }
    const { error } = clockedIn ? await clockOut() : await clockIn()
    if (error) Alert.alert('Something went wrong', 'Could not update your clock-in status. Please try again.')
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        variant="navy"
        eyebrow="THE BLUEPRINT STUDIO"
        title="Your Queue"
        style={styles.header}
        titleStyle={styles.headerTitle}
      >
        <View style={styles.headerRow}>
          <StatusChip online={clockedIn} />
          <TouchableOpacity
            style={[styles.clockBtn, busy && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleClockToggle}
            disabled={busy}
          >
            <Power size={13} color={colors.navy} strokeWidth={2} />
            <Text style={styles.clockBtnText}>{clockedIn ? 'Clock Out' : 'Clock In'}</Text>
          </TouchableOpacity>
        </View>

        <StudioTabBar navigation={navigation} active="StudioQueue" />
      </ScreenHeader>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="small" color={colors.navy} />
          </View>
        ) : loadError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Couldn't load your queue right now. Pull to refresh or check back shortly.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.countText}>
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} assigned to you
            </Text>

            {tickets.length === 0 ? (
              <View style={styles.emptyState}>
                <Inbox size={28} color={colors.light} strokeWidth={1.5} />
                <Text style={styles.emptyText}>No tickets in your queue right now.</Text>
              </View>
            ) : (
              <View style={{ gap: 10, marginTop: 10 }}>
                {tickets.map(ticket => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scrollView: { flex: 1 },

  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  headerEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 6,
  },
  headerTitle: { fontFamily: fonts.serif, fontSize: 30, color: colors.cream, marginBottom: 14 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusChipOn:  { backgroundColor: 'rgba(22,163,74,0.14)', borderColor: 'rgba(22,163,74,0.3)' },
  statusChipOff: { backgroundColor: 'rgba(245,240,232,0.08)', borderColor: 'rgba(245,240,232,0.18)' },
  statusDot:     { width: 7, height: 7, borderRadius: 3.5 },
  statusChipText:   { fontFamily: fonts.sansSemiBold, fontSize: 12, color: 'rgba(245,240,232,0.7)' },
  statusChipTextOn: { color: '#4ADE80' },

  clockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.cream, borderRadius: radius.pill,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  clockBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  countText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },

  ticketCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16,
  },
  urgencyDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  ticketTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ticketName: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  ticketService: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  ticketMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  ticketDeadline: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.muted },

  tierBadge: {
    borderRadius: radius.badge, paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: 'rgba(30,58,95,0.06)',
  },
  tierBadgePro: { backgroundColor: '#FEF9C3' },
  tierBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted, letterSpacing: 0.3 },
  tierBadgeTextPro: { color: '#92610A' },

  emptyState: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 60, gap: 12,
  },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center' },
  })
}
