import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Search } from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius } from '../constants/theme'

const STUDENTS = [
  {
    initials: 'AB', avatarBg: '#1E3A5F',
    name: 'Abdullah', course: 'Business and Management', uni: 'ATU Galway',
    status: 'open', statusLabel: 'Open to Connect',
    tags: ['Entrepreneurship', 'Marketing', 'Finance'],
  },
  {
    initials: 'EM', avatarBg: '#0369A1',
    name: 'Eman', course: 'Civil Engineering', uni: 'UCD',
    status: 'study', statusLabel: 'Looking for Study Group',
    tags: ['Mechanics', 'Structures', 'CAD'],
  },
  {
    initials: 'EP', avatarBg: '#B45309',
    name: 'Emily', course: 'Accounting and Finance', uni: 'DCU',
    status: 'open', statusLabel: 'Open to Connect',
    tags: ['Audit', 'Taxation', 'Excel'],
  },
  {
    initials: 'SO', avatarBg: '#7C3AED',
    name: 'Siofra', course: 'History and Politics', uni: 'UCC',
    status: 'mentor', statusLabel: 'Mentor Available',
    tags: ['Research', 'Writing', 'CAO Advice'],
  },
  {
    initials: 'CL', avatarBg: '#0F766E',
    name: 'Ciarán', course: 'Computer Science', uni: 'UL',
    status: 'study', statusLabel: 'Looking for Study Group',
    tags: ['Python', 'Web Dev', 'AI'],
  },
  {
    initials: 'NM', avatarBg: '#15803D',
    name: 'Nicole', course: 'Nursing', uni: 'Maynooth',
    status: 'open', statusLabel: 'Open to Connect',
    tags: ['Healthcare', 'Anatomy', 'Patient Care'],
  },
  {
    initials: 'SB', avatarBg: '#9D174D',
    name: 'Sienna', course: 'Nursing', uni: 'SETU Waterford',
    status: 'study', statusLabel: 'Looking for Study Group',
    tags: ['Clinical', 'Pharmacology', 'Practice'],
  },
  {
    initials: 'BA', avatarBg: '#1E3A5F',
    name: 'Basmali', course: 'Computing', uni: 'MTU Cork',
    status: 'open', statusLabel: 'Open to Connect',
    tags: ['Cloud', 'Networking', 'Security'],
  },
  {
    initials: 'EH', avatarBg: '#C2410C',
    name: 'Ethan', course: 'Sports Science', uni: 'TU Dublin',
    status: 'mentor', statusLabel: 'Mentor Available',
    tags: ['Fitness', 'Nutrition', 'Performance'],
  },
]

const STATUS_STYLES = {
  open:   { color: '#166534', bg: 'rgba(22,101,52,0.08)',   border: 'rgba(22,101,52,0.14)' },
  study:  { color: '#1d4ed8', bg: 'rgba(29,78,216,0.07)',   border: 'rgba(29,78,216,0.14)' },
  mentor: { color: '#6d28d9', bg: 'rgba(109,40,217,0.07)', border: 'rgba(109,40,217,0.14)' },
}

const FILTERS = ['All', 'Open to Connect', 'Study Group', 'Mentor Available']

function StudentCard({ student }) {
  const st = STATUS_STYLES[student.status]
  return (
    <Card style={styles.studentCard}>
      <View style={styles.cardHead}>
        <View style={[styles.avatar, { backgroundColor: student.avatarBg }]}>
          <Text style={styles.avatarText}>{student.initials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardName}>{student.name}</Text>
          <Text style={styles.cardCourse} numberOfLines={1}>{student.course}</Text>
          <Text style={styles.cardUni} numberOfLines={1}>{student.uni}</Text>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
        <Text style={[styles.statusText, { color: st.color }]}>{student.statusLabel}</Text>
      </View>
      <View style={styles.tagRow}>
        {student.tags.map(tag => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={styles.connectBtn}
        activeOpacity={0.8}
        onPress={() => Alert.alert(
          student.name,
          `Full student profiles are coming soon. You will be able to connect with ${student.name} directly through the app.`,
          [{ text: 'Got it' }]
        )}
      >
        <Text style={styles.connectBtnText}>View Profile</Text>
      </TouchableOpacity>
    </Card>
  )
}

export default function DirectoryScreen() {
  const insets = useSafeAreaInsets()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = STUDENTS.filter(s => {
    const matchFilter =
      filter === 'All' ||
      (filter === 'Open to Connect' && s.status === 'open') ||
      (filter === 'Study Group'     && s.status === 'study') ||
      (filter === 'Mentor Available' && s.status === 'mentor')
    const q = search.toLowerCase()
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.course.toLowerCase().includes(q) || s.uni.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
        <UBPLogo height={28} color={colors.cream} />
      </View>

      <View style={styles.headingWrap}>
        <Text style={styles.screenTitle}>Student Directory</Text>
        <Text style={styles.screenSub}>Connect with students across every university in Ireland</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Search size={15} color={colors.muted} strokeWidth={2} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, course, or university..."
          placeholderTextColor={colors.light}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ flexGrow: 0 }}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            activeOpacity={0.75}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.resultCount}>{filtered.length} {filtered.length === 1 ? 'student' : 'students'}</Text>
        {filtered.map((s, i) => <StudentCard key={i} student={s} />)}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  topBar: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: 16,
  },
  headingWrap: { paddingHorizontal: spacing.md, paddingTop: 18, paddingBottom: 10 },
  screenTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy },
  screenSub:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 19 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md, marginBottom: 10,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.navy, padding: 0 },

  filterRow: { paddingHorizontal: spacing.md, paddingBottom: 14, gap: 8 },
  filterPill: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.15)',
  },
  filterPillActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterText:       { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },
  filterTextActive: { color: colors.cream },

  scroll:       { paddingHorizontal: spacing.md, paddingTop: 4 },
  resultCount:  { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginBottom: 12 },

  studentCard:  { padding: 18, marginBottom: 12 },
  cardHead:     { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontFamily: fonts.serif, fontSize: 18, color: '#fff' },
  cardName:   { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  cardCourse: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  cardUni:    { fontFamily: fonts.sans, fontSize: 11, color: colors.light, marginTop: 1 },

  statusBadge: {
    borderRadius: 6, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 12,
  },
  statusText: { fontFamily: fonts.sansMedium, fontSize: 12 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  tag: {
    backgroundColor: colors.cream, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  tagText: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },

  connectBtn: {
    backgroundColor: colors.navy, borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  connectBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },
})
