import { useState, useMemo } from 'react'
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Search, X, ChevronLeft } from 'lucide-react-native'
import SearchResults from '../components/search/SearchResults'
import { searchApp, openSearchResult } from '../constants/searchIndex'
import { fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useSafeGoBack } from '../hooks/useSafeGoBack'

// Search for anything in the app. Results look like a web search: the name,
// the path to it and one line about it, so people learn where things live.
const TRY = ['CV', 'Coach', 'Rent', 'Budget', 'Exams', 'Study room', 'Delete account']

export default function GlobalSearchScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const goBack = useSafeGoBack(navigation)
  const [q, setQ] = useState('')
  const results = useMemo(() => searchApp(q, 20), [q])

  function open(entry) {
    Keyboard.dismiss()
    openSearchResult(navigation, entry)
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <View style={[s.bar, { paddingTop: insets.top + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={goBack} style={s.back} accessibilityRole="button" accessibilityLabel="Go back">
          <ChevronLeft size={26} color={colors.textPrimary} strokeWidth={1.8} />
        </TouchableOpacity>
        <View style={[s.field, { backgroundColor: colors.tabFill }]}>
          <Search size={18} color={colors.textSecondary} strokeWidth={1.9} />
          <TextInput
            style={[s.input, { color: colors.textPrimary }]}
            value={q}
            onChangeText={setQ}
            placeholder="Search UniBlueprint"
            placeholderTextColor={colors.textTertiary}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search UniBlueprint"
          />
          {!!q && (
            <TouchableOpacity onPress={() => setQ('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10}>
              <X size={18} color={colors.textSecondary} strokeWidth={1.9} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {q.trim() ? (
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SearchResults query={q} results={results} onOpen={open} />
          </View>
        ) : (
          <View style={s.intro}>
            <Text style={[s.title, { color: colors.textPrimary }]}>Find anything</Text>
            <Text style={[s.sub, { color: colors.textSecondary }]}>We show you where it lives, so you can find it again.</Text>
            <View style={s.chips}>
              {TRY.map(t => (
                <TouchableOpacity key={t} style={[s.chip, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => setQ(t)} accessibilityRole="button">
                  <Text style={[s.chipText, { color: colors.textPrimary }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  back: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  field: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, borderRadius: 16, paddingHorizontal: 14 },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 16, paddingVertical: 0 },
  card: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  intro: { paddingHorizontal: 20, paddingTop: 28 },
  title: { fontFamily: fonts.serif, fontSize: 30 },
  sub: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 },
  chip: { paddingHorizontal: 16, height: 42, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 14.5 },
})
