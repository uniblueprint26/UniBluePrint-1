import { useState, useMemo } from 'react'
import { ScrollView, View, Text, TextInput, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Search } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import { TileGrid, EmptyNote, useTone } from '../components/campusConnect/CampusKit'
import { CAMPUS_BOARDS } from '../constants/campusBoards'
import { useComingSoonEnabled } from '../constants/comingSoon'
import { useBoardCounts, countLine } from '../lib/campus'
import { fonts } from '../constants/theme'

// All boards (founder pick r3-12 A): search, then a grid of tiles, each with a
// small real count. Boards marked coming soon only show while the remote switch
// is on.
export default function CampusBoardsScreen({ navigation }) {
  const { colors } = useTone('campus')
  const insets = useSafeAreaInsets()
  const comingOn = useComingSoonEnabled()
  const counts = useBoardCounts()
  const [q, setQ] = useState('')

  const boards = useMemo(() => CAMPUS_BOARDS.filter(b => comingOn || !b.coming), [comingOn])
  const items = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return boards
      .filter(b => !needle || b.title.toLowerCase().includes(needle) || (b.tagline || '').toLowerCase().includes(needle))
      .map(b => ({ key: b.key, title: b.title, Icon: b.Icon, sub: b.coming ? 'Stay tuned. Coming soon.' : countLine(counts[b.key]), coming: b.coming }))
  }, [boards, q, counts])

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <PageTitle title="Boards" subtitle={`${boards.length} boards for your campus.`} />
        <View style={s.body}>
          <View style={[s.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={18} color={colors.textSecondary} strokeWidth={1.8} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search boards"
              placeholderTextColor={colors.textTertiary}
              style={[s.input, { color: colors.textPrimary }]}
              accessibilityLabel="Search boards"
            />
          </View>
          <View style={{ height: 16 }} />
          {items.length ? (
            <TileGrid
              items={items}
              onPress={t => { if (!t.coming) navigation.navigate('BoardDetail', { boardKey: t.key }) }}
            />
          ) : (
            <EmptyNote title="No boards match" body="Try a different word." />
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, height: 52 },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 16 },
})
