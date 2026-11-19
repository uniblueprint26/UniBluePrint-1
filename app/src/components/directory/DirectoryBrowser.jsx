import { View, Text, FlatList, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { Search, X } from 'lucide-react-native'
import Card from '../ui/Card'
import Avatar from './Avatar'
import FollowButton from './FollowButton'
import ReportButton from '../safety/ReportButton'
import { courseLine, sharedInterests, sameCourse } from './helpers'
import { fonts, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { PILLARS } from '../../constants/pillars'

// The browse list used by Messages > Discover and by the (hidden) Directory
// screen: search, interest filters, a "Also on your course" row, and one card
// per person with avatar, name, course, shared-interest chips and Follow.
// All data comes from useDirectoryData() and useFollows(); tapping a person
// opens their full profile via onOpenProfile.

function Chip({ label, matched }) {
  const { colors } = useTheme()
  return (
    <View style={[s.chip, { backgroundColor: matched ? colors.accentBg : colors.tabFill }]}>
      <Text style={[s.chipText, { color: matched ? colors.accentFg : colors.textPrimary }]}>{label}</Text>
    </View>
  )
}

function PersonCard({ person, viewerInterests, query, follows, onOpenProfile }) {
  const { colors } = useTheme()
  const shared = sharedInterests(viewerInterests, person)
  const hasShared = shared.length > 0
  const chips = (hasShared ? shared : (person.interests || [])).slice(0, 3)
  const name = person.full_name || 'UniBlueprint student'
  return (
    <Card style={s.card}>
      <View style={s.cardTop}>
        <TouchableOpacity style={s.identity} activeOpacity={0.7} onPress={() => onOpenProfile(person)} accessibilityRole="button" accessibilityLabel={`Open ${name}'s profile`}>
          <Avatar person={person} size={52} />
          <View style={s.identityText}>
            <Text style={[s.name, { color: colors.textPrimary }]} numberOfLines={1}>{name}</Text>
            {!!courseLine(person) && <Text style={[s.sub, { color: colors.textSecondary }]} numberOfLines={1}>{courseLine(person)}</Text>}
          </View>
        </TouchableOpacity>
        <FollowButton following={follows.isFollowing(person.id)} onPress={() => follows.toggleFollow(person.id)} name={name} />
        <ReportButton
          target={{ contentType: 'profile', contentId: person.id, reportedUserId: person.id, userName: name, noun: 'profile' }}
          label={`Report or block ${name}`}
        />
      </View>
      {chips.length > 0 && (
        <View style={s.chipRow}>
          {hasShared && <Text style={[s.sharedLabel, { color: colors.textSecondary }]}>Shared</Text>}
          {chips.map(t => <Chip key={t} label={t} matched={!!query && t.toLowerCase().includes(query)} />)}
        </View>
      )}
    </Card>
  )
}

function CourseRow({ people, follows, onOpenProfile }) {
  const { colors, isDark } = useTheme()
  const dot = PILLARS.course.color
  return (
    <View style={s.courseSection}>
      <View style={s.labelRow}>
        <View style={[s.dot, { backgroundColor: dot }]} />
        <Text style={[s.label, { color: colors.textSecondary }]}>ALSO ON YOUR COURSE</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.courseScroll}>
        {people.map(p => (
          <View key={p.id} style={[s.courseCard, { backgroundColor: colors.surface, borderColor: colors.border }, isDark ? null : s.courseShadow]}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => onOpenProfile(p)} style={s.courseId} accessibilityRole="button">
              <Avatar person={p} size={40} />
              <Text style={[s.courseName, { color: colors.textPrimary }]} numberOfLines={1}>{p.full_name || 'Student'}</Text>
              <Text style={[s.courseYear, { color: colors.textSecondary }]} numberOfLines={1}>{p.year_of_study || ' '}</Text>
            </TouchableOpacity>
            <FollowButton compact following={follows.isFollowing(p.id)} onPress={() => follows.toggleFollow(p.id)} name={p.full_name} />
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

export default function DirectoryBrowser({ data, follows, onOpenProfile, bottomPad = 32, heading = true }) {
  const { colors } = useTheme()
  const { filtered, candidates, loading, error, filters, filter, setFilter, search, setSearch, query, viewer, viewerInterests } = data

  const filtering = !!query || filter !== 'All'
  const courseMates = viewer.course
    ? candidates.filter(c => sameCourse(viewer.course, c) && !follows.isFollowing(c.id)).slice(0, 8)
    : []

  const header = (
    <View>
      {!filtering && courseMates.length > 0 && (
        <CourseRow people={courseMates} follows={follows} onOpenProfile={onOpenProfile} />
      )}

      {heading && (
        <View style={s.head}>
          <Text style={[s.headTitle, { color: colors.textPrimary }]}>Find your people</Text>
          <Text style={[s.headSub, { color: colors.textSecondary }]}>
            {viewerInterests?.length ? 'Based on the interests you picked' : 'Search by name, course or interest'}
          </Text>
        </View>
      )}

      <View style={[s.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={16} color={colors.textSecondary} strokeWidth={2} />
        <TextInput
          style={[s.searchInput, { color: colors.textPrimary }]}
          placeholder="Try 'marketing', 'nursing', 'chess'"
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Clear search">
            <X size={15} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {filters.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
          {filters.map(f => {
            const active = filter === f
            return (
              <TouchableOpacity
                key={f}
                activeOpacity={0.75}
                onPress={() => setFilter(f)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[s.pill, { backgroundColor: active ? colors.accentBg : colors.surface, borderColor: active ? colors.accentBg : colors.border }]}
              >
                <Text style={[s.pillText, { color: active ? colors.accentFg : colors.textPrimary }]}>{f}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}

      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.textPrimary} /></View>
      ) : error ? (
        <Text style={[s.note, { color: colors.textSecondary }]}>Could not load people right now. Please try again shortly.</Text>
      ) : filtered.length === 0 ? (
        <Text style={[s.note, { color: colors.textSecondary }]}>
          {candidates.length === 0
            ? 'No one is discoverable yet. More people join every week.'
            : query ? 'No one matches that search yet.' : 'No one has that interest set yet.'}
        </Text>
      ) : null}
    </View>
  )

  return (
    <FlatList
      style={s.list}
      contentContainerStyle={[s.content, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      data={loading || error ? [] : filtered}
      keyExtractor={p => p.id}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <PersonCard person={item} viewerInterests={viewerInterests} query={query} follows={follows} onOpenProfile={onOpenProfile} />
      )}
    />
  )
}

const s = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingTop: 8 },

  head: { paddingTop: 8, paddingBottom: 16 },
  headTitle: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28 },
  headSub: { fontFamily: fonts.sans, fontSize: 14, marginTop: 2 },

  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 46, borderRadius: 23, paddingHorizontal: 16, borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, padding: 0 },
  filterScroll: { flexGrow: 0, marginHorizontal: -spacing.md },
  filterRow: { paddingHorizontal: spacing.md, paddingVertical: 14, gap: 8 },
  pill: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  pillText: { fontFamily: fonts.sansMedium, fontSize: 13 },

  center: { paddingVertical: 48, alignItems: 'center' },
  note: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, paddingVertical: 24, textAlign: 'center' },

  card: { padding: 18, marginBottom: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  identity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 14 },
  identityText: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  sub: { fontFamily: fonts.sans, fontSize: 13, marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 16 },
  sharedLabel: { fontFamily: fonts.sans, fontSize: 12, marginRight: 2 },
  chip: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 12 },

  courseSection: { paddingBottom: 12, marginHorizontal: -spacing.md },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.md, marginBottom: 12 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.9 },
  courseScroll: { paddingHorizontal: spacing.md, gap: 12, paddingVertical: 4 },
  courseCard: { width: 124, borderRadius: 16, borderWidth: 1, padding: 10, gap: 10 },
  courseShadow: { shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 },
  courseId: { alignItems: 'center', gap: 4 },
  courseName: { fontFamily: fonts.sansSemiBold, fontSize: 13, marginTop: 4, maxWidth: 100 },
  courseYear: { fontFamily: fonts.sans, fontSize: 12 },
})
