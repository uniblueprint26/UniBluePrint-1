/**
 * ArticleScreen — full in-app article view for an Ad Board Blog post.
 * Renders the same section structure (paragraph / heading / list) the
 * website's BlogPostPage.jsx uses, natively, so a tap never leaves the app.
 * Route params: { slug } — looked up in data/blogPosts.js.
 */
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Clock } from 'lucide-react-native'
import { colors, fonts, spacing, radius } from '../constants/theme'
import { getPost, calcReadTime, formatDate } from '../data/blogPosts'

function Section({ section, index }) {
  if (section.type === 'heading') {
    return <Text style={styles.heading}>{section.text}</Text>
  }
  if (section.type === 'list') {
    return (
      <View style={styles.list}>
        {section.items.map((item, i) => (
          <View key={i} style={styles.listRow}>
            <View style={styles.listDot} />
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}
      </View>
    )
  }
  return <Text style={styles.paragraph}>{section.text}</Text>
}

export default function ArticleScreen({ navigation, route }) {
  const insets = useSafeAreaInsets()
  const { slug } = route.params ?? {}
  const post = getPost(slug)

  if (!post) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtnAlone} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={colors.navy} />
          <Text style={styles.backBtnAloneText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.notFound}>Article not found.</Text>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Back to Blog">
          <ChevronLeft size={20} color={colors.navy} strokeWidth={2} />
          <Text style={styles.backBtnText}>Blog</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: insets.bottom + 48 }} showsVerticalScrollIndicator={false}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{post.category}</Text>
        </View>
        <Text style={styles.title}>{post.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{formatDate(post.date)}</Text>
          <View style={styles.metaDivider} />
          <Clock size={12} color={colors.light} />
          <Text style={styles.metaText}>{calcReadTime(post.sections)}</Text>
        </View>

        <View style={styles.divider} />

        {post.sections.map((s, i) => <Section key={i} section={s} index={i} />)}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  navRow: { paddingHorizontal: spacing.md, paddingTop: 8, paddingBottom: 4 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy },
  backBtnAlone: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: spacing.md },
  backBtnAloneText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy },
  notFound: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, paddingHorizontal: spacing.md },

  categoryBadge: { alignSelf: 'flex-start', backgroundColor: colors.navy, borderRadius: radius.badge, paddingHorizontal: 10, paddingVertical: 5, marginTop: spacing.sm },
  categoryBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.cream, letterSpacing: 0.4 },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy, marginTop: 14, lineHeight: 33 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  metaText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.light },
  metaDivider: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.light },
  divider: { height: 1, backgroundColor: colors.border, marginTop: 18, marginBottom: 6 },

  heading: { fontFamily: fonts.serif, fontSize: 19, color: colors.navy, marginTop: 22, marginBottom: 8, lineHeight: 25 },
  paragraph: { fontFamily: fonts.sans, fontSize: 15, color: colors.muted, lineHeight: 24, marginTop: 12 },
  list: { marginTop: 12, gap: 10 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  listDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gold, marginTop: 8, flexShrink: 0 },
  listText: { fontFamily: fonts.sans, fontSize: 14.5, color: colors.muted, lineHeight: 22, flex: 1 },
})
