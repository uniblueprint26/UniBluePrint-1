import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Info, Star } from 'lucide-react-native'

import Card from '../../components/ui/Card'
import StudioTabBar from '../../components/ui/StudioTabBar'
import { colors, fonts, spacing, radius } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

// Read live from handler_specialisms (joined to services), matching the
// column shapes exactly: confidence, tickets_completed, rating_sum. Average
// rating is derived client-side (rating_sum / tickets_completed) rather than
// stored, same as the database's own reassess_specialism_confidence()
// trigger already computes it server-side.
const CONFIDENCE_LABEL = { developing: 'Developing', comfortable: 'Comfortable', strong: 'Strong' }
const CONFIDENCE_STYLE = {
  Strong:      { bg: '#F0FDF4', text: '#15803D' },
  Comfortable: { bg: '#EFF6FF', text: '#1d4ed8' },
  Developing:  { bg: '#FFFBEB', text: '#B45309' },
}

function ConfidenceChip({ level }) {
  const style = CONFIDENCE_STYLE[level] || CONFIDENCE_STYLE.Developing
  return (
    <View style={[styles.chip, { backgroundColor: style.bg }]}>
      <Text style={[styles.chipText, { color: style.text }]}>{level}</Text>
    </View>
  )
}

function SpecialismCard({ item }) {
  const trainingReplaced = item.ticketsCompleted >= 10
  return (
    <Card style={styles.specCard}>
      <View style={styles.specTopRow}>
        <Text style={styles.specTitle}>{item.serviceType}</Text>
        <ConfidenceChip level={item.confidence} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statValue}>{item.ticketsCompleted}</Text>
          <Text style={styles.statLabel}>Tickets Completed</Text>
        </View>
        <View style={[styles.statBlock, styles.statBlockBorder]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Star size={13} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.statValue}>{item.avgRating.toFixed(1)}</Text>
          </View>
          <Text style={styles.statLabel}>Average Rating</Text>
        </View>
      </View>

      {trainingReplaced && (
        <Text style={styles.specFootnote}>
          Performance score active, based on {item.ticketsCompleted} completed tickets.
        </Text>
      )}
    </Card>
  )
}

export default function SpecialismScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [specialisms, setSpecialisms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    supabase
      .from('handler_specialisms')
      .select('id, confidence, tickets_completed, rating_sum, services(name)')
      .eq('handler_id', user.id)
      .then(({ data }) => {
        if (cancelled) return
        setSpecialisms((data || []).map(s => ({
          id: s.id,
          serviceType: s.services?.name || 'Unknown service',
          confidence: CONFIDENCE_LABEL[s.confidence] || 'Developing',
          ticketsCompleted: s.tickets_completed,
          avgRating: s.tickets_completed > 0 ? s.rating_sum / s.tickets_completed : 0,
        })))
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [user?.id])

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerEyebrow}>THE BLUEPRINT STUDIO</Text>
        <Text style={styles.headerTitle}>Specialisms</Text>
        <Text style={styles.headerSub}>
          Your declared confidence levels and real performance, by service type.
        </Text>

        <StudioTabBar navigation={navigation} active="Specialism" />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Info size={15} color={colors.navy} />
          </View>
          <Text style={styles.infoText}>
            Your confidence level is a tiebreaker when tickets are assigned, not a hard filter.
            After 10 tickets of a service type, your actual performance replaces your training score.
          </Text>
        </Card>

        {loading ? (
          <ActivityIndicator size="small" color={colors.navy} style={{ marginTop: 30 }} />
        ) : specialisms.length === 0 ? (
          <Text style={styles.emptyText}>
            No declared specialisms yet. These are set up with Operations when you join the queue
            for a service type.
          </Text>
        ) : (
          <View style={{ gap: 10, marginTop: 16 }}>
            {specialisms.map(item => (
              <SpecialismCard key={item.id} item={item} />
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
  headerTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.cream, marginBottom: 8 },
  headerSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.7)', lineHeight: 19 },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
  },
  infoIconWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  infoText: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.navy, lineHeight: 18 },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 30, lineHeight: 19, paddingHorizontal: 10 },

  specCard: {},
  specTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  specTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, flex: 1, marginRight: 8 },

  chip: { borderRadius: radius.badge, paddingHorizontal: 9, paddingVertical: 4 },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 11 },

  statsRow: { flexDirection: 'row' },
  statBlock: { flex: 1, gap: 2 },
  statBlockBorder: { borderLeftWidth: 1, borderLeftColor: 'rgba(30,58,95,0.08)', paddingLeft: 14 },
  statValue: { fontFamily: fonts.serif, fontSize: 20, color: colors.navy },
  statLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 2 },

  specFootnote: {
    fontFamily: fonts.sans, fontSize: 11, color: colors.muted, fontStyle: 'italic',
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)',
  },
})
