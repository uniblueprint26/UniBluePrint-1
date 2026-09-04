import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Switch } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Plus, Save, CheckCircle2 } from 'lucide-react-native'
import Card from '../../components/ui/Card'
import { colors, fonts, spacing, radius } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

// Editorial content for the 9 Weekly Blueprint pages that have no other real
// data source (see supabase/migrations/20260829160000_weekly_blueprint.sql
// for why — the other 18 pages pull from deals, coach_profiles, Foundation
// services, Lifestyle partners, and the ads table instead).
//
// 'lines' fields store one entry per line as a pipe-separated row, parsed
// into structured data by AdBoardScreen.jsx at render time — a plain
// textarea beats building a full repeatable-row form for a v1 editor, and
// the hint under each field shows the exact format expected.
const PAGE_FIELDS = {
  campus_events: {
    label: 'Campus Connect: Events (pages 10–13)',
    fields: [{ key: 'lines', type: 'lines', label: 'One event per line', hint: 'Institution | Event | Date | Location' }],
  },
  student_spotlight: {
    label: 'Student Spotlight (pages 14–15)',
    fields: [
      { key: 'lines', type: 'lines', label: 'Short story cards (page 14)', hint: 'Student name | Headline | Short teaser' },
      { key: 'featuredName', type: 'text', label: 'Featured story: student name (page 15)' },
      { key: 'featuredTeaser', type: 'textarea', label: 'Featured story: opening hook', hint: 'A few sentences, then cut off — links out to the full story on the blog.' },
      { key: 'featuredSlug', type: 'text', label: 'Blog post slug to link to', hint: 'Matches a slug in src/data/blogPosts.js on the website' },
    ],
  },
  campus_guide: {
    label: 'Campus Guide (page 16)',
    fields: [
      { key: 'title', type: 'text', label: 'Guide title' },
      { key: 'body', type: 'textarea', label: 'Excerpt shown in the magazine' },
    ],
  },
  team: {
    label: 'Meet the Team (page 19)',
    fields: [
      { key: 'name', type: 'text', label: 'Name' },
      { key: 'role', type: 'text', label: 'Role / team' },
      { key: 'intro', type: 'textarea', label: 'Short personal introduction' },
    ],
  },
  money_moves: {
    label: "This Week's Financial Tip (page 20)",
    fields: [
      { key: 'coachName', type: 'text', label: 'Coach name', hint: 'e.g. Zainab Adeyemi (Soft Life Investing)' },
      { key: 'tip', type: 'textarea', label: 'This week\'s tip' },
    ],
  },
  coach_board: {
    label: 'The Coach Board (page 21)',
    fields: [{ key: 'lines', type: 'lines', label: 'One quote per line', hint: 'Coach name | Their role | "Quote"' }],
  },
  ubp_board: {
    label: 'The UBP Board (page 22)',
    fields: [{ key: 'lines', type: 'lines', label: 'One update per line' }],
  },
  week_ahead: {
    label: 'The Week Ahead (page 23)',
    fields: [{ key: 'lines', type: 'lines', label: 'One item per line', hint: 'What | When' }],
  },
  blueprint_feature: {
    label: 'Blueprint Feature (page 25)',
    fields: [
      { key: 'kicker', type: 'text', label: 'Feature type', hint: 'e.g. "Opportunity of the Week"' },
      { key: 'title', type: 'text', label: 'Title' },
      { key: 'body', type: 'textarea', label: 'Body' },
    ],
  },
  founders_note: {
    label: "Founders' Note (page 26)",
    fields: [{ key: 'body', type: 'textarea', label: 'The note itself, in your own voice' }],
  },
}

function ContentField({ field, value, onChange }) {
  if (field.type === 'lines') {
    return (
      <>
        <Text style={s.fieldLabel}>{field.label}</Text>
        {!!field.hint && <Text style={s.fieldHint}>Format: {field.hint}</Text>}
        <TextInput
          style={[s.input, s.textArea, { minHeight: 110 }]}
          value={(value || []).join('\n')}
          onChangeText={t => onChange(t.split('\n'))}
          multiline
          textAlignVertical="top"
          placeholder="One entry per line..."
          placeholderTextColor={colors.light}
        />
      </>
    )
  }
  return (
    <>
      <Text style={s.fieldLabel}>{field.label}</Text>
      {!!field.hint && <Text style={s.fieldHint}>{field.hint}</Text>}
      <TextInput
        style={[s.input, field.type === 'textarea' && s.textArea]}
        value={value || ''}
        onChangeText={onChange}
        multiline={field.type === 'textarea'}
        textAlignVertical={field.type === 'textarea' ? 'top' : 'center'}
        placeholderTextColor={colors.light}
      />
    </>
  )
}

export default function WeeklyIssueEditorScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeIssue, setActiveIssue] = useState(null) // issue row being edited, or null = list view
  const [content, setContent] = useState({}) // page_key -> { field_key: value }
  const [saving, setSaving] = useState(null) // page_key currently saving, or null
  const [savedFlash, setSavedFlash] = useState(null)

  const loadIssues = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('weekly_issues').select('*').order('week_of', { ascending: false })
    setIssues(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadIssues() }, [loadIssues])

  async function openIssue(issue) {
    setActiveIssue(issue)
    const { data } = await supabase.from('weekly_issue_content').select('page_key, content').eq('issue_id', issue.id)
    const byKey = {}
    for (const row of data || []) byKey[row.page_key] = row.content
    setContent(byKey)
  }

  async function createIssue() {
    const nextNumber = (issues[0]?.issue_number || 0) + 1
    const today = new Date()
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7))
    const { data, error } = await supabase
      .from('weekly_issues')
      .insert({ issue_number: nextNumber, week_of: nextMonday.toISOString().slice(0, 10), created_by: user?.id })
      .select()
      .single()
    if (error) { Alert.alert('Something went wrong', 'Please try again.'); return }
    setIssues(prev => [data, ...prev])
    openIssue(data)
  }

  async function updateIssueField(patch) {
    if (!activeIssue) return
    const { data, error } = await supabase.from('weekly_issues').update(patch).eq('id', activeIssue.id).select().single()
    if (!error) {
      setActiveIssue(data)
      setIssues(prev => prev.map(i => i.id === data.id ? data : i))
    }
  }

  async function savePage(pageKey) {
    if (!activeIssue) return
    setSaving(pageKey)
    const { error } = await supabase
      .from('weekly_issue_content')
      .upsert({ issue_id: activeIssue.id, page_key: pageKey, content: content[pageKey] || {} }, { onConflict: 'issue_id,page_key' })
    setSaving(null)
    if (error) { Alert.alert('Could not save', 'Please try again.'); return }
    setSavedFlash(pageKey)
    setTimeout(() => setSavedFlash(f => f === pageKey ? null : f), 1800)
  }

  function setFieldValue(pageKey, fieldKey, value) {
    setContent(prev => ({ ...prev, [pageKey]: { ...(prev[pageKey] || {}), [fieldKey]: value } }))
  }

  return (
    <View style={s.screen}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => activeIssue ? setActiveIssue(null) : navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
          <Text style={s.backBtnText}>{activeIssue ? 'All Issues' : 'Founder Dashboard'}</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{activeIssue ? `Issue ${activeIssue.issue_number}` : 'The Weekly Blueprint'}</Text>
        <Text style={s.headerSub}>
          {activeIssue
            ? 'Editorial content for this week’s issue. Everything else pulls from real platform data automatically.'
            : 'Manage weekly issues of the in-app magazine.'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={colors.navy} style={{ marginTop: 40 }} />
      ) : !activeIssue ? (
        <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={s.newIssueBtn} activeOpacity={0.85} onPress={createIssue}>
            <Plus size={16} color={colors.cream} strokeWidth={2.5} />
            <Text style={s.newIssueBtnText}>New Issue</Text>
          </TouchableOpacity>
          {issues.length === 0 ? (
            <Text style={s.emptyText}>No issues yet. Create the first one above.</Text>
          ) : issues.map(issue => (
            <TouchableOpacity key={issue.id} activeOpacity={0.8} onPress={() => openIssue(issue)}>
              <Card style={s.issueCard}>
                <View style={{ flex: 1 }}>
                  <Text style={s.issueTitle}>Issue {issue.issue_number}{issue.theme ? ` — ${issue.theme}` : ''}</Text>
                  <Text style={s.issueSub}>Week of {issue.week_of}</Text>
                </View>
                <View style={[s.statusBadge, issue.published && s.statusBadgeLive]}>
                  <Text style={[s.statusBadgeText, issue.published && s.statusBadgeTextLive]}>
                    {issue.published ? 'Live' : 'Draft'}
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 60 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <Card style={{ marginBottom: 16 }}>
            <Text style={s.fieldLabel}>Theme / headline for this issue</Text>
            <TextInput
              style={s.input}
              defaultValue={activeIssue.theme || ''}
              onEndEditing={e => updateIssueField({ theme: e.nativeEvent.text })}
              placeholder="e.g. Back to Campus"
              placeholderTextColor={colors.light}
            />
            <View style={s.publishRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Published</Text>
                <Text style={s.fieldHint}>Live issues are what every student sees when they open the Ad Board.</Text>
              </View>
              <Switch
                value={activeIssue.published}
                onValueChange={v => updateIssueField({ published: v })}
                trackColor={{ false: 'rgba(30,58,95,0.15)', true: colors.navy }}
              />
            </View>
          </Card>

          {Object.entries(PAGE_FIELDS).map(([pageKey, page]) => (
            <Card key={pageKey} style={{ marginBottom: 16 }}>
              <Text style={s.pageLabel}>{page.label}</Text>
              {page.fields.map(field => (
                <View key={field.key} style={{ marginTop: 12 }}>
                  <ContentField
                    field={field}
                    value={content[pageKey]?.[field.key]}
                    onChange={v => setFieldValue(pageKey, field.key, v)}
                  />
                </View>
              ))}
              <TouchableOpacity
                style={[s.saveBtn, saving === pageKey && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={() => savePage(pageKey)}
                disabled={saving === pageKey}
              >
                {savedFlash === pageKey
                  ? <><CheckCircle2 size={14} color={colors.cream} /><Text style={s.saveBtnText}>Saved</Text></>
                  : <><Save size={14} color={colors.cream} /><Text style={s.saveBtnText}>{saving === pageKey ? 'Saving…' : 'Save'}</Text></>
                }
              </TouchableOpacity>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 20 },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  headerTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.cream, marginBottom: 6 },
  headerSub: { fontFamily: fonts.sans, fontSize: 12.5, color: 'rgba(245,240,232,0.65)', lineHeight: 18 },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  newIssueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.navy, borderRadius: radius.button, paddingVertical: 14, marginBottom: 16,
  },
  newIssueBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.cream },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },

  issueCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  issueTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  issueSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  statusBadge: { backgroundColor: 'rgba(30,58,95,0.08)', borderRadius: radius.badge, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeLive: { backgroundColor: '#F0FDF4' },
  statusBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted },
  statusBadgeTextLive: { color: '#15803D' },

  pageLabel: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy },
  fieldLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  fieldHint: { fontFamily: fonts.sans, fontSize: 11, color: colors.light, marginBottom: 8, lineHeight: 15 },
  input: {
    backgroundColor: colors.cream, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: fonts.sans, fontSize: 14, color: colors.navy,
  },
  textArea: { minHeight: 72 },
  publishRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.navy, borderRadius: radius.button, paddingVertical: 11, marginTop: 14,
  },
  saveBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },
})
