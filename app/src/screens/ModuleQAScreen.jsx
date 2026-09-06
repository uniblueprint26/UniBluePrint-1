/**
 * ModuleQAScreen — Course Connect's Module Q&A.
 *
 * Bespoke rather than routed through the generic board engine (per the
 * Phase 5 brief) because the shape is genuinely different: a question with
 * a course + module selected up front, then a thread of answers underneath
 * it with their own upvote system — not a flat list of posts. Styling
 * conventions (hero block, Card, filter bar, upvote pill) are lifted
 * straight from BoardDetailScreen for visual consistency.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet,
  ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Plus, MessageSquare, ThumbsUp, X, Search, Send, Check } from 'lucide-react-native'

import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

export default function ModuleQAScreen({ navigation, route }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'A student'
  const openAsk = route?.params?.openAsk

  const [questions, setQuestions] = useState([])
  const [answerCounts, setAnswerCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [askOpen, setAskOpen] = useState(false)
  const [askCourse, setAskCourse] = useState('')
  const [askModule, setAskModule] = useState('')
  const [askText, setAskText] = useState('')
  const [askSaving, setAskSaving] = useState(false)
  const [askError, setAskError] = useState(null)

  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [myVotes, setMyVotes] = useState(new Set())
  const [voteCounts, setVoteCounts] = useState({})
  const [answerDraft, setAnswerDraft] = useState('')
  const [answerSaving, setAnswerSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: qs }, { data: allAnswers }] = await Promise.all([
      supabase.from('module_questions').select('*').order('created_at', { ascending: false }),
      supabase.from('module_answers').select('question_id'),
    ])
    const counts = {}
    ;(allAnswers || []).forEach(a => { counts[a.question_id] = (counts[a.question_id] || 0) + 1 })
    setAnswerCounts(counts)
    setQuestions(qs || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (openAsk) setAskOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = questions.filter(q => {
    if (!search.trim()) return true
    const s = search.trim().toLowerCase()
    return (q.course || '').toLowerCase().includes(s) || (q.module || '').toLowerCase().includes(s)
  })

  function resetAsk() {
    setAskCourse(''); setAskModule(''); setAskText(''); setAskError(null)
  }

  async function submitQuestion() {
    if (!askCourse.trim() || !askModule.trim() || !askText.trim()) {
      setAskError('Course, module, and your question are all required.')
      return
    }
    setAskSaving(true)
    setAskError(null)
    try {
      const { data, error } = await supabase.from('module_questions').insert({
        user_id: user.id, poster_name: displayName,
        course: askCourse.trim(), module: askModule.trim(), question_text: askText.trim(),
      }).select().single()
      if (error) throw error
      setQuestions(prev => [data, ...prev])
      resetAsk()
      setAskOpen(false)
    } catch {
      setAskError('Could not post your question. Please try again.')
    } finally {
      setAskSaving(false)
    }
  }

  async function openThread(q) {
    setSelected(q)
    const [{ data: ans }, { data: votes }] = await Promise.all([
      supabase.from('module_answers').select('*').eq('question_id', q.id).order('created_at', { ascending: true }),
      supabase.from('qa_answer_votes').select('answer_id,user_id'),
    ])
    const counts = {}
    const mine = new Set()
    ;(votes || []).forEach(v => {
      counts[v.answer_id] = (counts[v.answer_id] || 0) + 1
      if (v.user_id === user?.id) mine.add(v.answer_id)
    })
    setVoteCounts(counts)
    setMyVotes(mine)
    setAnswers((ans || []).sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0) || new Date(a.created_at) - new Date(b.created_at)))
  }

  async function postAnswer() {
    if (!answerDraft.trim() || answerSaving) return
    setAnswerSaving(true)
    const { data, error } = await supabase.from('module_answers').insert({
      question_id: selected.id, user_id: user.id, poster_name: displayName, body: answerDraft.trim(),
    }).select().single()
    setAnswerSaving(false)
    if (!error) {
      setAnswers(prev => [...prev, data])
      setAnswerDraft('')
      setAnswerCounts(prev => ({ ...prev, [selected.id]: (prev[selected.id] || 0) + 1 }))
    }
  }

  async function toggleVote(answer) {
    const already = myVotes.has(answer.id)
    if (already) await supabase.from('qa_answer_votes').delete().eq('answer_id', answer.id).eq('user_id', user.id)
    else await supabase.from('qa_answer_votes').insert({ answer_id: answer.id, user_id: user.id })
    setMyVotes(prev => { const next = new Set(prev); already ? next.delete(answer.id) : next.add(answer.id); return next })
    setVoteCounts(prev => {
      const next = { ...prev, [answer.id]: (prev[answer.id] || 0) + (already ? -1 : 1) }
      setAnswers(a => [...a].sort((x, y) => (next[y.id] || 0) - (next[x.id] || 0) || new Date(x.created_at) - new Date(y.created_at)))
      return next
    })
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.heroBlock, { paddingTop: insets.top + 8 }]}>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
              <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
              <Text style={styles.backBtnText}>Course Connect</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroIcon}>❓</Text>
          <Text style={styles.heroTitle}>Module Q&A</Text>
          <Text style={styles.heroSub}>Select your course and module, ask a question, and get answers from students who've been there.</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.filterSearch}>
            <Search size={13} color={colors.muted} />
            <TextInput
              style={styles.filterSearchInput}
              placeholder="Filter by course or module"
              placeholderTextColor={colors.light}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <TouchableOpacity style={styles.postBtn} activeOpacity={0.85} onPress={() => setAskOpen(true)}>
            <Plus size={15} color={colors.cream} />
            <Text style={styles.postBtnText}>Ask a Question</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="small" color={colors.navy} style={{ marginTop: spacing.xl }} />
          ) : filtered.length === 0 ? (
            <Text style={styles.emptyText}>No questions yet — be the first to ask.</Text>
          ) : (
            <View style={{ gap: 10, marginTop: spacing.md }}>
              {filtered.map(q => (
                <TouchableOpacity key={q.id} activeOpacity={0.85} onPress={() => openThread(q)}>
                  <Card style={styles.card}>
                    <View style={styles.metaRow}>
                      <View style={styles.metaPill}><Text style={styles.metaPillText}>{q.course}</Text></View>
                      <View style={styles.metaPill}><Text style={styles.metaPillText}>{q.module}</Text></View>
                    </View>
                    <Text style={styles.cardBody} numberOfLines={3}>{q.question_text}</Text>
                    <View style={[styles.metaRow, { marginTop: 10, justifyContent: 'space-between' }]}>
                      <Text style={styles.posterLine}>{q.poster_name || 'A student'} · {timeAgo(q.created_at)}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <MessageSquare size={12} color={colors.muted} />
                        <Text style={styles.viewSolutionsText}>{answerCounts[q.id] || 0} answer{(answerCounts[q.id] || 0) !== 1 ? 's' : ''}</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Ask a question */}
      <Modal visible={askOpen} transparent animationType="slide" onRequestClose={() => setAskOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={f.backdrop}>
          <View style={f.sheet}>
            <View style={f.headerRow}>
              <Text style={f.title}>Ask a Question</Text>
              <TouchableOpacity onPress={() => { resetAsk(); setAskOpen(false) }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityRole="button" accessibilityLabel="Close">
                <X size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={f.label}>Course</Text>
              <TextInput style={f.input} value={askCourse} onChangeText={setAskCourse} placeholder="e.g. Computer Science, UCD" placeholderTextColor={colors.light} />
              <Text style={[f.label, { marginTop: 14 }]}>Module</Text>
              <TextInput style={f.input} value={askModule} onChangeText={setAskModule} placeholder="e.g. CS2001 Data Structures" placeholderTextColor={colors.light} />
              <Text style={[f.label, { marginTop: 14 }]}>Your question</Text>
              <TextInput
                style={[f.input, { minHeight: 84 }]}
                value={askText}
                onChangeText={setAskText}
                placeholder="What are you stuck on?"
                placeholderTextColor={colors.light}
                multiline
                textAlignVertical="top"
              />
              {!!askError && <Text style={f.error}>{askError}</Text>}
              <TouchableOpacity style={[f.submitBtn, askSaving && { opacity: 0.7 }]} activeOpacity={0.85} onPress={submitQuestion} disabled={askSaving}>
                {askSaving ? <ActivityIndicator color={colors.cream} /> : <Check size={15} color={colors.cream} strokeWidth={2.4} />}
                <Text style={f.submitBtnText}>{askSaving ? 'Posting…' : 'Post Question'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Thread */}
      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        <KeyboardAvoidingView style={[styles.screen, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.threadHeader}>
            <TouchableOpacity onPress={() => setSelected(null)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Close">
              <ChevronLeft size={20} color={colors.navy} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.threadHeaderTitle}>Question & Answers</Text>
            <View style={{ width: 20 }} />
          </View>
          {!!selected && (
            <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
              <View style={styles.metaRow}>
                <View style={styles.metaPill}><Text style={styles.metaPillText}>{selected.course}</Text></View>
                <View style={styles.metaPill}><Text style={styles.metaPillText}>{selected.module}</Text></View>
              </View>
              <Text style={[styles.cardBody, { fontSize: 15, marginTop: 8, color: colors.navy }]}>{selected.question_text}</Text>
              <Text style={styles.posterLine}>{selected.poster_name || 'A student'} · {timeAgo(selected.created_at)}</Text>

              <Text style={styles.solutionsHeading}>{answers.length} answer{answers.length !== 1 ? 's' : ''}</Text>
              <View style={{ gap: 10 }}>
                {answers.map(a => {
                  const voted = myVotes.has(a.id)
                  return (
                    <Card key={a.id} style={[styles.card, { flexDirection: 'row', gap: 12, padding: 14 }]}>
                      <TouchableOpacity style={[styles.voteCol, voted && styles.voteColActive]} activeOpacity={0.8} onPress={() => toggleVote(a)}>
                        <ThumbsUp size={14} color={voted ? colors.cream : colors.navy} fill={voted ? colors.cream : 'transparent'} />
                        <Text style={[styles.voteCount, voted && { color: colors.cream }]}>{voteCounts[a.id] || 0}</Text>
                      </TouchableOpacity>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardBody}>{a.body}</Text>
                        <Text style={styles.posterLine}>{a.poster_name || 'A student'} · {timeAgo(a.created_at)}</Text>
                      </View>
                    </Card>
                  )
                })}
                {answers.length === 0 && <Text style={styles.emptyText}>No answers yet — share what you know.</Text>}
              </View>
            </ScrollView>
          )}
          <View style={[styles.solutionInputRow, { paddingBottom: insets.bottom + 10 }]}>
            <TextInput
              style={styles.solutionInput}
              placeholder="Write an answer..."
              placeholderTextColor={colors.light}
              value={answerDraft}
              onChangeText={setAnswerDraft}
              multiline
            />
            <TouchableOpacity style={styles.solutionSendBtn} activeOpacity={0.8} onPress={postAnswer} disabled={answerSaving}>
              <Send size={16} color={colors.cream} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const f = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    padding: spacing.lg, paddingBottom: 34, maxHeight: '90%',
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontFamily: fonts.serif, fontSize: 19, color: colors.navy, flex: 1, marginRight: 12 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: colors.cream, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: fonts.sans, fontSize: 14, color: colors.navy,
  },
  error: { fontFamily: fonts.sans, fontSize: 12, color: colors.destructive, marginTop: 14 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.navy, borderRadius: radius.button, paddingVertical: 14, marginTop: 20,
  },
  submitBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },
})

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  heroBlock: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  navRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingRight: 10 },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  heroIcon: { fontSize: 30, marginBottom: 4 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.cream, lineHeight: 32 },
  heroSub: { fontFamily: fonts.sans, fontSize: 13.5, color: 'rgba(245,240,232,0.72)', marginTop: 6, lineHeight: 20 },

  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },

  filterSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.white, borderRadius: radius.card, height: 42, paddingHorizontal: 12, marginBottom: spacing.sm, ...shadows.card,
  },
  filterSearchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.navy },

  postBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.navy, borderRadius: radius.button, height: 50, marginBottom: spacing.sm,
  },
  postBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },

  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, fontStyle: 'italic', marginTop: spacing.lg, textAlign: 'center' },

  card: { padding: 16 },
  cardBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' },
  metaPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 9, paddingVertical: 4 },
  metaPillText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.navy },
  posterLine: { fontFamily: fonts.sans, fontSize: 11, color: colors.light, marginTop: 10 },
  viewSolutionsText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },

  voteCol: { width: 46, borderRadius: radius.card, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 3 },
  voteColActive: { backgroundColor: colors.navy },
  voteCount: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy },

  threadHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.08)' },
  threadHeaderTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  solutionsHeading: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, marginTop: 20, marginBottom: 10 },
  solutionInputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: spacing.md,
    borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)', backgroundColor: colors.white,
  },
  solutionInput: {
    flex: 1, backgroundColor: colors.cream, borderRadius: radius.card, paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: fonts.sans, fontSize: 13, color: colors.navy, maxHeight: 90,
  },
  solutionSendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
})
