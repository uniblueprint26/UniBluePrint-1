import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Clock, ChevronRight } from 'lucide-react-native'
import { fonts, shadows } from '../../constants/theme'
import { POSTS, calcReadTime, formatDate } from '../../data/blogPosts'
import { useAdTokens } from './adTheme'

const LATEST = [...POSTS].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5)

// "This week's blogs": a short, sideways row of the latest posts, read from the
// same data the Blog screen uses. See all opens the Blog screen.
export default function BlogRow({ onOpenPost, onSeeAll }) {
  const t = useAdTokens()
  const { colors } = t
  return (
    <View>
      <View style={s.head}>
        <Text style={[s.heading, { color: colors.textPrimary }]}>This week's blogs</Text>
        <TouchableOpacity onPress={onSeeAll} style={s.seeAll} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="See all blog posts">
          <Text style={[s.seeAllText, { color: t.accentText }]}>See all</Text>
          <ChevronRight size={15} color={t.accentText} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {LATEST.map(post => (
          <TouchableOpacity
            key={post.slug}
            activeOpacity={0.85}
            onPress={() => onOpenPost(post.slug)}
            accessibilityRole="button"
            accessibilityLabel={`Blog: ${post.title}`}
            style={[s.card, { backgroundColor: colors.surface }, t.isDark ? t.cardBorder : shadows.card]}
          >
            <View style={[s.pill, { backgroundColor: t.accentTint }]}>
              <Text style={[s.pillText, { color: t.accentText }]} numberOfLines={1}>{post.category}</Text>
            </View>
            <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={3}>{post.title}</Text>
            <View style={s.meta}>
              <Clock size={12} color={colors.textSecondary} />
              <Text style={[s.metaText, { color: colors.textSecondary }]}>{calcReadTime(post.sections)}</Text>
              <Text style={[s.metaText, { color: colors.textSecondary }]}>{`· ${formatDate(post.date).replace(/ \d{4}$/, '')}`}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  heading: { fontFamily: fonts.serif, fontSize: 22 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 6 },
  seeAllText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  row: { paddingHorizontal: 16, gap: 12, paddingBottom: 6 },
  card: { width: 232, borderRadius: 20, padding: 16, justifyContent: 'space-between', minHeight: 156 },
  pill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3, maxWidth: '100%' },
  pillText: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.4 },
  title: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 23, marginTop: 12, marginBottom: 14 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: fonts.sans, fontSize: 12 },
})
