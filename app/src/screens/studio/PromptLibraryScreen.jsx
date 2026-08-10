import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Search, Copy, Check } from 'lucide-react-native'

// NOTE: expo-clipboard is not currently listed in app/package.json.
// TODO once expo-clipboard is added as a dependency: import * as Clipboard
// from 'expo-clipboard' and call Clipboard.setStringAsync(prompt.prompt) in
// handleCopy below. Until then, tapping a card just gives brief visual
// confirmation without an actual clipboard write.

import Card from '../../components/ui/Card'
import StudioTabBar from '../../components/ui/StudioTabBar'
import { colors, fonts, spacing, radius } from '../../constants/theme'

// PROMPT_LIBRARY — demo data. Shared prompt templates Handlers use while
// working tickets, grouped by service type.
const PROMPT_LIBRARY = [
  {
    id: 'p1', serviceType: 'CV Optimisation', title: 'Structured CV Review',
    prompt: 'Review this CV against the target role. Assess formatting consistency, quantify achievements where missing, flag weak action verbs, and check for a clear, single-page narrative. Return specific line-by-line edits, not general advice.',
  },
  {
    id: 'p2', serviceType: 'CV Optimisation', title: 'ATS Keyword Pass',
    prompt: 'Compare this CV against the job description provided. List missing keywords and skills the ATS is likely to screen for, and suggest where in the CV each one can be naturally worked in without keyword stuffing.',
  },
  {
    id: 'p3', serviceType: 'CV Optimisation', title: 'Graduate CV, No Experience',
    prompt: 'This student has limited work experience. Rework the CV to lead with academic projects, part-time work, and transferable skills. Reframe each bullet point around impact and outcome rather than duty.',
  },
  {
    id: 'p4', serviceType: 'Interview Prep', title: 'Behavioural Question Bank',
    prompt: 'Generate 8 behavioural interview questions tailored to this role and industry. For each, note what the interviewer is really assessing and one STAR-format example the student could adapt.',
  },
  {
    id: 'p5', serviceType: 'Interview Prep', title: 'Mock Interview Feedback',
    prompt: 'Based on the student\'s practice answers below, give structured feedback: clarity, structure (STAR), specificity of examples, and confidence of delivery. End with the single highest-impact thing to fix before the real interview.',
  },
  {
    id: 'p6', serviceType: 'Interview Prep', title: 'Tough Question Prep',
    prompt: 'Identify the 3 hardest questions this student is likely to face given gaps or weaknesses in their background, and draft honest, confident sample answers for each.',
  },
  {
    id: 'p7', serviceType: 'Cover Letter Assistance', title: 'Cover Letter Structure Check',
    prompt: 'Review this cover letter for structure: strong opening hook, specific reason for applying to this company, 2 to 3 concrete examples tied to the role, and a confident close. Rewrite any section that reads generic.',
  },
  {
    id: 'p8', serviceType: 'Cover Letter Assistance', title: 'Tone and Voice Pass',
    prompt: 'Check this cover letter for tone. It should sound like a confident, articulate student, not a template. Flag any clichés, filler phrases, or overly formal language, and suggest more natural alternatives.',
  },
  {
    id: 'p9', serviceType: 'LinkedIn Optimisation', title: 'Headline and About Rewrite',
    prompt: 'Rewrite this LinkedIn headline and About section to be specific, keyword-rich for the target industry, and written in first person with a clear sense of what the student is looking for next.',
  },
  {
    id: 'p10', serviceType: 'LinkedIn Optimisation', title: 'Experience Section Polish',
    prompt: 'Review each experience entry on this LinkedIn profile. Convert task-based descriptions into achievement-based bullet points, matching the tone and keywords of the CV Optimisation review for consistency.',
  },
]

const SERVICE_TYPES = [...new Set(PROMPT_LIBRARY.map(p => p.serviceType))]

function PromptCard({ item }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    // TODO: wire to Clipboard.setStringAsync(item.prompt) once expo-clipboard
    // is added to app/package.json. For now this is a visual no-op.
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handleCopy}>
      <Card style={styles.promptCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.promptTitle}>{item.title}</Text>
          <Text style={styles.promptSnippet} numberOfLines={2}>{item.prompt}</Text>
        </View>
        <View style={[styles.copyIconWrap, copied && styles.copyIconWrapDone]}>
          {copied
            ? <Check size={14} color="#15803D" strokeWidth={2.5} />
            : <Copy size={14} color={colors.muted} strokeWidth={2} />}
        </View>
      </Card>
    </TouchableOpacity>
  )
}

export default function PromptLibraryScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return PROMPT_LIBRARY
    return PROMPT_LIBRARY.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q) ||
      p.serviceType.toLowerCase().includes(q))
  }, [query])

  const groups = SERVICE_TYPES
    .map(type => ({ type, items: filtered.filter(p => p.serviceType === type) }))
    .filter(g => g.items.length > 0)

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerEyebrow}>THE BLUEPRINT STUDIO</Text>
        <Text style={styles.headerTitle}>Prompt Library</Text>
        <Text style={styles.headerSub}>
          Structured prompts for working tickets, shared across all Handlers.
        </Text>

        <View style={styles.searchBar}>
          <Search size={15} color={colors.light} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search prompts or service type"
            placeholderTextColor={colors.light}
            returnKeyType="search"
          />
        </View>

        <StudioTabBar navigation={navigation} active="PromptLibrary" />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {groups.length === 0 ? (
          <Text style={styles.emptyText}>No prompts match your search.</Text>
        ) : (
          groups.map(group => (
            <View key={group.type} style={{ marginBottom: spacing.lg }}>
              <Text style={styles.groupLabel}>{group.type}</Text>
              <View style={{ gap: 10 }}>
                {group.items.map(item => (
                  <PromptCard key={item.id} item={item} />
                ))}
              </View>
            </View>
          ))
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
  headerSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.7)', lineHeight: 19, marginBottom: 16 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(245,240,232,0.1)',
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.2)',
    borderRadius: radius.button,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.cream },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  groupLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: colors.muted, letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 10,
  },

  promptCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  promptTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy, marginBottom: 4 },
  promptSnippet: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, lineHeight: 18 },
  copyIconWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.cream,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  copyIconWrapDone: { backgroundColor: '#F0FDF4' },

  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 40 },
})
