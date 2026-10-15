/**
 * CampusPulseCard — Desmond's "designated" ephemeral-content module for
 * Campus Connect. Lives on the Campus Events board area (rendered inline
 * at the top of CampusConnectScreen, see that file): one recurring
 * low-pressure weekly prompt, a short reply box, a plain chronological
 * list of this week's replies, and a link into CampusPulseArchiveScreen
 * for browsing past weeks. Explicitly NOT a Stories/Snapchat clone — no
 * streaks, no like-count, no ranking. See
 * supabase/migrations/20261015140000_campus_pulse.sql for the schema and
 * why posting here isn't anonymous.
 *
 * One response per student per prompt (DB-enforced unique(prompt_id,
 * user_id)) — posting again edits your own reply via upsert rather than
 * adding a second one, which is what keeps this "manage only your own
 * response" instead of an open feed you can flood.
 */
import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { ChevronRight, Check, MessageCircle } from 'lucide-react-native'
import Card from '../ui/Card'
import { fonts, spacing, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

const MAX_RESPONSES_SHOWN = 6
const MAX_LENGTH = 500

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

export default function CampusPulseCard({ navigation }) {
  const { colors } = useTheme()
  const styles = getStyles(colors)
  const { user } = useAuth()

  const [prompt, setPrompt] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: activePrompt } = await supabase
      .from('campus_pulse_prompts')
      .select('*')
      .eq('active', true)
      .limit(1)
      .maybeSingle()

    if (!activePrompt) {
      setPrompt(null)
      setResponses([])
      setLoading(false)
      return
    }

    const { data: rows } = await supabase
      .from('campus_pulse_responses')
      .select('*')
      .eq('prompt_id', activePrompt.id)
      .is('archived_at', null)
      .order('created_at', { ascending: false })

    setPrompt(activePrompt)
    setResponses(rows || [])
    const mine = (rows || []).find(r => r.user_id === user?.id)
    setDraft(mine?.content || '')
    setLoading(false)
  }, [user?.id])

  useEffect(() => { load() }, [load])

  async function submit() {
    const content = draft.trim()
    if (!content || saving || !prompt) return
    setSaving(true)
    setErrorMsg(null)
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'A student'
    const { data, error } = await supabase
      .from('campus_pulse_responses')
      .upsert(
        { prompt_id: prompt.id, user_id: user.id, poster_name: displayName, content },
        { onConflict: 'prompt_id,user_id' },
      )
      .select()
      .single()
    setSaving(false)
    if (error) {
      setErrorMsg('Could not post. Please try again.')
      return
    }
    setResponses(prev => {
      const without = prev.filter(r => r.id !== data.id)
      return [data, ...without]
    })
  }

  if (loading) {
    return (
      <Card style={styles.card}>
        <ActivityIndicator size="small" color={colors.textPrimary} />
      </Card>
    )
  }

  // No active prompt (e.g. cron hasn't run yet on a brand-new project) —
  // fail quiet rather than show a broken module.
  if (!prompt) return null

  const myResponse = responses.find(r => r.user_id === user?.id)
  const others = responses.filter(r => r.id !== myResponse?.id)
  const shown = others.slice(0, MAX_RESPONSES_SHOWN)

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconBubble}>
          <MessageCircle size={14} color={colors.accentFg} strokeWidth={2.2} />
        </View>
        <Text style={styles.eyebrow}>CAMPUS PULSE · THIS WEEK</Text>
      </View>
      <Text style={styles.promptText}>{prompt.prompt_text}</Text>

      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={v => setDraft(v.slice(0, MAX_LENGTH))}
        placeholder="Share a quick take — a line or two is plenty..."
        placeholderTextColor={colors.light}
        multiline
        textAlignVertical="top"
      />
      <View style={styles.inputFooterRow}>
        <Text style={styles.charCount}>{draft.length}/{MAX_LENGTH}</Text>
        <TouchableOpacity
          style={[styles.submitBtn, (!draft.trim() || saving) && { opacity: 0.6 }]}
          activeOpacity={0.85}
          disabled={!draft.trim() || saving}
          onPress={submit}
        >
          {saving ? <ActivityIndicator size="small" color={colors.accentFg} /> : <Check size={13} color={colors.accentFg} strokeWidth={2.4} />}
          <Text style={styles.submitBtnText}>{myResponse ? 'Update' : 'Share'}</Text>
        </TouchableOpacity>
      </View>
      {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

      {myResponse && (
        <View style={styles.myResponseNote}>
          <Check size={11} color={colors.success} strokeWidth={2.4} />
          <Text style={styles.myResponseNoteText}>You've shared your take this week — edit it any time above.</Text>
        </View>
      )}

      {shown.length > 0 && (
        <View style={styles.responsesList}>
          {shown.map(r => (
            <View key={r.id} style={styles.responseRow}>
              <Text style={styles.responseMeta}>{r.poster_name || 'A student'} · {timeAgo(r.created_at)}</Text>
              <Text style={styles.responseBody}>{r.content}</Text>
            </View>
          ))}
        </View>
      )}
      {responses.length === 0 && (
        <Text style={styles.emptyText}>No responses yet — be the first to share.</Text>
      )}

      <TouchableOpacity
        style={styles.pastWeeksLink}
        activeOpacity={0.75}
        onPress={() => navigation.navigate('CampusPulseArchive')}
        accessibilityRole="button"
        accessibilityLabel="Browse past weeks"
      >
        <Text style={styles.pastWeeksLinkText}>Browse past weeks</Text>
        <ChevronRight size={14} color={colors.navy} strokeWidth={2.2} />
      </TouchableOpacity>
    </Card>
  )
}

function getStyles(colors) {
  return StyleSheet.create({
    card: { marginBottom: spacing.md },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    iconBubble: {
      width: 22, height: 22, borderRadius: 11, backgroundColor: colors.accentBg,
      alignItems: 'center', justifyContent: 'center',
    },
    eyebrow: {
      fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.muted,
      textTransform: 'uppercase', letterSpacing: 0.8,
    },
    promptText: { fontFamily: fonts.serif, fontSize: 19, color: colors.textPrimary, lineHeight: 26, marginBottom: 14 },
    input: {
      backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
      borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
      paddingHorizontal: 14, paddingVertical: 12, minHeight: 64,
      fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary,
    },
    inputFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
    charCount: { fontFamily: fonts.sans, fontSize: 11, color: colors.light },
    submitBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: colors.accentBg, borderRadius: radius.pill,
      paddingHorizontal: 16, paddingVertical: 9,
    },
    submitBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accentFg },
    errorText: { fontFamily: fonts.sans, fontSize: 12, color: colors.destructive, marginTop: 8 },
    myResponseNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    myResponseNoteText: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted, flex: 1 },
    responsesList: { marginTop: 16, gap: 12 },
    responseRow: { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 10 },
    responseMeta: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.muted, marginBottom: 3 },
    responseBody: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textPrimary, lineHeight: 19 },
    emptyText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, fontStyle: 'italic', marginTop: 14 },
    pastWeeksLink: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
      marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.divider,
    },
    pastWeeksLinkText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.navy },
  })
}
