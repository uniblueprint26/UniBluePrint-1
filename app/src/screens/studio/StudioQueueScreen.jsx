import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronRight, Inbox, Power, Clock,
} from 'lucide-react-native'

import Card from '../../components/ui/Card'
import StudioTabBar from '../../components/ui/StudioTabBar'
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme'

// DEMO DATA — replace with a live Supabase query filtered by
// assigned_handler_id once the ticket queue schema exists.
const DEMO_TICKETS = [
  {
    id: 't1', studentFirstName: 'Aoife', serviceType: 'CV Optimisation',
    tier: 'Pro', deadline: 'Today, 6:00pm', urgency: 'red',
  },
  {
    id: 't2', studentFirstName: 'Conor', serviceType: 'Cover Letter Assistance',
    tier: 'Standard', deadline: 'Today, 8:00pm', urgency: 'red',
  },
  {
    id: 't3', studentFirstName: 'Niamh', serviceType: 'Interview Prep',
    tier: 'Pro', deadline: 'Tomorrow, 10:00am', urgency: 'amber',
  },
  {
    id: 't4', studentFirstName: 'Darragh', serviceType: 'LinkedIn Optimisation',
    tier: 'Standard', deadline: 'Tomorrow, 4:00pm', urgency: 'amber',
  },
  {
    id: 't5', studentFirstName: 'Saoirse', serviceType: 'CV Optimisation',
    tier: 'Standard', deadline: 'Thursday, 5:00pm', urgency: 'green',
  },
  {
    id: 't6', studentFirstName: 'Eoin', serviceType: 'Cover Letter Assistance',
    tier: 'Pro', deadline: 'Friday, 12:00pm', urgency: 'green',
  },
]

// Urgency dot colours. Note: per the assignment algorithm rules, a Standard
// ticket that reaches "red" urgency is elevated to the same visual urgency
// as a Premium ticket regardless of tier, the colour dot does not soften
// for Standard tickets, red always means red.
const URGENCY_COLOR = {
  green: '#16A34A',
  amber: '#F59E0B',
  red: '#DC2626',
}

function StatusChip({ online }) {
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
  const isPro = ticket.tier === 'Pro'
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => Alert.alert(
        `${ticket.studentFirstName}: ${ticket.serviceType}`,
        `${ticket.tier} · Due ${ticket.deadline}\n\nFull ticket detail view is coming soon.`,
      )}
    >
      <Card style={styles.ticketCard}>
        <View style={[styles.urgencyDot, { backgroundColor: URGENCY_COLOR[ticket.urgency] }]} />
        <View style={{ flex: 1 }}>
          <View style={styles.ticketTopRow}>
            <Text style={styles.ticketName}>{ticket.studentFirstName}</Text>
            <View style={[styles.tierBadge, isPro && styles.tierBadgePro]}>
              <Text style={[styles.tierBadgeText, isPro && styles.tierBadgeTextPro]}>
                {ticket.tier}
              </Text>
            </View>
          </View>
          <Text style={styles.ticketService}>{ticket.serviceType}</Text>
          <View style={styles.ticketMetaRow}>
            <Clock size={11} color={colors.muted} />
            <Text style={styles.ticketDeadline}>{ticket.deadline}</Text>
          </View>
        </View>
        <ChevronRight size={16} color={colors.light} />
      </Card>
    </TouchableOpacity>
  )
}

export default function StudioQueueScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [online, setOnline] = useState(true)

  const tickets = DEMO_TICKETS

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerEyebrow}>THE BLUEPRINT STUDIO</Text>
        <Text style={styles.headerTitle}>Your Queue</Text>

        <View style={styles.headerRow}>
          <StatusChip online={online} />
          <TouchableOpacity
            style={styles.clockBtn}
            activeOpacity={0.8}
            onPress={() => setOnline(v => !v)}
          >
            <Power size={13} color={colors.navy} strokeWidth={2} />
            <Text style={styles.clockBtnText}>{online ? 'Clock Out' : 'Clock In'}</Text>
          </TouchableOpacity>
        </View>

        <StudioTabBar navigation={navigation} active="StudioQueue" />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
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
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

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
