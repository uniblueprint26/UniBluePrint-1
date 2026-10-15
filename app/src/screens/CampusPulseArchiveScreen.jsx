/**
 * CampusPulseArchiveScreen — "Past Weeks" for Campus Pulse (see
 * CampusPulseCard.jsx and supabase/migrations/20261015140000_campus_pulse.sql).
 * Desmond was explicit that the archive be "on-brand and easy to access" —
 * a real browsable view, not a buried status flag. An expandable list: one
 * row per past week's prompt, tap to reveal that week's archived responses
 * in a plain chronological list. No streaks, no vote counts, no ranking.
 *
 * A "past week" is any prompt with week_start set that isn't the current
 * active one — the seeded-but-not-yet-rotated-to prompts further down the
 * rotation have week_start = null and never show up here (see the
 * migration's seed comment).
 */
import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { ChevronDown, ChevronUp, Archive } from 'lucide-react-native'
import Card from '../components/ui/Card'
import ScreenHeader from '../components/ui/ScreenHeader'
import { fonts, spacing, radius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useSafeGoBack } from '../hooks/useSafeGoBack'
import { supabase } from '../lib/supabase'

function formatWeekRange(startStr, endStr) {
  const opts = { day: 'numeric', month: 'short' }
  const start = new Date(startStr).toLocaleDateString('en-IE', opts)
  const end = endStr ? new Date(new Date(endStr).getTime() - 86400000).toLocaleDateString('en-IE', opts) : null
  return end ? `${start} – ${end}` : start
}

function formatTimestamp(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CampusPulseArchiveScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = getStyles(colors)
  const insets = useSafeAreaInsets()
  const safeGoBack = useSafeGoBack(navigation, 'CampusConnect')

  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [responsesByPrompt, setResponsesByPrompt] = useState({})
  const [loadingResponsesFor, setLoadingResponsesFor] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('campus_pulse_prompts')
      .select('*')
      .eq('active', false)
      .not('week_start', 'is', null)
      .order('week_start', { ascending: false })
    setPrompts(data || [])
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  async function toggleExpand(promptItem) {
    const id = promptItem.id
    if (expanded === id) {
      setExpanded(null)
      return
    }
    setExpanded(id)
    if (responsesByPrompt[id]) return
    setLoadingResponsesFor(id)
    const { data } = await supabase
      .from('campus_pulse_responses')
      .select('*')
      .eq('prompt_id', id)
      .order('created_at', { ascending: false })
    setResponsesByPrompt(prev => ({ ...prev, [id]: data || [] }))
    setLoadingResponsesFor(null)
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        compact
        variant="navy"
        onBack={safeGoBack}
        backLabel="Campus Connect"
        title="Past Weeks"
        subtitle="Campus Pulse archive"
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introRow}>
          <Archive size={16} color={colors.muted} strokeWidth={2} />
          <Text style={styles.introText}>
            Every past Campus Pulse prompt and the replies it got, kept here rather than deleted.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={colors.textPrimary} style={{ marginTop: spacing.xl }} />
        ) : prompts.length === 0 ? (
          <Text style={styles.emptyText}>No past weeks yet — check back once this week's prompt rotates.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {prompts.map(p => {
              const isOpen = expanded === p.id
              const weekResponses = responsesByPrompt[p.id]
              return (
                <Card key={p.id} style={styles.weekCard}>
                  <TouchableOpacity
                    style={styles.weekHeaderRow}
                    activeOpacity={0.8}
                    onPress={() => toggleExpand(p)}
                    accessibilityRole="button"
                    accessibilityLabel={`${isOpen ? 'Collapse' : 'Expand'} week of ${formatWeekRange(p.week_start, p.week_end)}`}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.weekRange}>{formatWeekRange(p.week_start, p.week_end)}</Text>
                      <Text style={styles.weekPrompt}>{p.prompt_text}</Text>
                    </View>
                    {isOpen ? <ChevronUp size={18} color={colors.muted} /> : <ChevronDown size={18} color={colors.muted} />}
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.responsesWrap}>
                      {loadingResponsesFor === p.id ? (
                        <ActivityIndicator size="small" color={colors.textPrimary} style={{ marginTop: 10 }} />
                      ) : !weekResponses || weekResponses.length === 0 ? (
                        <Text style={styles.noResponsesText}>Nobody replied to this one.</Text>
                      ) : (
                        weekResponses.map(r => (
                          <View key={r.id} style={styles.responseRow}>
                            <Text style={styles.responseMeta}>{r.poster_name || 'A student'} · {formatTimestamp(r.created_at)}</Text>
                            <Text style={styles.responseBody}>{r.content}</Text>
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </Card>
              )
            })}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

function getStyles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
    introRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: spacing.md },
    introText: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, lineHeight: 18 },
    emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, fontStyle: 'italic', textAlign: 'center', paddingVertical: spacing.xl },
    weekCard: { padding: 16 },
    weekHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    weekRange: {
      fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.muted,
      textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4,
    },
    weekPrompt: { fontFamily: fonts.serif, fontSize: 16, color: colors.textPrimary, lineHeight: 22 },
    responsesWrap: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.divider, gap: 12 },
    noResponsesText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, fontStyle: 'italic' },
    responseRow: {},
    responseMeta: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.muted, marginBottom: 3 },
    responseBody: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textPrimary, lineHeight: 19 },
  })
}
