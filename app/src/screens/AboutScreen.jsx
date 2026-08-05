import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft } from 'lucide-react-native'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius } from '../constants/theme'

const PILLARS = [
  {
    title: 'Foundation Blueprint',
    desc: 'Professional career documents: CVs, LinkedIn profiles, cover letters, application form answers, interview preparation, and job search strategy. All reviewed by trained Campus Handlers.',
    color: '#EFF6FF',
  },
  {
    title: 'Elevation Blueprint',
    desc: 'Verified coaches across fitness, nutrition, academic grinds, personal branding, trading, marketing, career guidance, and more. Book one-to-one or group sessions directly through the app.',
    color: '#F0FDF4',
  },
  {
    title: 'Campus Connect',
    desc: 'A campus community hub with boards for accommodation, marketplace, events, lost and found, carpooling, project collaboration, and student societies. Built for your university.',
    color: '#FFF7ED',
  },
  {
    title: 'Lifestyle Blueprint',
    desc: 'Exclusive deals from verified partners, mental health support resources, budgeting tools, and weekly money tips. Built around what student life actually costs.',
    color: '#FDF4FF',
  },
  {
    title: 'Course Connect',
    desc: 'Notes sharing, study groups, module Q and A, exam resources, mentorship matching, and a student database. Everything you need to thrive academically.',
    color: '#F0F9FF',
  },
]

export default function AboutScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={colors.cream} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.heroEyebrow}>ABOUT</Text>
        <Text style={styles.heroTitle}>Our Mission</Text>
        <Text style={styles.heroSub}>
          UniBlueprint exists to give every young person an equal shot at success, regardless of background, connections, or resources.
        </Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionTitle}>What we do</Text>
        <Text style={styles.para}>
          We are a platform built in Ireland, for young people across the country. UniBlueprint bridges the gap between university and the professional world by giving students access to affordable career services, verified coaches, campus community tools, lifestyle deals, and academic resources. All in one place.
        </Text>

        <Text style={styles.sectionTitle}>The five pillars</Text>
        <View style={{ gap: 12 }}>
          {PILLARS.map(p => (
            <Card key={p.title} style={[styles.pillarCard, { backgroundColor: p.color }]}>
              <Text style={styles.pillarTitle}>{p.title}</Text>
              <Text style={styles.pillarDesc}>{p.desc}</Text>
            </Card>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Who we are</Text>
        <Text style={styles.para}>
          UniBlueprint was founded by students who experienced first-hand how difficult it can be to navigate the transition from college life into professional careers. Without the right guidance, the right connections, or the right tools.
        </Text>
        <Text style={styles.para}>
          We built the platform we wished existed when we were students. Every service, every feature, and every partner is chosen with one goal in mind: to genuinely help every young person get ahead.
        </Text>

        <Text style={styles.sectionTitle}>Campus Handlers</Text>
        <Text style={styles.para}>
          Every document submitted through Foundation Blueprint is reviewed by a trained Campus Handler, a student or recent graduate who understands what employers in Ireland are actually looking for. This is not AI-generated output. It is real, human review.
        </Text>

        <Card style={styles.contactCard}>
          <Text style={styles.contactTitle}>Get in touch</Text>
          <Text style={styles.contactSub}>Have a question or want to partner with us?</Text>
          <Text style={styles.contactEmail}>hello@uniblueprint.ie</Text>
        </Card>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scroll: {},

  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream, marginLeft: 4 },
  heroEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 34, color: colors.cream, marginTop: 4 },
  heroSub: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', marginTop: 10, lineHeight: 22 },

  body: { paddingHorizontal: spacing.md, paddingTop: spacing.xl },

  sectionTitle: {
    fontFamily: fonts.serif, fontSize: 22, color: colors.navy,
    marginTop: spacing.xl, marginBottom: spacing.sm,
  },
  para: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: 10 },

  pillarCard: { padding: 16 },
  pillarTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, marginBottom: 6 },
  pillarDesc: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20 },

  contactCard: {
    backgroundColor: colors.navy, borderRadius: radius.card,
    padding: 20, marginTop: spacing.xl,
  },
  contactTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.cream },
  contactSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.65)', marginTop: 4 },
  contactEmail: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream, marginTop: 12 },
})
