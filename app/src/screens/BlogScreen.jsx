/**
 * BlogScreen — the Ad Board's Blog, as its own standalone screen (reached
 * from an entry-point card on AdBoardScreen, not a scroll section on the
 * Ad Board page itself). Lists all real Irish education news / guide
 * articles from data/blogPosts.js; tapping one opens ArticleScreen, which
 * already reads "Blog" on its own back button.
 */
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react-native'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius } from '../constants/theme'
import { POSTS, calcReadTime, formatDate } from '../data/blogPosts'

export default function BlogScreen({ navigation }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.heroBlock}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
            <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
            <Text style={styles.backBtnText}>Ad Board</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.heroTitle}>Blog</Text>
        <Text style={styles.heroSub}>Real Irish education news, CV and career guides, and campus life — the same articles as the UniBlueprint website.</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {POSTS.map(post => (
          <TouchableOpacity key={post.slug} activeOpacity={0.85} onPress={() => navigation.navigate('Article', { slug: post.slug })} style={{ marginBottom: spacing.md }}>
            <Card style={styles.postCard}>
              <View style={styles.categoryPill}><Text style={styles.categoryPillText}>{post.category}</Text></View>
              <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>
              <Text style={styles.postExcerpt} numberOfLines={2}>{post.excerpt}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{formatDate(post.date)}</Text>
                <View style={styles.metaDivider} />
                <Clock size={11} color={colors.light} />
                <Text style={styles.metaText}>{calcReadTime(post.sections)}</Text>
                <View style={{ flex: 1 }} />
                <ChevronRight size={16} color={colors.light} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  heroBlock: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  navRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, paddingTop: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingRight: 10 },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  heroTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.cream, lineHeight: 34 },
  heroSub: { fontFamily: fonts.sans, fontSize: 13.5, color: 'rgba(245,240,232,0.72)', marginTop: 8, lineHeight: 20 },

  postCard: { padding: 18 },
  categoryPill: { alignSelf: 'flex-start', backgroundColor: colors.navy, borderRadius: radius.badge, paddingHorizontal: 9, paddingVertical: 4 },
  categoryPillText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.cream, letterSpacing: 0.3 },
  postTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.navy, marginTop: 10, lineHeight: 23 },
  postExcerpt: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 19 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  metaText: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.light },
  metaDivider: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.light },
})
