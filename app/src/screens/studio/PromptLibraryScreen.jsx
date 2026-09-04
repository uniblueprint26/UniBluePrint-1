import { useState, useMemo, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Search, Copy, Check } from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'

import Card from '../../components/ui/Card'
import StudioTabBar from '../../components/ui/StudioTabBar'
import { colors, fonts, spacing, radius } from '../../constants/theme'
import { supabase } from '../../lib/supabase'

// Prompts are read live from public.prompt_library (joined to services for
// the service name), seeded by migration 20260811090000 with the same
// content this screen used to hardcode — so this is a source change, not a
// content change. Operations/Founder can add more via that table directly.

function PromptCard({ item }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await Clipboard.setStringAsync(item.prompt)
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
  const [query, setQuery]     = useState('')
  const [prompts, setPrompts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('prompt_library')
      .select('id, title, prompt_text, services(name)')
      .eq('active', true)
      .then(({ data }) => {
        if (cancelled) return
        setPrompts((data || []).map(p => ({
          id: p.id, title: p.title, prompt: p.prompt_text,
          serviceType: p.services?.name || 'General',
        })))
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const serviceTypes = useMemo(() => [...new Set(prompts.map(p => p.serviceType))], [prompts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return prompts
    return prompts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.prompt.toLowerCase().includes(q) ||
      p.serviceType.toLowerCase().includes(q))
  }, [query, prompts])

  const groups = serviceTypes
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
        {loading ? (
          <ActivityIndicator size="small" color={colors.navy} style={{ marginTop: 40 }} />
        ) : groups.length === 0 ? (
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
