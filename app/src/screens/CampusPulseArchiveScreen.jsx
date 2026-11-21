import { useState, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Flag, UserX, MessageSquareQuote } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import { Card, EmptyNote, PrimaryButton, Stamp, useTone } from '../components/campusConnect/CampusKit'
import { useReport } from '../components/safety/ReportProvider'
import { useAuth } from '../context/AuthContext'
import { useBlockedIds } from '../lib/reporting'
import { supabase } from '../lib/supabase'
import { fonts } from '../constants/theme'

// Past weeks of Campus Pulse (founder pick r3-16 B): a timeline. One dot per
// past week with the question in serif, then one reply quoted and a link to the
// rest. Only real replies are shown. Every reply has Report and Block.

function range(startStr, endStr) {
  const o = { day: 'numeric', month: 'short' }
  const a = new Date(startStr).toLocaleDateString('en-IE', o)
  const b = endStr ? new Date(new Date(endStr).getTime() - 86400000).toLocaleDateString('en-IE', o) : null
  return b ? `${a} to ${b}` : a
}

export default function CampusPulseArchiveScreen({ navigation }) {
  const { colors, accent, tint } = useTone('campus')
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { openReport, openBlock } = useReport()
  const blocked = useBlockedIds(user?.id)
  const [prompts, setPrompts] = useState([])
  const [replies, setReplies] = useState({})
  const [open, setOpen] = useState({})
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setFailed(false)
    const a = await supabase.from('campus_pulse_prompts').select('*').eq('active', false).not('week_start', 'is', null).order('week_start', { ascending: false })
    if (a.error) { setFailed(true); setLoading(false); return }
    const list = a.data || []
    setPrompts(list)
    if (list.length) {
      const b = await supabase.from('campus_pulse_responses').select('*').in('prompt_id', list.map(p => p.id)).order('created_at', { ascending: false }).limit(500)
      const map = {}
      ;(b.data || []).forEach(r => { (map[r.prompt_id] = map[r.prompt_id] || []).push(r) })
      setReplies(map)
    }
    setLoading(false)
  }, [])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const visible = useMemo(() => {
    const out = {}
    Object.keys(replies).forEach(k => { out[k] = replies[k].filter(r => !blocked.has(r.user_id)) })
    return out
  }, [replies, blocked])

  function Reply({ r }) {
    const own = r.user_id === user?.id
    return (
      <View style={[s.quote, { borderLeftColor: accent }]}>
        <Text style={[s.quoteText, { color: colors.textPrimary }]}>{r.content}</Text>
        <View style={s.quoteFoot}>
          <Text style={[s.small, { color: colors.textSecondary, flex: 1 }]}>{r.poster_name || 'A member'}, {new Date(r.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}</Text>
          {!own && (
            <>
              <TouchableOpacity onPress={() => openReport({ contentType: 'campus_pulse_response', contentId: r.id, reportedUserId: r.user_id, userName: r.poster_name, noun: 'reply' })} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Report this reply">
                <Flag size={16} color={colors.textSecondary} strokeWidth={1.8} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openBlock({ contentType: 'campus_pulse_response', contentId: r.id, reportedUserId: r.user_id, userName: r.poster_name })} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Block this member">
                <UserX size={16} color={colors.textSecondary} strokeWidth={1.8} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    )
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <PageTitle title="Past weeks" subtitle="Every Campus Pulse question and what people said." />
        <View style={s.body}>
          {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.textPrimary} />
          : failed ? (
            <EmptyNote title="Could not load past weeks" body="Check your connection and try again.">
              <PrimaryButton label="Try again" onPress={load} />
            </EmptyNote>
          ) : prompts.length === 0 ? (
            <EmptyNote Icon={MessageSquareQuote} title="No past weeks yet" body="Once this week's question moves on, it and its replies are kept here." />
          ) : prompts.map((p, i) => {
            const rs = visible[p.id] || []
            const isOpen = !!open[p.id]
            return (
              <View key={p.id} style={s.item}>
                <View style={s.rail}>
                  <View style={[s.dot, { backgroundColor: accent }]} />
                  {i < prompts.length - 1 && <View style={[s.line, { backgroundColor: colors.divider }]} />}
                </View>
                <View style={{ flex: 1, paddingBottom: 26 }}>
                  <View style={s.head}>
                    <Text style={[s.range, { color: accent }]}>{range(p.week_start, p.week_end).toUpperCase()}</Text>
                    {p.is_ubp !== false && <Stamp label="From UBP" />}
                  </View>
                  <Text style={[s.q, { color: colors.textPrimary }]}>{p.prompt_text}</Text>
                  {rs.length === 0 ? (
                    <Text style={[s.small, { color: colors.textSecondary, marginTop: 8 }]}>No replies this week.</Text>
                  ) : (
                    <>
                      <Reply r={rs[0]} />
                      {isOpen && rs.slice(1).map(r => <Reply key={r.id} r={r} />)}
                      {rs.length > 1 && (
                        <TouchableOpacity onPress={() => setOpen(o => ({ ...o, [p.id]: !isOpen }))} style={{ marginTop: 10 }} accessibilityRole="button">
                          <Text style={[s.link, { color: accent }]}>{isOpen ? 'Show fewer' : `See all ${rs.length} replies`}</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 12 },
  item: { flexDirection: 'row', gap: 14 },
  rail: { width: 16, alignItems: 'center', paddingTop: 4 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  line: { width: 2, flex: 1, marginTop: 4 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  range: { fontFamily: fonts.sansBold, fontSize: 12, letterSpacing: 1 },
  q: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 29, marginTop: 6 },
  quote: { borderLeftWidth: 3, paddingLeft: 12, marginTop: 12 },
  quoteText: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
  quoteFoot: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  iconBtn: { padding: 8 },
  link: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
})
