import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import { Mail, ChevronRight, GraduationCap, Briefcase } from 'lucide-react-native'
import { ToolScreen, Card, Btn, LinkRow, openLink } from '../../components/explore/ToolBits'
import { SCOUT } from '../../constants/partnerBrands'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { SUPPORT_EMAIL } from '../../constants/site'

// Internships. First a "Looking to work at UBP?" block, then ScoutByRohi as the
// headline tracker, then other listing sites as plain links. Every link opens
// in the browser and UBP takes no applications.

const MAIL = 'mailto:' + SUPPORT_EMAIL + '?subject=' + encodeURIComponent('Looking to work at UBP')

const SITES = [
  { key: 'gradireland', title: 'gradireland', sub: 'Graduate jobs and schemes in Ireland', url: 'https://gradireland.com', Icon: GraduationCap },
  { key: 'irishjobs', title: 'IrishJobs', sub: 'Jobs and internships across Ireland', url: 'https://www.irishjobs.ie', Icon: Briefcase },
]

export default function InternshipsScreen({ navigation }) {
  const { colors } = useTheme()
  return (
    <ToolScreen navigation={navigation} title="Internships" subtitle="Real openings, from official sources.">
      {/* UBP block */}
      <Card style={{ padding: 20 }}>
        <Text style={[s.ubpTitle, { color: colors.textPrimary }]}>Looking to work at UBP?</Text>
        <Text style={[s.ubpBody, { color: colors.textSecondary }]}>
          We are always glad to hear from motivated students and workers. Tell us what you are good at and what you would like to learn.
        </Text>
        <Btn label="Email us" Icon={Mail} onPress={() => openLink(MAIL)} style={{ marginTop: 16 }} />
      </Card>

      {/* ScoutByRohi headline card */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ScoutPartner')}
        accessibilityRole="button"
        accessibilityLabel="ScoutByRohi. Irish internship and graduate scheme tracker. Open"
        style={[s.scout, { backgroundColor: SCOUT.forest }]}
      >
        <View style={s.scoutTop}>
          <View style={[s.scoutLogoTile, { backgroundColor: SCOUT.mint }]}>
            <Image source={require('../../../assets/partners/scout/logo.png')} style={s.scoutLogo} resizeMode="contain" />
          </View>
          <View style={[s.pill, { backgroundColor: SCOUT.signal }]}>
            <Text style={[s.pillText, { color: SCOUT.forest }]}>Our partner</Text>
          </View>
        </View>
        <Text style={[s.scoutName, { color: '#F6F8F5' }]}>ScoutByRohi</Text>
        <Text style={[s.scoutLine, { color: '#F6F8F5' }]}>Irish internship and graduate scheme tracker. Listings link to the employer's own application.</Text>
        <View style={s.scoutCta}>
          <Text style={[s.scoutCtaText, { color: SCOUT.signal }]}>Open</Text>
          <ChevronRight size={16} color={SCOUT.signal} strokeWidth={2.4} />
        </View>
      </TouchableOpacity>

      <Text style={[s.h2, { color: colors.textPrimary }]}>More listing sites</Text>
      <View style={[s.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {SITES.map((x, i) => (
          <LinkRow key={x.key} Icon={x.Icon} title={x.title} sub={x.sub} url={x.url} last={i === SITES.length - 1} />
        ))}
      </View>
      <Text style={[s.note, { color: colors.textSecondary }]}>Links open in your browser. UBP takes no applications.</Text>
    </ToolScreen>
  )
}

const s = StyleSheet.create({
  ubpTitle: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 30 },
  ubpBody: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 22, marginTop: 8 },
  scout: { borderRadius: 22, padding: 20, marginTop: 14 },
  scoutTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scoutLogoTile: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  scoutLogo: { width: 44, height: 44 },
  pill: { paddingHorizontal: 12, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  scoutName: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, marginTop: 18 },
  scoutLine: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, marginTop: 6, opacity: 0.85 },
  scoutCta: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 16 },
  scoutCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  h2: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28, marginTop: 30, marginBottom: 12, paddingHorizontal: 2 },
  list: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  note: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, marginTop: 14, paddingHorizontal: 4 },
})
