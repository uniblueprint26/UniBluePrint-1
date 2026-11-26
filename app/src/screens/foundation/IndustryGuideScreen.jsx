import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Building2, ChevronRight, ChevronLeft } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../../components/ui/AppHeader'
import EmptyState from '../../components/ui/EmptyState'
import { fonts, spacing, shadows } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'

// Industry guides: how each field screens applications, what it expects to see,
// the wording it uses, what gets an application binned and who the real
// employers and bodies are. Read only. Rows come from public.industry_intelligence,
// where every row names the source it came from.
const SECTIONS = [
  { key: 'screening_mechanism', title: 'How applications are screened' },
  { key: 'must_have', title: 'What you need to show' },
  { key: 'wording_convention', title: 'How to word it' },
  { key: 'red_flag', title: 'What to avoid' },
  { key: 'real_entity', title: 'Who is who' },
]

export default function IndustryGuideScreen({ navigation }) {
  const { colors, isDark } = useTheme()
  const styles = getStyles(colors, isDark)
  const insets = useSafeAreaInsets()
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('loading')
  const [selected, setSelected] = useState(null)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const { data, error } = await supabase
        .from('industry_intelligence')
        .select('id, industry, dimension, content, source_name')
        .order('industry', { ascending: true })
        .limit(1000)
      if (error || !Array.isArray(data)) throw error || new Error('no data')
      setRows(data)
      setStatus('ready')
    } catch {
      setRows([])
      setStatus('error')
    }
  }, [])

  useEffect(() => { load() }, [load])

  const industries = useMemo(() => Array.from(new Set(rows.map(r => r.industry).filter(Boolean))).sort(), [rows])
  const guide = selected ? rows.filter(r => r.industry === selected) : []

  return (
    <View style={styles.screen}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 48 }} showsVerticalScrollIndicator={false}>
        {selected ? (
          <>
            <TouchableOpacity style={styles.backRow} onPress={() => setSelected(null)} accessibilityRole="button" accessibilityLabel="All industries">
              <ChevronLeft size={18} color={colors.textPrimary} />
              <Text style={styles.backText}>All industries</Text>
            </TouchableOpacity>
            <PageTitle title={selected} subtitle="What this field looks for." />
            <View style={styles.list}>
              {SECTIONS.map(sec => {
                const items = guide.filter(r => r.dimension === sec.key)
                if (items.length === 0) return null
                return (
                  <View key={sec.key} style={styles.card}>
                    <Text style={styles.sectionTitle}>{sec.title}</Text>
                    {items.map((r, i) => (
                      <View key={r.id} style={[styles.item, i > 0 && styles.itemBorder]}>
                        <Text style={styles.content}>{r.content}</Text>
                        <Text style={styles.source}>Source: {r.source_name}</Text>
                      </View>
                    ))}
                  </View>
                )
              })}
            </View>
          </>
        ) : (
          <>
            <PageTitle title="Industry guides" subtitle="How each field screens applications." />
            <View style={styles.list}>
              {status === 'loading' ? (
                <ActivityIndicator color={colors.textSecondary} style={{ marginTop: 40 }} />
              ) : status === 'error' ? (
                <EmptyState icon={Building2} title="We could not load the guides" subtitle="Check your connection and try again." ctaLabel="Try again" onCtaPress={load} />
              ) : industries.length === 0 ? (
                <EmptyState icon={Building2} title="No guides yet" subtitle="They will show here when they are ready." />
              ) : (
                <View style={styles.card}>
                  {industries.map((name, i) => (
                    <TouchableOpacity
                      key={name}
                      style={[styles.indRow, i > 0 && styles.itemBorder]}
                      activeOpacity={0.7}
                      onPress={() => setSelected(name)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.indName} numberOfLines={2}>{name}</Text>
                      <ChevronRight size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

function getStyles(colors, isDark) {
  const card = isDark ? { borderWidth: 1, borderColor: colors.border } : shadows.card
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    backRow: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: spacing.md - 4, paddingTop: 10, alignSelf: 'flex-start', minHeight: 44 },
    backText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.textPrimary },
    list: { paddingHorizontal: spacing.md, paddingTop: 10, gap: 14 },
    card: { backgroundColor: colors.surface, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 8, ...card },
    sectionTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary, paddingTop: 12, paddingBottom: 4 },
    item: { paddingVertical: 14 },
    itemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    content: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: colors.textPrimary },
    source: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.textSecondary, marginTop: 8 },
    indRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 52, paddingVertical: 12 },
    indName: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 15, color: colors.textPrimary },
  })
}
