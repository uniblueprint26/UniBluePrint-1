import { useState, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Check, Lock, CalendarClock, Trophy } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import EmptyState from '../components/ui/EmptyState'
import ErrorState from '../components/ui/ErrorState'
import { Card, Pill, useTone } from '../components/campusConnect/CampusKit'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useAwardsWindow } from '../hooks/useAppFlags'
import {
  AWARDS_ISSUE_LABEL, collectAwardCategories, nomineeKey, nomineeName,
  stableShuffle, dayMonth, votingPhase,
} from '../lib/awards'
import { fonts } from '../constants/theme'

// UBP Awards voting, Ireland 2026 (issue 1 of the Weekly Blueprint).
//
// Nominees come from the issue's published wrapped content (see lib/awards.js).
// Votes are saved only through the cast_award_vote function, which checks the
// voting window again on the server. This screen never asks for results:
// members do not see counts, and winners are announced in issue 2.
//
// Nominees are shown in an order that is random between members but the same
// every time for one member. They are never ranked.

export default function AwardsVotingScreen({ navigation }) {
  const { colors, accent, tint } = useTone('course')
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { opens, closes } = useAwardsWindow()
  const [state, setState] = useState({ status: 'loading', issue: null, categories: [] })
  const [votes, setVotes] = useState({})       // category key -> nominee key
  const [editing, setEditing] = useState({})   // category key -> true while changing a vote
  const [saving, setSaving] = useState({})
  const [errors, setErrors] = useState({})

  const load = useCallback(async () => {
    setState(s => ({ ...s, status: s.categories.length ? s.status : 'loading' }))
    try {
      const { data, error } = await supabase.rpc('get_current_weekly_issue')
      if (error) throw error
      const issue = data?.[0] || null
      const categories = issue ? collectAwardCategories(issue.content?.wrapped) : []
      if (issue && categories.length) {
        const mine = await supabase.rpc('my_award_votes', { p_issue: issue.issue_number })
        const map = {}
        ;(mine.data || []).forEach(v => { map[v.category_key] = v.nominee_key })
        setVotes(map)
      }
      setState({ status: categories.length ? 'ready' : 'empty', issue, categories })
    } catch {
      setState(s => ({ ...s, status: 'error' }))
    }
  }, [])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const phase = votingPhase(opens, closes)
  const issueNumber = state.issue?.issue_number

  const ordered = useMemo(() => state.categories.map(c => ({
    ...c, nominees: stableShuffle(c.nominees, `${user?.id || 'guest'}:${c.key}`),
  })), [state.categories, user?.id])

  async function vote(cat, nominee) {
    const key = nomineeKey(nominee)
    if (!key || saving[cat.key] || phase !== 'open') return
    const previous = votes[cat.key]
    setErrors(e => ({ ...e, [cat.key]: null }))
    setSaving(s => ({ ...s, [cat.key]: true }))
    setVotes(v => ({ ...v, [cat.key]: key }))
    setEditing(e => ({ ...e, [cat.key]: false }))
    try {
      const { error } = await supabase.rpc('cast_award_vote', { p_issue: issueNumber, p_category: cat.key, p_nominee: key })
      if (error) throw error
    } catch (err) {
      setVotes(v => {
        const next = { ...v }
        if (previous) next[cat.key] = previous; else delete next[cat.key]
        return next
      })
      const closed = /closed/i.test(err?.message || '')
      setErrors(e => ({ ...e, [cat.key]: closed ? 'Voting is closed.' : 'Your vote did not save. Try again.' }))
    } finally {
      setSaving(s => ({ ...s, [cat.key]: false }))
    }
  }

  const votedCount = ordered.filter(c => votes[c.key]).length
  const nameFor = (cat, key) => {
    const n = cat.nominees.find(x => nomineeKey(x) === key)
    return n ? nomineeName(n) : key
  }

  function StatusCard() {
    let Icon = CalendarClock
    let title = ''
    let body = ''
    if (phase === 'open') {
      Icon = Trophy
      title = 'Voting is open'
      body = `Pick one nominee in each category. You can change your vote until ${dayMonth(closes)}.`
    } else if (phase === 'before') {
      title = opens ? `Voting opens ${dayMonth(opens)}` : 'Voting opens soon'
      body = 'Have a look at the nominees. You will be able to vote here when it opens.'
    } else {
      Icon = Lock
      title = 'Voting closed, winners in the next issue'
      body = 'Thank you to everyone who voted.'
    }
    return (
      <Card style={s.statusCard}>
        <View style={[s.statusIcon, { backgroundColor: tint }]}>
          <Icon size={22} color={accent} strokeWidth={1.8} />
        </View>
        <View style={s.statusText}>
          <Text style={[s.statusTitle, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[s.body, { color: colors.textSecondary }]}>{body}</Text>
          {phase !== 'after' && (
            <Text style={[s.small, { color: colors.textSecondary, marginTop: 6 }]}>Winners announced in issue 2</Text>
          )}
          {phase === 'open' && ordered.length > 0 && (
            <Pill label={`${votedCount} of ${ordered.length} voted`} tone={votedCount === ordered.length ? 'good' : 'accent'} kind="course" style={{ marginTop: 12 }} />
          )}
        </View>
      </Card>
    )
  }

  function NomineeRow({ cat, n, selected, canVote }) {
    const body = (
      <>
        {canVote && (
          <View style={[s.radio, { borderColor: selected ? accent : colors.textTertiary }, selected && { backgroundColor: accent }]}>
            {selected && <Check size={14} color={colors.surface} strokeWidth={3} />}
          </View>
        )}
        <View style={s.nomText}>
          <Text style={[s.nomName, { color: colors.textPrimary }]}>{nomineeName(n)}</Text>
          {!!n.why && <Text style={[s.nomWhy, { color: colors.textSecondary }]}>{n.why}</Text>}
          {!!n.source && <Text style={[s.nomSource, { color: colors.textTertiary }]}>Source: {n.source}</Text>}
        </View>
      </>
    )
    const rowKey = nomineeKey(n)
    const rowStyle = [s.nomRow, { borderColor: selected ? accent : colors.border, backgroundColor: colors.surface }]
    if (!canVote) return <View key={rowKey} style={rowStyle}>{body}</View>
    return (
      <TouchableOpacity
        key={rowKey}
        style={rowStyle}
        activeOpacity={0.8}
        onPress={() => vote(cat, n)}
        disabled={!!saving[cat.key]}
        accessibilityRole="radio"
        accessibilityState={{ selected, disabled: !!saving[cat.key] }}
        accessibilityLabel={`${nomineeName(n)}. ${n.why || ''}`}
      >
        {body}
      </TouchableOpacity>
    )
  }

  function CategoryBlock({ cat }) {
    const picked = votes[cat.key]
    const changing = !!editing[cat.key]
    const canVote = phase === 'open'
    const showList = phase === 'before' || (canVote && (!picked || changing))
    return (
      <View key={cat.key} style={s.cat}>
        <Text style={[s.catTitle, { color: colors.textPrimary }]}>{cat.title}</Text>
        {canVote && picked && !changing && (
          <Card style={s.votedCard}>
            <View style={[s.votedBadge, { backgroundColor: tint }]}>
              <Check size={16} color={accent} strokeWidth={2.6} />
              <Text style={[s.votedBadgeText, { color: accent }]}>Your vote is in</Text>
            </View>
            <Text style={[s.votedName, { color: colors.textPrimary }]}>{nameFor(cat, picked)}</Text>
            <TouchableOpacity
              onPress={() => setEditing(e => ({ ...e, [cat.key]: true }))}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={`Change your vote for ${cat.title}`}
              style={s.changeBtn}
            >
              <Text style={[s.changeText, { color: accent }]}>Change vote</Text>
            </TouchableOpacity>
          </Card>
        )}
        {phase === 'after' && picked && (
          <Card style={s.votedCard}>
            <Text style={[s.small, { color: colors.textSecondary }]}>You voted for</Text>
            <Text style={[s.votedName, { color: colors.textPrimary }]}>{nameFor(cat, picked)}</Text>
          </Card>
        )}
        {showList && (
          <View style={s.nomList} accessibilityRole="radiogroup">
            {cat.nominees.map(n => (
              NomineeRow({ cat, n, selected: canVote && picked === nomineeKey(n), canVote })
            ))}
            {canVote && picked && changing && (
              <TouchableOpacity
                onPress={() => setEditing(e => ({ ...e, [cat.key]: false }))}
                style={s.changeBtn}
                accessibilityRole="button"
                accessibilityLabel="Keep my vote"
              >
                <Text style={[s.changeText, { color: colors.textSecondary }]}>Keep my vote</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {!!errors[cat.key] && <Text style={[s.error, { color: colors.destructive }]}>{errors[cat.key]}</Text>}
      </View>
    )
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 48 }} showsVerticalScrollIndicator={false}>
        <PageTitle title="UBP Awards" subtitle={AWARDS_ISSUE_LABEL} />
        {state.status === 'loading' && <ActivityIndicator style={{ marginTop: 48 }} color={accent} />}
        {state.status === 'error' && (
          <ErrorState onRetry={load} />
        )}
        {state.status === 'empty' && (
          <EmptyState icon={Trophy} title="The awards are not live yet" subtitle="The nominees will be here when the Ireland 2026 issue is out." />
        )}
        {state.status === 'ready' && (
          <View style={s.pad}>
            {StatusCard()}
            {phase !== 'after' && ordered.map(cat => CategoryBlock({ cat }))}
            {phase === 'after' && ordered.filter(c => votes[c.key]).map(cat => CategoryBlock({ cat }))}
            {phase !== 'after' && (
              <Text style={[s.footer, { color: colors.textSecondary }]}>
                Nominees are in no particular order. Everyone sees them in a different order. One vote per category.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1 },
  pad: { paddingHorizontal: 16, paddingTop: 12 },
  statusCard: { flexDirection: 'row', gap: 14, padding: 18 },
  statusIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statusText: { flex: 1, minWidth: 0 },
  statusTitle: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 27, marginBottom: 4 },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 18 },
  cat: { marginTop: 32 },
  catTitle: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 30, marginBottom: 12 },
  nomList: { gap: 10 },
  nomRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  nomText: { flex: 1, minWidth: 0 },
  nomName: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 22 },
  nomWhy: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, marginTop: 2 },
  nomSource: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, marginTop: 6 },
  votedCard: { padding: 18, gap: 10 },
  votedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  votedBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  votedName: { fontFamily: fonts.sansSemiBold, fontSize: 18, lineHeight: 24 },
  changeBtn: { alignSelf: 'flex-start', paddingVertical: 6 },
  changeText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  error: { fontFamily: fonts.sansMedium, fontSize: 14, marginTop: 10 },
  footer: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, marginTop: 36, textAlign: 'center', paddingHorizontal: 12 },
})
