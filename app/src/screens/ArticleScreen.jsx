/**
 * ArticleScreen: full in-app article view for an Ad Board Blog post (round
 * three pick B). A navy header panel with the category, title and date, then
 * the opening paragraph as a serif lead and the rest in a calm reading
 * column. Same section structure as the website (paragraph, heading, list).
 * Route params: { slug }, looked up in data/blogPosts.js.
 */
import { ScrollView, View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Clock } from 'lucide-react-native'
import AppHeader from '../components/ui/AppHeader'
import ErrorState from '../components/ui/ErrorState'
import { fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { getPost, calcReadTime, formatDate } from '../data/blogPosts'
import { useFoundationEnabled } from '../hooks/useAppFlags'

function Section({ section, lead }) {
  const { colors } = useTheme()
  if (section.type === 'heading') {
    return <Text style={[s.heading, { color: colors.textPrimary }]}>{section.text}</Text>
  }
  if (section.type === 'list') {
    return (
      <View style={s.list}>
        {section.items.map((item, i) => (
          <View key={i} style={s.listRow}>
            <View style={[s.dot, { backgroundColor: colors.textPrimary }]} />
            <Text style={[s.listText, { color: colors.textSecondary }]}>{item}</Text>
          </View>
        ))}
      </View>
    )
  }
  if (lead) return <Text style={[s.lead, { color: colors.textPrimary }]}>{section.text}</Text>
  return <Text style={[s.paragraph, { color: colors.textSecondary }]}>{section.text}</Text>
}

export default function ArticleScreen({ navigation, route }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { slug } = route.params ?? {}
  useFoundationEnabled() // the article text depends on it
  const post = getPost(slug)

  if (!post) {
    return (
      <View style={[s.screen, { backgroundColor: colors.background }]}>
        <AppHeader navigation={navigation} showBack />
        <ErrorState kind="notfound" title="Article not found" body="It may have been removed, or the link is out of date." />
      </View>
    )
  }

  const firstIsLead = post.sections[0]?.type === 'paragraph'

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 48 }} showsVerticalScrollIndicator={false}>
        <View style={[s.hero, { backgroundColor: colors.chromeBg }]}>
          <View style={s.pill}><Text style={[s.pillText, { color: colors.chromeFg }]}>{post.category}</Text></View>
          <Text style={[s.title, { color: colors.chromeFg }]}>{post.title}</Text>
          <View style={s.metaRow}>
            <Text style={s.meta}>{formatDate(post.date)}</Text>
            <View style={s.metaDot} />
            <Clock size={14} color="rgba(245,240,232,0.72)" strokeWidth={1.8} />
            <Text style={s.meta}>{calcReadTime(post.sections)}</Text>
          </View>
        </View>
        <View style={s.body}>
          {post.sections.map((sec, i) => <Section key={i} section={sec} lead={i === 0 && firstIsLead} />)}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  hero: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 30 },
  pill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  pillText: { fontFamily: fonts.sansSemiBold, fontSize: 13, letterSpacing: 0.4 },
  title: { fontFamily: fonts.serif, fontSize: 31, lineHeight: 38, marginTop: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  meta: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.78)' },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(245,240,232,0.6)' },
  body: { paddingHorizontal: 20, paddingTop: 24 },
  lead: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 31 },
  heading: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 30, marginTop: 30, marginBottom: 4 },
  paragraph: { fontFamily: fonts.sans, fontSize: 16.5, lineHeight: 27, marginTop: 14 },
  list: { marginTop: 14, gap: 14 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 11, flexShrink: 0 },
  listText: { fontFamily: fonts.sans, fontSize: 16.5, lineHeight: 26, flex: 1 },
})
