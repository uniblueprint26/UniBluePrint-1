import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Switch, ScrollView } from 'react-native'
import { ChevronRight, RefreshCw, Image as ImageIcon, Check } from 'lucide-react-native'
import ImageUploader from '../ui/ImageUploader'
import { Card, Stamp, Pill, useTone } from './CampusKit'
import { fonts } from '../../constants/theme'
import { MOOD_FIRST_GROUPS } from '../../constants/moods'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { createFeedPost } from '../../lib/feed'
import { checkText, GUIDELINES_MESSAGE } from '../../lib/moderation'

// The weekly Campus Pulse, now a pool of questions that rotate: serious ones
// and light ones, all written by UBP. Answer one, optionally add a picture, and
// choose whether it is also posted (as a Take, or as a Post when there is a
// picture) to Campus Connect. The same card is used on Course Connect with
// audience="course".
//
// Questions come from public.campus_pulse_prompts. Until the new columns exist
// the card still works with the older weekly rows.

const MAX_LENGTH = 400
const NINE = MOOD_FIRST_GROUPS.flatMap(g => g.moods)

export default function PulseQuestions({ navigation, audience = 'campus' }) {
  const kind = audience === 'course' ? 'course' : 'campus'
  const { colors, accent, tint } = useTone(kind)
  const { user } = useAuth()
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)
  const [idx, setIdx] = useState(0)
  const [draft, setDraft] = useState('')
  const [photo, setPhoto] = useState(null)
  const [showPicture, setShowPicture] = useState(false)
  const [postIt, setPostIt] = useState(true)
  const [mood, setMood] = useState('grand')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [done, setDone] = useState({})

  const place = audience === 'course' ? 'Course Connect' : 'Campus Connect'

  const load = useCallback(async () => {
    setLoading(true)
    let res = await supabase
      .from('campus_pulse_prompts')
      .select('id, prompt_text, tone, active, is_ubp, sort_order, week_start')
      .eq('rotating', true)
      .order('active', { ascending: false })
      .order('sort_order', { ascending: true })
    if (res.error) {
      res = await supabase
        .from('campus_pulse_prompts')
        .select('id, prompt_text, active, sort_order, week_start')
        .order('active', { ascending: false })
        .order('sort_order', { ascending: true })
    }
    setPrompts(res.data || [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  // Show this week's question first, then a steady rotation of the rest.
  const list = useMemo(() => prompts.slice(0, 40), [prompts])
  const current = list.length ? list[idx % list.length] : null
  const tone = current?.tone === 'serious' ? 'Serious' : 'Light'

  function next() {
    setIdx(i => (i + 1) % Math.max(list.length, 1))
    setDraft(''); setPhoto(null); setShowPicture(false); setMsg(null)
  }

  async function submit() {
    const text = draft.trim()
    if (!text || !current || saving || !user) return
    if (!checkText(text).ok) { setMsg(GUIDELINES_MESSAGE); return }
    setSaving(true)
    setMsg(null)
    try {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'A member'
      const { error } = await supabase
        .from('campus_pulse_responses')
        .upsert({ prompt_id: current.id, user_id: user.id, poster_name: name, content: text }, { onConflict: 'prompt_id,user_id' })
      if (error) throw error
      if (postIt) {
        const body = `${current.prompt_text}\n\n${text}`.slice(0, 1900)
        if (photo) await createFeedPost({ userId: user.id, postType: 'post', audience, photo_url: photo, body })
        else await createFeedPost({ userId: user.id, postType: 'thread', audience, mood, body })
      }
      setDone(d => ({ ...d, [current.id]: postIt ? 'posted' : 'saved' }))
      setDraft(''); setPhoto(null); setShowPicture(false)
    } catch (e) {
      setMsg(String(e?.message || '').includes('feed_text_guard') ? GUIDELINES_MESSAGE : 'Could not share that. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Card style={{ alignItems: 'center', padding: 28 }}><ActivityIndicator color={colors.textPrimary} /></Card>
  }
  if (!current) {
    return (
      <Card>
        <Text style={[s.eyebrow, { color: accent }]}>{audience === 'course' ? 'COURSE PULSE' : 'CAMPUS PULSE'}</Text>
        <Text style={[s.q, { color: colors.textPrimary }]}>No questions right now</Text>
        <Text style={[s.help, { color: colors.textSecondary }]}>New questions from UBP appear here every week.</Text>
      </Card>
    )
  }

  const status = done[current.id]

  return (
    <Card>
      <View style={s.top}>
        <Text style={[s.eyebrow, { color: accent }]}>{audience === 'course' ? 'COURSE PULSE' : 'CAMPUS PULSE'}</Text>
        <Stamp label={current.is_ubp === false ? 'Member' : 'From UBP'} kind={kind} />
      </View>
      <View style={s.toneRow}>
        <Pill label={current.tone ? tone : 'This week'} tone="accent" kind={kind} />
        {list.length > 1 && (
          <TouchableOpacity onPress={next} style={s.nextBtn} accessibilityRole="button" accessibilityLabel="Show another question">
            <RefreshCw size={14} color={accent} strokeWidth={2} />
            <Text style={[s.nextText, { color: accent }]}>Another question</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={[s.q, { color: colors.textPrimary }]}>{current.prompt_text}</Text>

      {status ? (
        <View style={[s.doneBox, { backgroundColor: tint }]}>
          <Check size={16} color={accent} strokeWidth={2.4} />
          <Text style={[s.doneText, { color: colors.textPrimary }]}>
            {status === 'posted' ? `Shared on ${place}. Thank you.` : 'Saved to the Pulse. Not posted to the feed.'}
          </Text>
        </View>
      ) : (
        <>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Share a quick take"
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={MAX_LENGTH}
            style={[s.input, { backgroundColor: colors.surfaceSunk, color: colors.textPrimary }]}
            accessibilityLabel="Your answer"
          />

          {showPicture ? (
            <View style={{ marginTop: 10 }}>
              <ImageUploader
                bucket="campus-board-photos"
                storagePath={`${user?.id}/pulse-${Date.now()}.jpg`}
                currentUrl={photo}
                onUpload={setPhoto}
                label="Picture"
                size={72}
              />
            </View>
          ) : (
            <TouchableOpacity style={s.picBtn} onPress={() => setShowPicture(true)} accessibilityRole="button">
              <ImageIcon size={16} color={accent} strokeWidth={1.9} />
              <Text style={[s.picText, { color: accent }]}>Add a picture</Text>
            </TouchableOpacity>
          )}

          <View style={s.switchRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[s.switchTitle, { color: colors.textPrimary }]}>Post to {place}</Text>
              <Text style={[s.help, { color: colors.textSecondary }]}>
                {postIt ? (photo ? 'Goes up as a Post with your picture.' : 'Goes up as a Take.') : 'Off: your answer stays in the Pulse only.'}
              </Text>
            </View>
            <Switch value={postIt} onValueChange={setPostIt} trackColor={{ false: colors.divider, true: accent }} thumbColor="#FFFFFF" accessibilityLabel={`Post to ${place}`} />
          </View>

          {postIt && !photo && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.moodRow}>
              {NINE.map(m => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setMood(m.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: mood === m.id }}
                  style={[s.moodChip, { borderColor: mood === m.id ? accent : colors.border, backgroundColor: mood === m.id ? tint : 'transparent' }]}
                >
                  <Text style={[s.moodText, { color: colors.textPrimary }]}>{m.emoji} {m.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {!!msg && <Text style={[s.err, { color: colors.destructive }]}>{msg}</Text>}

          <TouchableOpacity
            onPress={submit}
            disabled={!draft.trim() || saving}
            activeOpacity={0.85}
            accessibilityRole="button"
            style={[s.share, { backgroundColor: colors.accentBg, opacity: !draft.trim() || saving ? 0.5 : 1 }]}
          >
            {saving ? <ActivityIndicator color={colors.accentFg} /> : <Text style={[s.shareText, { color: colors.accentFg }]}>Share</Text>}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={s.pastRow}
        onPress={() => navigation.navigate('CampusPulseArchive')}
        accessibilityRole="button"
      >
        <Text style={[s.pastText, { color: accent }]}>Browse past weeks</Text>
        <ChevronRight size={15} color={accent} strokeWidth={2.2} />
      </TouchableOpacity>
    </Card>
  )
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  eyebrow: { fontFamily: fonts.sansBold, fontSize: 12, letterSpacing: 1 },
  toneRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  nextText: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  q: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 31, marginTop: 12 },
  input: { marginTop: 16, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, minHeight: 56, maxHeight: 140, fontFamily: fonts.sans, fontSize: 15, textAlignVertical: 'top' },
  picBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, alignSelf: 'flex-start', paddingVertical: 4 },
  picText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  switchTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  help: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginTop: 2 },
  moodRow: { gap: 8, paddingTop: 12, paddingRight: 4 },
  moodChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  moodText: { fontFamily: fonts.sansMedium, fontSize: 13 },
  err: { fontFamily: fonts.sans, fontSize: 13, marginTop: 10 },
  share: { marginTop: 16, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  shareText: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  doneBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14, marginTop: 16 },
  doneText: { fontFamily: fonts.sansMedium, fontSize: 14, flex: 1, lineHeight: 20 },
  pastRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 16, alignSelf: 'flex-start' },
  pastText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
})
