/**
 * Course Connect Q&A (founder picks r3-18 merge, r3-19 B).
 *
 * List: question cards (option A) that can switch to answer count first rows
 * (option B) with the switch at the top. Filters: Newest, Unanswered, a search
 * and a filter button for course or programme. Thread: the question in its own
 * card, then answers with a Helpful pill and a Top answer mark, and an answer
 * bar pinned at the bottom. Route params: { openAsk?, openQuestionId? }.
 * Opening a question pushes the screen again with openQuestionId, so Back works.
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Plus, Search, Send, Flag, UserX, ThumbsUp, SlidersHorizontal, LayoutList, Hash, HelpCircle } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import Sheet, { FieldLabel } from '../components/campusConnect/Sheet'
import { Card, Chip, Pill, EmptyNote, PrimaryButton, useTone } from '../components/campusConnect/CampusKit'
import { fonts } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useReport } from '../components/safety/ReportProvider'
import { useBlockedIds } from '../lib/reporting'
import { checkText, GUIDELINES_MESSAGE } from '../lib/moderation'
import { timeAgo, initialsOf } from '../lib/campus'

const AVATAR_COLORS = ['#3B5B8C', '#A5607A', '#5B8C75', '#8C6B3B', '#6B5B8C']
const avatarColor = id => AVATAR_COLORS[(String(id || '').charCodeAt(0) || 0) % AVATAR_COLORS.length]

export default function ModuleQAScreen({ navigation, route }) {
  const openQuestionId = route?.params?.openQuestionId
  return openQuestionId
    ? <Thread navigation={navigation} questionId={openQuestionId} />
    : <QuestionList navigation={navigation} openAsk={!!route?.params?.openAsk} />
}

// ── List ────────────────────────────────────────────────────────────────────
function QuestionList({ navigation, openAsk }) {
  const { colors, accent, tint } = useTone('course')
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const blocked = useBlockedIds(user?.id)
  const [questions, setQuestions] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState(null)
  const [countsFirst, setCountsFirst] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [askOpen, setAskOpen] = useState(openAsk)
  const [course, setCourse] = useState('')
  const [topic, setTopic] = useState('')
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setFailed(false)
    const [q, a] = await Promise.all([
      supabase.from('module_questions').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('module_answers').select('question_id'),
    ])
    if (q.error) { setFailed(true); setLoading(false); return }
    const c = {}
    ;(a.data || []).forEach(r => { c[r.question_id] = (c[r.question_id] || 0) + 1 })
    setCounts(c)
    setQuestions(q.data || [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const courses = useMemo(() => [...new Set(questions.map(q => (q.course || '').trim()).filter(Boolean))].slice(0, 30), [questions])
  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return questions
      .filter(q => !blocked.has(q.user_id))
      .filter(q => sort !== 'unanswered' || !counts[q.id])
      .filter(q => !courseFilter || (q.course || '').trim() === courseFilter)
      .filter(q => !needle || [q.question_text, q.course, q.module].some(v => (v || '').toLowerCase().includes(needle)))
  }, [questions, blocked, sort, counts, courseFilter, search])

  async function ask() {
    const t = text.trim()
    if (!course.trim() || !t) { setErr('Add where it is from and your question.'); return }
    if (!checkText(`${course} ${topic} ${t}`).ok) { setErr(GUIDELINES_MESSAGE); return }
    setSaving(true); setErr(null)
    const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'A member'
    const { data, error } = await supabase.from('module_questions').insert({
      user_id: user.id, poster_name: name, course: course.trim(), module: topic.trim() || 'General', question_text: t,
    }).select().single()
    setSaving(false)
    if (error) { setErr(String(error.message).includes('feed_text_guard') ? GUIDELINES_MESSAGE : 'Could not post your question. Please try again.'); return }
    setQuestions(p => [data, ...p])
    setAskOpen(false); setCourse(''); setTopic(''); setText('')
  }

  const open = q => navigation.push('ModuleQA', { openQuestionId: q.id })

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
        <PageTitle title="Q&A" subtitle="Ask anyone on the course of life." />
        <View style={s.body}>
          <View style={s.searchRow}>
            <View style={[s.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Search size={18} color={colors.textSecondary} strokeWidth={1.8} />
              <TextInput value={search} onChangeText={setSearch} placeholder="Search questions" placeholderTextColor={colors.textTertiary}
                style={[s.input, { color: colors.textPrimary }]} accessibilityLabel="Search questions" />
            </View>
            <TouchableOpacity onPress={() => setFilterOpen(true)} accessibilityRole="button" accessibilityLabel="Filter by course"
              style={[s.filterBtn, { backgroundColor: courseFilter ? colors.accentBg : colors.surface, borderColor: colors.border }]}>
              <SlidersHorizontal size={20} color={courseFilter ? colors.accentFg : colors.textPrimary} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>
          <View style={s.chips}>
            <Chip kind="course" label="Newest" active={sort === 'newest'} onPress={() => setSort('newest')} />
            <Chip kind="course" label="Unanswered" active={sort === 'unanswered'} onPress={() => setSort('unanswered')} />
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => setCountsFirst(v => !v)} accessibilityRole="button" accessibilityLabel={countsFirst ? 'Show question cards' : 'Show answer counts first'} style={s.viewBtn}>
              {countsFirst ? <LayoutList size={20} color={accent} strokeWidth={1.8} /> : <Hash size={20} color={accent} strokeWidth={1.8} />}
            </TouchableOpacity>
          </View>
          {!!courseFilter && (
            <TouchableOpacity onPress={() => setCourseFilter(null)} style={{ marginTop: 10 }} accessibilityRole="button">
              <Text style={[s.small, { color: accent, fontFamily: fonts.sansSemiBold }]}>{courseFilter}. Clear filter</Text>
            </TouchableOpacity>
          )}

          {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.textPrimary} />
          : failed ? (
            <View style={{ marginTop: 16 }}>
              <EmptyNote kind="course" title="Could not load questions" body="Check your connection and try again.">
                <PrimaryButton label="Try again" onPress={load} />
              </EmptyNote>
            </View>
          ) : shown.length === 0 ? (
            <View style={{ marginTop: 16 }}>
              <EmptyNote Icon={HelpCircle} title={questions.length ? 'No questions match' : 'No questions yet'} body={questions.length ? 'Try a different filter or search.' : 'Ask the first one. Anyone on the course of life can answer.'}>
                <PrimaryButton label="Ask a question" onPress={() => setAskOpen(true)} />
              </EmptyNote>
            </View>
          ) : shown.map(q => {
            const n = counts[q.id] || 0
            return (
              <Card key={q.id} style={{ marginTop: 12 }} onPress={() => open(q)} accessibilityLabel={`${q.question_text}. ${n} answers`}>
                {countsFirst ? (
                  <View style={s.row}>
                    <View style={[s.count, n ? { backgroundColor: tint } : { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border }]}>
                      <Text style={[s.countNum, { color: n ? accent : colors.textSecondary }]}>{n}</Text>
                      <Text style={[s.countLab, { color: n ? accent : colors.textSecondary }]}>{n === 1 ? 'answer' : 'answers'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.q, { color: colors.textPrimary }]} numberOfLines={3}>{q.question_text}</Text>
                      <Text style={[s.small, { color: colors.textSecondary, marginTop: 4 }]} numberOfLines={1}>{q.course}, {timeAgo(q.created_at)}</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={s.tags}>
                      <Pill kind="course" tone="accent" label={q.course} />
                      {!!q.module && q.module !== 'General' && <Pill label={q.module} />}
                    </View>
                    <Text style={[s.q, { color: colors.textPrimary, marginTop: 10 }]} numberOfLines={4}>{q.question_text}</Text>
                    <View style={s.foot}>
                      <Text style={[s.small, { color: colors.textSecondary, flex: 1 }]} numberOfLines={1}>{q.poster_name || 'A member'}, {timeAgo(q.created_at)}</Text>
                      <Text style={[s.small, { color: n ? accent : colors.textSecondary, fontFamily: fonts.sansSemiBold }]}>{n ? `${n} answer${n === 1 ? '' : 's'}` : 'Unanswered'}</Text>
                    </View>
                  </>
                )}
              </Card>
            )
          })}
        </View>
      </ScrollView>

      <View style={[s.fabWrap, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none">
        <PrimaryButton label="Ask a question" Icon={Plus} onPress={() => { setErr(null); setAskOpen(true) }} style={{ marginTop: 0 }} />
      </View>

      <Sheet visible={filterOpen} onClose={() => setFilterOpen(false)} title="Filter" subtitle="Course, programme or workplace">
        {courses.length === 0 ? <Text style={[s.small, { color: colors.textSecondary }]}>Filters appear once questions are asked.</Text> : (
          <View style={s.wrap}>
            {courses.map(c => <Chip kind="course" key={c} label={c} active={courseFilter === c} onPress={() => { setCourseFilter(courseFilter === c ? null : c); setFilterOpen(false) }} />)}
          </View>
        )}
      </Sheet>

      <Sheet visible={askOpen} onClose={() => setAskOpen(false)} title="Ask a question">
        <FieldLabel>Course, programme or workplace</FieldLabel>
        <TextInput value={course} onChangeText={setCourse} maxLength={80} placeholder="For example, Electrical apprenticeship" placeholderTextColor={colors.textTertiary}
          style={[s.field, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]} accessibilityLabel="Course, programme or workplace" />
        <FieldLabel>Topic (optional)</FieldLabel>
        <TextInput value={topic} onChangeText={setTopic} maxLength={60} placeholder="For example, Phase 4 or CS2001" placeholderTextColor={colors.textTertiary}
          style={[s.field, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]} accessibilityLabel="Topic" />
        <FieldLabel>Your question</FieldLabel>
        <TextInput value={text} onChangeText={setText} maxLength={600} multiline placeholder="What do you want to know?" placeholderTextColor={colors.textTertiary}
          style={[s.field, { height: 110, paddingTop: 14, textAlignVertical: 'top', backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]} accessibilityLabel="Your question" />
        {!!err && <Text style={[s.small, { color: colors.destructive, marginTop: 10 }]}>{err}</Text>}
        <PrimaryButton label={saving ? 'Posting' : 'Post question'} onPress={ask} disabled={saving} />
      </Sheet>
    </View>
  )
}

// ── Thread (option B) ───────────────────────────────────────────────────────
function Thread({ navigation, questionId }) {
  const { colors, accent, tint } = useTone('course')
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { openReport, openBlock } = useReport()
  const blocked = useBlockedIds(user?.id)
  const [q, setQ] = useState(null)
  const [answers, setAnswers] = useState([])
  const [votes, setVotes] = useState({})
  const [mine, setMine] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [a, b] = await Promise.all([
      supabase.from('module_questions').select('*').eq('id', questionId).maybeSingle(),
      supabase.from('module_answers').select('*').eq('question_id', questionId).order('created_at', { ascending: true }),
    ])
    if (!a.data) { setMissing(true); setLoading(false); return }
    const list = b.data || []
    const ids = list.map(x => x.id)
    const v = ids.length ? await supabase.from('qa_answer_votes').select('answer_id,user_id').in('answer_id', ids) : { data: [] }
    const c = {}; const m = new Set()
    ;(v.data || []).forEach(x => { c[x.answer_id] = (c[x.answer_id] || 0) + 1; if (x.user_id === user?.id) m.add(x.answer_id) })
    setQ(a.data); setAnswers(list); setVotes(c); setMine(m); setLoading(false)
  }, [questionId, user?.id])
  useEffect(() => { load() }, [load])

  const sorted = useMemo(() => [...answers].filter(x => !blocked.has(x.user_id)).sort((x, y) => (votes[y.id] || 0) - (votes[x.id] || 0) || new Date(x.created_at) - new Date(y.created_at)), [answers, votes, blocked])

  async function send() {
    const t = draft.trim()
    if (!t || saving) return
    if (!checkText(t).ok) { setErr(GUIDELINES_MESSAGE); return }
    setSaving(true); setErr(null)
    const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'A member'
    const { data, error } = await supabase.from('module_answers').insert({ question_id: questionId, user_id: user.id, poster_name: name, body: t }).select().single()
    setSaving(false)
    if (error) { setErr(String(error.message).includes('feed_text_guard') ? GUIDELINES_MESSAGE : 'Could not post your answer. Please try again.'); return }
    setAnswers(p => [...p, data]); setDraft('')
  }

  async function helpful(a) {
    if (a.user_id === user?.id) return
    const had = mine.has(a.id)
    setMine(p => { const n = new Set(p); had ? n.delete(a.id) : n.add(a.id); return n })
    setVotes(p => ({ ...p, [a.id]: Math.max(0, (p[a.id] || 0) + (had ? -1 : 1)) }))
    const res = had
      ? await supabase.from('qa_answer_votes').delete().eq('answer_id', a.id).eq('user_id', user.id)
      : await supabase.from('qa_answer_votes').insert({ answer_id: a.id, user_id: user.id })
    if (res.error) load()
  }

  return (
    <KeyboardAvoidingView style={[s.screen, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader navigation={navigation} showBack />
      {loading ? <ActivityIndicator style={{ marginTop: 60 }} color={colors.textPrimary} />
      : missing || !q ? (
        <View style={{ padding: 16 }}>
          <EmptyNote title="That question is not here" body="It may have been removed." />
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            <Card>
              <View style={s.tags}>
                <Pill kind="course" tone="accent" label={q.course} />
                {!!q.module && q.module !== 'General' && <Pill label={q.module} />}
              </View>
              <Text style={[s.qBig, { color: colors.textPrimary }]}>{q.question_text}</Text>
              <View style={s.who}>
                <View style={[s.avatar, { backgroundColor: avatarColor(q.user_id) }]}><Text style={s.avatarText}>{initialsOf(q.poster_name)}</Text></View>
                <Text style={[s.small, { color: colors.textSecondary, flex: 1 }]}>{q.poster_name || 'A member'}, {timeAgo(q.created_at)}</Text>
                {q.user_id !== user?.id && (
                  <>
                    <TouchableOpacity onPress={() => openReport({ contentType: 'module_questions', contentId: q.id, reportedUserId: q.user_id, userName: q.poster_name, noun: 'question' })} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Report this question">
                      <Flag size={18} color={colors.textSecondary} strokeWidth={1.8} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openBlock({ contentType: 'module_questions', contentId: q.id, reportedUserId: q.user_id, userName: q.poster_name })} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Block this member">
                      <UserX size={18} color={colors.textSecondary} strokeWidth={1.8} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </Card>

            <View style={s.ansHead}>
              <Text style={[s.ansTitle, { color: colors.textPrimary }]}>{sorted.length} answer{sorted.length === 1 ? '' : 's'}</Text>
              {sorted.length > 1 && <Text style={[s.small, { color: colors.textSecondary, letterSpacing: 0.8, fontFamily: fonts.sansBold }]}>MOST HELPFUL FIRST</Text>}
            </View>

            {sorted.length === 0 && <Text style={[s.small, { color: colors.textSecondary }]}>No answers yet. Be the first to help.</Text>}
            {sorted.map((a, i) => {
              const n = votes[a.id] || 0
              const on = mine.has(a.id)
              return (
                <Card key={a.id} style={{ marginBottom: 12 }}>
                  <View style={s.who}>
                    <View style={[s.avatar, { backgroundColor: avatarColor(a.user_id) }]}><Text style={s.avatarText}>{initialsOf(a.poster_name)}</Text></View>
                    <Text style={[s.name, { color: colors.textPrimary }]} numberOfLines={1}>{a.poster_name || 'A member'}</Text>
                    <Text style={[s.small, { color: colors.textSecondary, flex: 1 }]}>{timeAgo(a.created_at)}</Text>
                    {a.user_id !== user?.id && (
                      <>
                        <TouchableOpacity onPress={() => openReport({ contentType: 'module_answers', contentId: a.id, reportedUserId: a.user_id, userName: a.poster_name, noun: 'answer' })} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Report this answer">
                          <Flag size={17} color={colors.textSecondary} strokeWidth={1.8} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => openBlock({ contentType: 'module_answers', contentId: a.id, reportedUserId: a.user_id, userName: a.poster_name })} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Block this member">
                          <UserX size={17} color={colors.textSecondary} strokeWidth={1.8} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                  <Text style={[s.body2, { color: colors.textPrimary }]}>{a.body}</Text>
                  <View style={s.pillRow}>
                    <TouchableOpacity
                      onPress={() => helpful(a)}
                      disabled={a.user_id === user?.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`Helpful, ${n}`}
                      style={[s.helpful, on ? { backgroundColor: colors.accentBg, borderColor: colors.accentBg } : { borderColor: colors.border }]}
                    >
                      <ThumbsUp size={16} color={on ? colors.accentFg : colors.textPrimary} strokeWidth={1.8} />
                      <Text style={[s.helpfulText, { color: on ? colors.accentFg : colors.textPrimary }]}>Helpful {n}</Text>
                    </TouchableOpacity>
                    {i === 0 && n > 0 && <Pill kind="course" tone="accent" label="Top answer" />}
                  </View>
                </Card>
              )
            })}
          </ScrollView>

          <View style={[s.bar, { backgroundColor: colors.background, borderTopColor: colors.divider, paddingBottom: insets.bottom + 10 }]}>
            {!!err && <Text style={[s.small, { color: colors.destructive, marginBottom: 6 }]}>{err}</Text>}
            <View style={[s.answerBox, { backgroundColor: colors.surfaceSunk }]}>
              <TextInput value={draft} onChangeText={setDraft} placeholder="Write an answer" placeholderTextColor={colors.textTertiary} maxLength={1000} multiline
                style={[s.answerInput, { color: colors.textPrimary }]} accessibilityLabel="Write an answer" />
              <TouchableOpacity onPress={send} disabled={!draft.trim() || saving} accessibilityRole="button" accessibilityLabel="Send answer"
                style={[s.send, { backgroundColor: colors.accentBg, opacity: !draft.trim() || saving ? 0.45 : 1 }]}>
                <Send size={18} color={colors.accentFg} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, height: 52 },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 16 },
  filterBtn: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  viewBtn: { padding: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  q: { fontFamily: fonts.sansSemiBold, fontSize: 16.5, lineHeight: 24 },
  qBig: { fontFamily: fonts.serif, fontSize: 25, lineHeight: 32, marginTop: 14 },
  small: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  count: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  countNum: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 30 },
  countLab: { fontFamily: fonts.sansMedium, fontSize: 11 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontFamily: fonts.sansBold, fontSize: 12 },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 15, flexShrink: 1 },
  iconBtn: { padding: 6 },
  ansHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 12 },
  ansTitle: { fontFamily: fonts.serif, fontSize: 24 },
  body2: { fontFamily: fonts.sans, fontSize: 15.5, lineHeight: 23, marginTop: 12 },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  helpful: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
  helpfulText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  bar: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  answerBox: { flexDirection: 'row', alignItems: 'flex-end', borderRadius: 26, paddingLeft: 18, paddingRight: 6, paddingVertical: 6 },
  answerInput: { flex: 1, fontFamily: fonts.sans, fontSize: 16, maxHeight: 110, paddingVertical: 8 },
  send: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  field: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 52, fontFamily: fonts.sans, fontSize: 16 },
  fabWrap: { position: 'absolute', left: 16, right: 16, bottom: 0, alignItems: 'flex-end' },
})
