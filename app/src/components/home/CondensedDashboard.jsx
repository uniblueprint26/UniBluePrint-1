import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { Bell, FileText, Users, Award } from 'lucide-react-native'
import { colors, fonts, radius, shadows } from '../../constants/theme'
import { supabase } from '../../lib/supabase'

// ─── Quick Access → condensed dashboard summary ────────────────────────────
//
// Quick Access used to be a pure navigation shortcut: tap a card, jump to
// that section — a shortcut to a place the sidebar/tab bar already reaches,
// "same destination, pointless extra step" per the founder. This gives the
// Quick Access section its own distinct job: tapping the header now
// expands/collapses a condensed, real-data summary of the student's own
// account IN PLACE, without navigating anywhere. The four shortcut cards
// underneath (drag-reorder etc.) are unchanged — this is a second surface
// alongside them, not a replacement.
//
// Data is fetched lazily, once, the first time this expands (not on every
// Home mount) — it's an extra summary, not something that needs to be
// live/realtime the way the bell badge is.

const STAGE_LABEL = {
  submitted: 'Submitted', in_queue: 'In queue', assigned: 'Assigned to a handler',
  in_review: 'In review', delivered: 'Delivered',
}

// Fallback only, used for the very first expand before the real content has
// ever reported its own height (see `handleContentLayout` below) — not the
// real target height. It used to be the ONLY target height, hardcoded, and
// came up short of the actual 4-row panel (Notifications, Foundation
// Blueprint, Coaching, Membership) by enough to clip the last row
// (Membership) at the bottom on every expand. Any future change to a row's
// content — a longer value string wrapping to a second line, a platform's
// font-scaling accessibility setting, an added row — would have reopened
// the same class of bug with another hardcoded guess, so this now measures
// the panel's real, current height instead of assuming one.
const FALLBACK_PANEL_HEIGHT = 220

function StatRow({ Icon, label, value, onPress }) {
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={onPress ? 0.65 : 1}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.rowIconWrap}>
        <Icon size={14} color={colors.navy} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function CondensedDashboard({
  expanded, userId, unreadCount, isComplimentaryPro, navigation,
}) {
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [activeCount, setActiveCount] = useState(0)
  const [latestStage, setLatestStage] = useState(null)
  const [nextBooking, setNextBooking] = useState(null)

  const heightAnim = useRef(new Animated.Value(0)).current
  // The panel's real, measured height — see `handleContentLayout`. Layout
  // still runs (and reports a size) for a child of a zero-height,
  // overflow:hidden parent in RN's Yoga engine, since clipping is a paint
  // concern, not a layout one — so this is already known correctly before
  // the very first expand in the overwhelmingly common case, not just on
  // the second one.
  const [contentHeight, setContentHeight] = useState(FALLBACK_PANEL_HEIGHT)

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: expanded ? contentHeight : 0,
      duration: 240,
      useNativeDriver: false,
    }).start()
  }, [expanded, contentHeight, heightAnim])

  function handleContentLayout(e) {
    const h = e.nativeEvent.layout.height
    if (h > 0 && Math.round(h) !== Math.round(contentHeight)) setContentHeight(h)
  }

  // Lazy-load real account data the first time the panel is opened.
  useEffect(() => {
    if (!expanded || loaded || !userId) return
    let cancelled = false
    async function load() {
      setLoading(true)
      const todayIso = new Date().toISOString().slice(0, 10)
      const [{ count }, { data: latest }, { data: booking }] = await Promise.all([
        supabase.from('submissions').select('id', { count: 'exact', head: true })
          .eq('user_id', userId).neq('stage', 'delivered'),
        supabase.from('submissions').select('stage')
          .eq('user_id', userId).neq('stage', 'delivered')
          .order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('coach_bookings').select('coach_name, slot_date, slot_label, status')
          .eq('user_id', userId).gte('slot_date', todayIso).neq('status', 'cancelled')
          .order('slot_date', { ascending: true }).limit(1).maybeSingle(),
      ]).catch(() => [{ count: 0 }, { data: null }, { data: null }])
      if (cancelled) return
      setActiveCount(count || 0)
      setLatestStage(latest?.stage || null)
      setNextBooking(booking || null)
      setLoading(false)
      setLoaded(true)
    }
    load()
    return () => { cancelled = true }
  }, [expanded, loaded, userId])

  const submissionValue = loading
    ? 'Loading…'
    : activeCount === 0
      ? 'Nothing in progress right now'
      : `${activeCount} in progress · ${STAGE_LABEL[latestStage] || 'In progress'}`

  const bookingValue = loading
    ? 'Loading…'
    : nextBooking
      ? `${nextBooking.coach_name} · ${nextBooking.slot_label || nextBooking.slot_date}`
      : 'No upcoming sessions booked'

  return (
    <Animated.View style={[styles.wrap, { height: heightAnim }]}>
      {/* Measured on this outer, auto-sized wrapper rather than `panel`
          directly — a parent's auto height includes a child's own margin
          box, so this correctly captures panel's trailing marginBottom
          (the gap before Quick Access's cards below) as part of
          `contentHeight` too, not just the rows themselves. */}
      <View onLayout={handleContentLayout}>
        <View style={styles.panel}>
          <StatRow
            Icon={Bell}
            label="Notifications"
            value={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            onPress={() => navigation.navigate('Notifications')}
          />
          <StatRow
            Icon={FileText}
            label="Foundation Blueprint"
            value={submissionValue}
            onPress={() => navigation.navigate('MyOutputs')}
          />
          <StatRow
            Icon={Users}
            label="Coaching"
            value={bookingValue}
            onPress={() => navigation.navigate('Elevation')}
          />
          <StatRow
            Icon={Award}
            label="Membership"
            value={isComplimentaryPro ? 'Complimentary Pro — active' : 'Standard'}
          />
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden' },
  panel: {
    backgroundColor: colors.white, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
    paddingVertical: 4, marginBottom: 14,
    ...shadows.card,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  rowIconWrap: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: 'rgba(30,58,95,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  rowValue: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.navy, marginTop: 1 },
})
