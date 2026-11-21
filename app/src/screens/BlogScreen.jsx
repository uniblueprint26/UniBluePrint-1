/**
 * BlogScreen: the Ad Board's Blog (round three pick A). A large navy feature
 * card for the newest article, then a clean list with a hairline between
 * rows. Articles come from data/blogPosts.js, the same as the website.
 */
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronRight, Clock, BookOpen } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import EmptyState from '../components/ui/EmptyState'
import { fonts, radius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { getPosts, calcReadTime, formatDate } from '../data/blogPosts'
import { useFoundationEnabled } from '../hooks/useAppFlags'

export default function BlogScreen({ navigation }) {
  useFoundationEnabled() // the article list depends on it
  const posts = getPosts()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const [feature, ...rest] = posts
  const open = post => navigation.navigate('Article', { slug: post.slug })

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <PageTitle title="Blog" subtitle="Real Irish news and guides, the same as the website." />

        {!feature ? (
          <EmptyState icon={BookOpen} title="No articles yet" subtitle="New guides are on the way. Check back soon." />
        ) : (
          <>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => open(feature)}
              style={[s.feature, { backgroundColor: colors.chromeBg }]}
              accessibilityRole="button"
              accessibilityLabel={feature.title}
            >
              <View style={s.glow} />
              <View style={s.pill}><Text style={[s.pillText, { color: colors.chromeFg }]}>{feature.category}</Text></View>
              <Text style={[s.featureTitle, { color: colors.chromeFg }]}>{feature.title}</Text>
              <View style={s.metaRow}>
                <Text style={s.featureMeta}>{formatDate(feature.date)}</Text>
                <View style={s.dot} />
                <Clock size={14} color="rgba(245,240,232,0.7)" strokeWidth={1.8} />
                <Text style={s.featureMeta}>{calcReadTime(feature.sections)}</Text>
              </View>
            </TouchableOpacity>

            <View style={s.list}>
              {rest.map((post, i) => (
                <TouchableOpacity
                  key={post.slug}
                  activeOpacity={0.8}
                  onPress={() => open(post)}
                  style={[s.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }]}
                  accessibilityRole="button"
                  accessibilityLabel={post.title}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[s.cat, { color: colors.textSecondary }]}>{String(post.category).toUpperCase()}</Text>
                    <Text style={[s.title, { color: colors.textPrimary }]}>{post.title}</Text>
                    <View style={s.metaRow}>
                      <Text style={[s.meta, { color: colors.textSecondary }]}>{formatDate(post.date)}</Text>
                      <View style={[s.dot, { backgroundColor: colors.textTertiary }]} />
                      <Clock size={13} color={colors.textSecondary} strokeWidth={1.8} />
                      <Text style={[s.meta, { color: colors.textSecondary }]}>{calcReadTime(post.sections)}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={colors.textTertiary} strokeWidth={1.8} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  feature: { marginHorizontal: 16, marginTop: 16, borderRadius: radius.card, padding: 24, overflow: 'hidden', minHeight: 210, justifyContent: 'flex-end' },
  glow: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)' },
  pill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, marginBottom: 16 },
  pillText: { fontFamily: fonts.sansSemiBold, fontSize: 13, letterSpacing: 0.4 },
  featureTitle: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 34 },
  featureMeta: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.78)' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(245,240,232,0.6)' },
  list: { marginHorizontal: 20, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 20 },
  cat: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1.1, marginBottom: 6 },
  title: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 27 },
  meta: { fontFamily: fonts.sans, fontSize: 14 },
})
