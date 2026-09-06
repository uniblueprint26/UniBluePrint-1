/**
 * AboutScreen — in-app mirror of the website's About page
 * (src/pages/AboutPage.jsx): mission statement, founder's story, what makes
 * us different, the Behind the Blueprint timeline, the team, and the launch
 * CTA — same content, adapted for the app per the phase brief:
 *   - no polaroid photos or photo elements of any kind (the timeline below
 *     is the same Behind the Blueprint milestones as text-only entries)
 *   - team members get initials avatars instead of photos (navy circle,
 *     white initials — the same avatar style as the Directory's student
 *     profile cards), keeping full names, roles, nicknames, and bios
 */
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, UserCheck, MapPin, Heart, ArrowRight } from 'lucide-react-native'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { WEBSITE_LINKS } from '../constants/site'

const AVATAR_COLORS = ['#1E3A5F', '#0369A1', '#B45309', '#7C3AED', '#15803D', '#9D174D', '#C2410C', '#0F766E']

function initialsOf(name) {
  return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()
}

const DIFFERENTIATORS = [
  { Icon: UserCheck, title: 'Real people review every output', desc: 'Every Foundation Blueprint submission is reviewed by a trained Campus Handler before it reaches you. No automated outputs, no AI-only pipeline.' },
  { Icon: MapPin, title: 'Built specifically for Ireland', desc: 'From CAO applications to Irish graduate schemes, everything we build is designed around the Irish education system and job market.' },
  { Icon: Heart, title: 'A free tier that genuinely delivers', desc: 'The free plan is not a watered-down teaser. It gives real access to campus community, course boards, and core tools from day one.' },
]

// Same founding leadership as the website's About page — full names, roles,
// nicknames, and bios, just with initials avatars instead of photos.
const LEADERSHIP = [
  { name: 'Desmond',   role: 'Founder',                          nickname: 'The General',    desc: 'Started this whole adventure after a conversation at a birthday dinner in Belfast. Sets the direction, brings the team together and leads from the front.' },
  { name: 'Wami',      role: 'Finance Lead',                     nickname: 'The Heart',       desc: 'Keeps everything steady behind the scenes. Brings care, structure and the calm we need to keep moving forward.' },
  { name: 'Basmali',   role: 'Legal Lead',                       nickname: 'The Shield',      desc: "Has backed the vision from the start. Always ready to step up, challenge what needs challenging and make sure we're covered." },
  { name: 'Tayyab',    role: 'Technology & Development Lead',    nickname: 'The Engine',      desc: 'Keeps the build moving. Turns ideas into something real and is always pushing us towards the next stage.' },
  { name: 'Bene',      role: 'Creative & Marketing Lead',        nickname: 'The Spark',       desc: 'Brings the creativity that keeps us from becoming just another business. Always looking for a different way to approach things.' },
  { name: 'Elizabeth', role: 'Content & Social Lead',            nickname: 'The Voice',       desc: 'Helps give the vision its voice. Creative, reliable and focused on making sure what we say actually sounds like us.' },
  { name: 'Eman',      role: 'Strategy & Technology Lead',       nickname: 'The Brain',       desc: 'Always thinking a few steps ahead. Brings a different perspective and asks the questions that keep us thinking properly.' },
  { name: 'Fabz',      role: 'Campus Growth Lead',               nickname: 'The Reach',       desc: 'Always looking beyond where we are now. Helps take the Blueprint into new spaces, new campuses and new people.' },
  { name: 'Daniel',    role: 'Commercial & Operations Lead',     nickname: 'The Right Hand',  desc: 'Has been here from the beginning. Someone who understands the journey, knows what needs doing and gets involved without hesitation.' },
  { name: 'Aidan',     role: 'Product Lead',                     nickname: 'The Innovator',   desc: 'Always thinking about what could be better. Takes ideas further, challenges the obvious and helps shape where the Blueprint goes next.' },
  { name: 'Sienna',    role: 'Community & Outreach Lead',        nickname: 'The Backbone',    desc: 'Keeps people connected and keeps things moving. Gritty when it matters, dependable when we need her and never afraid to get things done.' },
  { name: 'Zafir',     role: 'Platform & Development Lead',      nickname: 'The Foundation',  desc: 'A lot of what he does happens behind the scenes. Quietly builds the foundations that allow everything else to work.' },
  { name: 'Ethan',     role: 'Marketing & Outreach Lead',        nickname: 'The Pulse',       desc: 'Keeps the energy around the team and the vision alive. Always involved, always pushing and always ready to get stuck in.' },
  { name: 'Alex',      role: 'Digital Marketing Lead',           nickname: 'The Instigator',  desc: 'Gets things moving. Spots opportunities, starts conversations and brings the kind of energy that makes things happen.' },
  { name: 'Rachel',    role: 'Legal & Compliance Lead',          nickname: 'The Guardian',    desc: "Keeps an eye on what matters. Helps protect what we're building and makes sure we stay on the right path." },
]

// Behind The Blueprint — same dated milestones as the website's photo
// clothesline, shown here as a plain text timeline (no photo elements).
const TIMELINE = [
  { label: '#001', date: 'Feb 28, 2026',  title: 'Pilot' },
  { label: '#002', date: 'Feb 28, 2026',  title: 'Cakes and Candles' },
  { label: '#003', date: 'Mar–Apr 2026',  title: 'Finding the Pieces' },
  { label: '#025', date: 'Apr 10, 2026',  title: 'First Look' },
  { label: '#027', date: 'Apr 14, 2026',  title: "We're Online" },
  { label: '#031', date: '2026',          title: 'Course Compass' },
  { label: '#036', date: 'May 5, 2026',   title: 'Ballyhaunis CS' },
  { label: '#037', date: 'May 7, 2026',   title: 'ATU Galway' },
  { label: '#038', date: 'May 8, 2026',   title: 'UCD' },
  { label: '#039', date: 'May 9, 2026',   title: 'Maynooth' },
  { label: '#040', date: 'May 13, 2026',  title: 'Preparations Pt. 1' },
  { label: '#041', date: 'May 13, 2026',  title: 'Preparations Pt. 2' },
  { label: '#042', date: 'May 14, 2026',  title: 'Showtime' },
  { label: '#043', date: 'May 16, 2026',  title: 'Cafe Conversations' },
  { label: '',     date: 'September 2026', title: 'Launch' },
]

export default function AboutScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={colors.cream} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.heroEyebrow}>OUR STORY</Text>
        <Text style={styles.heroTitle}>Built from a birthday dinner in Belfast.</Text>
        <Text style={styles.heroSub}>
          An 18-year-old founder from Ballyhaunis, County Mayo. A conversation at a Belfast birthday dinner that changed everything. This is how UniBlueprint started.
        </Text>
      </View>

      <View style={styles.body}>
        {/* Founder's note */}
        <Text style={styles.sectionEyebrow}>BEHIND THE BLUEPRINT</Text>
        <Text style={styles.sectionTitle}>A note from founder</Text>
        <Text style={styles.para}>
          On February 28th, 2026, I flew to Belfast International for a friend's birthday. Little did I know the Blueprint was about to be born.
        </Text>
        <Text style={styles.para}>
          At the birthday dinner, a conversation about college life sparked the idea, and in that moment the foundation for this brand was created and set in motion. I flew home with a head full of plans and got to work.
        </Text>
        <Text style={styles.para}>
          What followed was weeks of brainstorming, long phone calls, voice messages, recruiting, the pieces forming one by one. By April the app had its first look. By May we were visiting campuses, ATU Galway, UCD, Maynooth, and back to Ballyhaunis Community School where it all began. September 2026 is launch.
        </Text>
        <Text style={styles.para}>
          Every step of it is documented. 43 posts and counting on the VSCO, Behind the Blueprint. From the pilot to launch day.
        </Text>

        <Card style={styles.quoteCard}>
          <View style={styles.quoteBar} />
          <Text style={styles.quoteText}>
            "Young people in Ireland were navigating some of the biggest decisions of their lives with almost no structured support. We decided to change that."
          </Text>
          <Text style={styles.quoteByline}>DESMOND, FOUNDER</Text>
        </Card>

        <TouchableOpacity activeOpacity={0.7} onPress={() => Linking.openURL('https://vsco.co/uniblueprint')} style={styles.vscoLink}>
          <Text style={styles.vscoLinkText}>Follow the journey on VSCO</Text>
          <ArrowRight size={13} color={colors.muted} />
        </TouchableOpacity>

        {/* Timeline */}
        <Text style={[styles.sectionEyebrow, { marginTop: spacing.xl }]}>BEHIND THE BLUEPRINT</Text>
        <Text style={styles.sectionTitle}>From idea to launch, documented.</Text>
        <Text style={styles.para}>43 posts. 5 months. Every step of building UniBlueprint, in public.</Text>
        <View style={styles.timeline}>
          {TIMELINE.map((t, i) => (
            <View key={i} style={styles.timelineRow}>
              <View style={styles.timelineMarkerCol}>
                <View style={styles.timelineDot} />
                {i < TIMELINE.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>{t.date}{t.label ? ` · Behind the Blueprint ${t.label.replace('#', '')}` : ''}</Text>
                <Text style={styles.timelineTitle}>{t.title}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Mission */}
        <Text style={[styles.sectionEyebrow, { marginTop: spacing.xl }]}>OUR MISSION</Text>
        <Text style={styles.sectionTitle}>The structure behind your success, for every young person in Ireland.</Text>
        <Text style={styles.para}>
          UniBlueprint exists because young people in Ireland have always deserved proper, structured support, across every pathway, not just university. Whether you are doing your Leaving Cert, heading into college, taking an apprenticeship, or already in work and looking for what comes next, the platform is built around you.
        </Text>
        <Text style={styles.para}>
          We built it honestly. From a small town in Mayo, with a team assembled over voice messages and late-night calls. Real people reviewing every submission. Real coaches delivering every session. A free tier that actually gives you something. And every step of it documented so you can see exactly how it was built.
        </Text>

        {/* What makes us different */}
        <Text style={[styles.sectionEyebrow, { marginTop: spacing.xl }]}>WHAT MAKES US DIFFERENT</Text>
        <Text style={styles.sectionTitle}>Built differently, on purpose.</Text>
        <View style={{ gap: 12, marginTop: spacing.md }}>
          {DIFFERENTIATORS.map(d => (
            <Card key={d.title} style={styles.diffCard}>
              <View style={styles.diffIconWrap}>
                <d.Icon size={20} color={colors.navy} strokeWidth={1.7} />
              </View>
              <Text style={styles.diffTitle}>{d.title}</Text>
              <Text style={styles.diffDesc}>{d.desc}</Text>
            </Card>
          ))}
        </View>

        {/* Team */}
        <Text style={[styles.sectionEyebrow, { marginTop: spacing.xl }]}>THE TEAM</Text>
        <Text style={styles.sectionTitle}>The people behind the Blueprint.</Text>
        <Text style={styles.para}>
          Every one of these people is still a student, or barely out of being one. That's not a gap we're working around, it's the whole point. This is built by the people who will actually use it, who get exactly what's missing because they're living it themselves. The structure behind our success is each other.
        </Text>
        <View style={{ gap: 10, marginTop: spacing.md }}>
          {LEADERSHIP.map((t, i) => (
            <Card key={t.name} style={styles.teamCard}>
              <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
                <Text style={styles.avatarText}>{initialsOf(t.name)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.teamName}>{t.name}</Text>
                <Text style={styles.teamRole}>{t.role.toUpperCase()}</Text>
                <Text style={styles.teamNickname}>{t.nickname}</Text>
                <Text style={styles.teamDesc}>{t.desc}</Text>
              </View>
            </Card>
          ))}
        </View>

        <Card style={styles.joinCard}>
          <Text style={styles.joinTitle}>Want to be part of the team building this?</Text>
          <Text style={styles.joinBody}>
            We are building the founding team across every function, tech, marketing, outreach, finance, legal, and partnerships. If you care about what we are building, we want to hear from you.
          </Text>
          <TouchableOpacity style={styles.joinBtn} activeOpacity={0.85} onPress={() => Linking.openURL(`${WEBSITE_LINKS.contact}`)}>
            <Text style={styles.joinBtnText}>Join the Team</Text>
          </TouchableOpacity>
        </Card>

        {/* Launch CTA */}
        <View style={styles.launchCta}>
          <Text style={styles.launchTitle}>Launching September 2026.</Text>
          <Text style={styles.launchSub}>Across Irish universities and colleges during freshers week.</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  scroll: {},

  hero: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream, marginLeft: 4 },
  heroEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.cream, marginTop: 6, lineHeight: 35 },
  heroSub: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', marginTop: 10, lineHeight: 22 },

  body: { paddingHorizontal: spacing.md, paddingTop: spacing.xl },

  sectionEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.light, letterSpacing: 1, textTransform: 'uppercase' },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.navy, marginTop: 8, marginBottom: spacing.sm, lineHeight: 28 },
  para: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: 10 },

  quoteCard: { backgroundColor: colors.navy, padding: 20, marginTop: spacing.sm, position: 'relative', overflow: 'hidden' },
  quoteBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.cream },
  quoteText: { fontFamily: fonts.serifItalic, fontSize: 17, color: colors.cream, lineHeight: 25, marginLeft: 4 },
  quoteByline: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)', letterSpacing: 0.6, marginTop: 14, marginLeft: 4 },

  vscoLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  vscoLinkText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.muted },

  // Timeline (text-only — no photo elements, per phase brief)
  timeline: { marginTop: spacing.md },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineMarkerCol: { alignItems: 'center', width: 12 },
  timelineDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.gold, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, backgroundColor: 'rgba(30,58,95,0.12)', marginTop: 2, minHeight: 26 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineDate: { fontFamily: fonts.sans, fontSize: 11, color: colors.light },
  timelineTitle: { fontFamily: fonts.serifItalic, fontSize: 15, color: colors.navy, marginTop: 2 },

  diffCard: { padding: 18 },
  diffIconWrap: { width: 44, height: 44, borderRadius: 11, backgroundColor: 'rgba(30,58,95,0.07)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  diffTitle: { fontFamily: fonts.serif, fontSize: 16, color: colors.navy, marginBottom: 6 },
  diffDesc: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19 },

  teamCard: { flexDirection: 'row', gap: 14, padding: 16 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white },
  teamName: { fontFamily: fonts.serif, fontSize: 16, color: colors.navy },
  teamRole: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, color: colors.goldDeep, letterSpacing: 0.5, marginTop: 2 },
  teamNickname: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.light, fontStyle: 'italic', marginTop: 2, marginBottom: 6 },
  teamDesc: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, lineHeight: 18 },

  joinCard: { backgroundColor: colors.navy, padding: 22, marginTop: spacing.lg, alignItems: 'center' },
  joinTitle: { fontFamily: fonts.serif, fontSize: 19, color: colors.cream, textAlign: 'center', lineHeight: 25 },
  joinBody: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.65)', textAlign: 'center', marginTop: 10, lineHeight: 19 },
  joinBtn: { backgroundColor: colors.cream, borderRadius: radius.button, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 },
  joinBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.navy },

  launchCta: { backgroundColor: colors.navy, borderRadius: radius.card, padding: 26, marginTop: spacing.xl, alignItems: 'center' },
  launchTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.cream, textAlign: 'center' },
  launchSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.6)', marginTop: 8, textAlign: 'center' },
})
