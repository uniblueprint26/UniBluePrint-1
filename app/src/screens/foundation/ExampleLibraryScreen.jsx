import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BookOpen } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../../components/ui/AppHeader'
import EmptyState from '../../components/ui/EmptyState'
import { fonts, radius, spacing, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'

// The Example library: real examples of what a strong CV bullet, cover letter
// opener, LinkedIn headline, LinkedIn About section or interview answer looks
// like, with a plain reason it works. Read only. Rows come from
// public.example_library. A row UBP wrote itself carries "From UBP". A row from
// a published source names that source. Nothing here is the member's own work.
const CATEGORIES = [
  { key: 'cv_bullet', label: 'CV bullets' },
  { key: 'cover_letter_opener', label: 'Cover letters' },
  { key: 'linkedin_headline', label: 'LinkedIn headlines' },
  { key: 'linkedin_about', label: 'LinkedIn About' },
  { key: 'star_answer', label: 'Interview answers' },
]

export default function ExampleLibraryScreen({ navigation }) {
  const { colors, isDark } = useTheme()
  const styles = getStyles(colors, isDark)
  const insets = useSafeAreaInsets()
  const [category, setCategory] = useState(CATEGORIES[0].key)
  const [industry, setIndustry] = useState(null)
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const { data, error } = await supabase
        .from('example_library')
        .select('id, category, industry, competency_tag, excerpt, why_it_works, source_name, provenance')
        .eq('category', category)
        .order('industry', { ascending: true })
        .limit(200)
      if (error || !Array.isArray(data)) throw error || new Error('no data')
      setRows(data)
      setStatus('ready')
    } catch {
      setRows([])
      setStatus('error')
    }
  }, [category])

  useEffect(() => { setIndustry(null); load() }, [load])

  const industries = useMemo(() => Array.from(new Set(rows.map(r => r.industry).filter(Boolean))).sort(), [rows])
  const shown = industry ? rows.filter(r => r.industry === industry) : rows

  return (
    <View style={styles.screen}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 48 }} showsVerticalScrollIndicator={false}>
        <PageTitle title="Example library" subtitle="See what good looks like. Use these to learn, never to copy." />

        <ChipRow items={CATEGORIES.map(c => ({ key: c.key, label: c.label }))} value={category} onChange={setCategory} styles={styles} label="Type" />
        {industries.length > 1 && (
          <ChipRow
            items={[{ key: null, label: 'All fields' }, ...industries.map(i => ({ key: i, label: i }))]}
            value={industry}
            onChange={setIndustry}
            styles={styles}
            label="Field"
          />
        )}

        <View style={styles.list}>
          {status === 'loading' ? (
            <ActivityIndicator color={colors.textSecondary} style={{ marginTop: 40 }} />
          ) : status === 'error' ? (
            <EmptyState
              icon={BookOpen}
              title="We could not load the examples"
              subtitle="Check your connection and try again."
              ctaLabel="Try again"
              onCtaPress={load}
            />
          ) : shown.length === 0 ? (
            <EmptyState icon={BookOpen} title="No examples here yet" subtitle="Try another type or field." />
          ) : (
            shown.map(r => (
              <View key={r.id} style={styles.card}>
                <View style={styles.tagRow}>
                  {r.industry ? <Text style={styles.industry} numberOfLines={1}>{r.industry}</Text> : null}
                  {r.competency_tag ? <Text style={styles.competency} numberOfLines={1}>{r.competency_tag}</Text> : null}
                </View>
                <Text style={styles.excerpt}>{r.excerpt}</Text>
                <Text style={styles.whyLabel}>WHY IT WORKS</Text>
                <Text style={styles.why}>{r.why_it_works}</Text>
                <Text style={styles.source}>
                  {r.provenance === 'platform_authored' ? 'From UBP' : `Source: ${r.source_name}`}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}

function ChipRow({ items, value, onChange, styles, label }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
      style={styles.chipScroll}
      accessibilityLabel={label}
    >
      {items.map(it => {
        const on = it.key === value
        return (
          <TouchableOpacity
            key={String(it.key)}
            onPress={() => onChange(it.key)}
            activeOpacity={0.8}
            style={[styles.chip, on && styles.chipOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1}>{it.label}</Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

function getStyles(colors, isDark) {
  const card = isDark ? { borderWidth: 1, borderColor: colors.border } : shadows.card
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    chipScroll: { flexGrow: 0, marginTop: 14, marginBottom: 6 },
    chips: { paddingHorizontal: spacing.md, gap: 8 },
    chip: { paddingHorizontal: 14, height: 36, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.tabFill },
    chipOn: { backgroundColor: colors.accentBg },
    chipText: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.textPrimary },
    chipTextOn: { color: colors.accentFg },
    list: { paddingHorizontal: spacing.md, paddingTop: 10, gap: 14 },
    card: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, ...card },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    industry: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.textSecondary },
    competency: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textSecondary },
    excerpt: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 26, color: colors.textPrimary },
    whyLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.textSecondary, marginTop: 16, marginBottom: 6 },
    why: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21, color: colors.textPrimary },
    source: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.textSecondary, marginTop: 14 },
  })
}
