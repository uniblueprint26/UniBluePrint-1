import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { ShieldCheck, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react-native'
import { ToolScreen, Card, Eyebrow, H2, Body } from '../components/explore/ToolBits'
import { PILLARS } from '../constants/pillars'
import { COACHES } from './ElevationScreen'
import { PARTNERS } from '../data/lifestylePartners'
import { MENTAL_HEALTH_CATEGORIES } from '../data/mentalHealthSupport'
import { useFoundationOrdering } from '../hooks/useAppFlags'
import { useTheme } from '../context/ThemeContext'
import { fonts } from '../constants/theme'

// For parents. A plain, read only page for a parent or guardian who wants to
// see what UniBlueprint is. It is only reachable from inside an adult account
// (UBP is 18 and over). It shows public information that already ships in the
// app, stores nothing, asks for nothing and has no way to message anyone.
// There are no accounts for under 18s and no data about them anywhere.

const FOUNDATION_SERVICES = [
  'CV Optimisation', 'Portfolio Building', 'LinkedIn Optimisation', 'Cover Letter Assistance',
  'Personal Statement', 'Application Form Assistance', 'Interview Preparation', 'Job Search Support',
]

const PREVIEW = 5

export default function ParentInfoScreen({ navigation }) {
  const { colors } = useTheme()
  const { enabled: orderingOpen } = useFoundationOrdering()
  const [allCoaches, setAllCoaches] = useState(false)
  const [allPartners, setAllPartners] = useState(false)

  const coaches = COACHES
  const partners = PARTNERS.filter(p => p.status === 'live')
  const crisis = MENTAL_HEALTH_CATEGORIES.find(c => c.key === 'crisis')?.items || []

  const P = PILLARS

  return (
    <ToolScreen navigation={navigation} title="For parents" subtitle="What UniBlueprint is, for a parent or guardian.">
      <View style={[s.notice, { backgroundColor: colors.tabFill }]}>
        <ShieldCheck size={20} color={colors.textPrimary} strokeWidth={1.8} style={{ marginTop: 1 }} />
        <Text style={[s.noticeText, { color: colors.textPrimary }]}>
          <Text style={{ fontFamily: fonts.sansSemiBold }}>Read only. </Text>
          UniBlueprint is for people aged 18 and over. We do not make accounts for anyone under 18 and we never message anyone under 18. Nothing on this page collects information about your child.
        </Text>
      </View>

      <Section title="What UniBlueprint is">
        <Body secondary>
          An app for people in Ireland who are getting ready for what comes next, whether that is college, an apprenticeship or work. It has five parts.
        </Body>
        <PillarLine Icon={P.foundation.Icon} color={colors.textPrimary} name="Foundation" text="Help with career documents, like a CV or a cover letter." />
        <PillarLine Icon={P.elevation.Icon} color={P.elevation.color} name="Elevation" text="Coaches who offer lessons, training and guidance." />
        <PillarLine Icon={P.lifestyle.Icon} color={P.lifestyle.color} name="Lifestyle" text="Local partners and student offers." />
        <PillarLine Icon={P.campus.Icon} color={P.campus.color} name="Campus Connect" text="Your own community in the same situation, such as a campus, a trade or an industry." />
        <PillarLine Icon={P.course.Icon} color={P.course.color} name="Course Connect" text="One place across Ireland where everyone is on the same course of life, working toward getting better." last />
      </Section>

      <Section title="Foundation">
        <Body secondary>Foundation helps members prepare these documents and applications.</Body>
        <View style={s.tags}>
          {FOUNDATION_SERVICES.map(t => (
            <View key={t} style={[s.tag, { backgroundColor: colors.tabFill }]}><Text style={[s.tagText, { color: colors.textPrimary }]}>{t}</Text></View>
          ))}
        </View>
        {!orderingOpen && <Body secondary style={{ marginTop: 12 }}>Ordering opens in January.</Body>}
      </Section>

      <Section title="Elevation coaches">
        <Body secondary>The coaches members can find in the app. Each coach sets their own details on their profile.</Body>
        <View style={{ marginTop: 6 }}>
          {(allCoaches ? coaches : coaches.slice(0, PREVIEW)).map((c, i) => (
            <Row key={c.id} title={c.name} sub={c.category} last={i === (allCoaches ? coaches.length : Math.min(PREVIEW, coaches.length)) - 1} />
          ))}
        </View>
        {coaches.length > PREVIEW && <More open={allCoaches} count={coaches.length} onPress={() => setAllCoaches(v => !v)} />}
      </Section>

      <Section title="Lifestyle partners">
        <Body secondary>The partners members can find in Lifestyle.</Body>
        <View style={{ marginTop: 6 }}>
          {(allPartners ? partners : partners.slice(0, PREVIEW)).map((p, i) => (
            <Row key={p.id} title={p.brand} sub={[p.category, p.county].filter(Boolean).join(', ')} last={i === (allPartners ? partners.length : Math.min(PREVIEW, partners.length)) - 1} />
          ))}
        </View>
        {partners.length > PREVIEW && <More open={allPartners} count={partners.length} onPress={() => setAllPartners(v => !v)} />}
      </Section>

      <Section title="Campus Connect and Course Connect">
        <Body secondary>
          Course Connect is public across Ireland. It is the default place a post goes. Campus Connect is a smaller community of people in the same situation. Members can also choose Friends only, which means people who follow each other.
        </Body>
        <Body secondary style={{ marginTop: 10 }}>
          Course here means a course of life, not a school subject. Everyone is on the same one.
        </Body>
      </Section>

      <Section title="Safety">
        <Bullet text="Members must be 18 or over. We do not allow under 18s on UniBlueprint." />
        <Bullet text="Every post can be reported, and any member can be blocked." />
        <Bullet text="Posts are checked for harmful language before they go up." />
        <Bullet text="A member can delete their account and their data from Privacy and Data in their profile." />
        <Bullet text="If you think someone under 18 is using the app, tell us at support@uniblueprint.ie and we will act on it." last />
      </Section>

      <Section title="Support and helplines">
        <Body secondary>Free to call. If someone is in immediate danger, call 999 or 112.</Body>
        <View style={{ marginTop: 6 }}>
          {crisis.map((c, i) => (
            <Row key={c.name} title={c.name} sub={`${c.number}. ${c.hours}`} Icon={Phone} onPress={() => Linking.openURL(c.link).catch(() => {})} last={i === crisis.length - 1} />
          ))}
        </View>
        <Row title="UniBlueprint support" sub="support@uniblueprint.ie" Icon={Mail} onPress={() => Linking.openURL('mailto:support@uniblueprint.ie').catch(() => {})} last top />
      </Section>
    </ToolScreen>
  )
}

function Section({ title, children }) {
  return (
    <View style={{ marginTop: 28 }}>
      <Eyebrow style={{ marginBottom: 10 }}>{title}</Eyebrow>
      <Card>{children}</Card>
    </View>
  )
}

function PillarLine({ Icon, color, name, text, last }) {
  const { colors } = useTheme()
  return (
    <View style={[s.pillar, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <View style={[s.pillarIcon, { backgroundColor: colors.tabFill }]}><Icon size={18} color={color} strokeWidth={1.8} /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.rowTitle, { color: colors.textPrimary }]}>{name}</Text>
        <Text style={[s.rowSub, { color: colors.textSecondary }]}>{text}</Text>
      </View>
    </View>
  )
}

function Row({ title, sub, Icon, onPress, last, top }) {
  const { colors } = useTheme()
  const Wrap = onPress ? TouchableOpacity : View
  return (
    <Wrap
      {...(onPress ? { onPress, activeOpacity: 0.75, accessibilityRole: 'link', accessibilityLabel: `${title}. ${sub}` } : {})}
      style={[s.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, top && { marginTop: 4 }]}
    >
      {Icon ? <Icon size={18} color={colors.textPrimary} strokeWidth={1.8} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.rowTitle, { color: colors.textPrimary }]} numberOfLines={2}>{title}</Text>
        {!!sub && <Text style={[s.rowSub, { color: colors.textSecondary }]} numberOfLines={2}>{sub}</Text>}
      </View>
    </Wrap>
  )
}

function Bullet({ text, last }) {
  const { colors } = useTheme()
  return (
    <View style={[s.bullet, last && { marginBottom: 0 }]}>
      <View style={[s.dot, { backgroundColor: colors.textSecondary }]} />
      <Text style={[s.bulletText, { color: colors.textPrimary }]}>{text}</Text>
    </View>
  )
}

function More({ open, count, onPress }) {
  const { colors } = useTheme()
  const Chev = open ? ChevronUp : ChevronDown
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button" style={s.more}>
      <Text style={[s.moreText, { color: colors.textPrimary }]}>{open ? 'Show fewer' : `Show all ${count}`}</Text>
      <Chev size={16} color={colors.textPrimary} strokeWidth={2} />
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  notice: { flexDirection: 'row', gap: 12, borderRadius: 16, padding: 16, marginTop: 4 },
  noticeText: { flex: 1, fontFamily: fonts.sans, fontSize: 14, lineHeight: 21 },
  pillar: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  pillarIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, minHeight: 52 },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, lineHeight: 21 },
  rowSub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, marginTop: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tag: { borderRadius: 14, paddingVertical: 7, paddingHorizontal: 12 },
  tagText: { fontFamily: fonts.sansMedium, fontSize: 13 },
  bullet: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 9 },
  bulletText: { flex: 1, fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 22 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 14 },
  moreText: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
})
