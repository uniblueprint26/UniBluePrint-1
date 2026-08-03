import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Plus } from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import { colors, fonts, spacing, radius } from '../constants/theme'

const ADS = [
  {
    type: 'promo',
    tag: 'UniBlueprint',
    title: '50% Off Your First Service',
    detail: 'September trial — every Foundation Blueprint service at half price. CV, LinkedIn, cover letter and more.',
    bg: colors.navy, textColor: colors.cream,
    tagBg: 'rgba(245,240,232,0.15)', tagColor: colors.cream,
    emoji: null,
  },
  {
    type: 'partner',
    tag: 'Automotive',
    title: 'Whip Wizardz — Car Sales and Services',
    detail: 'Vehicle sales, sourcing, inspections, repairs and detailing. Jonesborough, near Dundalk. Book via WhatsApp.',
    bg: '#EFF6FF', textColor: colors.navy,
    tagBg: 'rgba(30,58,95,0.1)', tagColor: colors.navy,
    emoji: '🚗',
  },
  {
    type: 'partner',
    tag: 'Beauty',
    title: 'The Nail Nurse — Nail and Beauty',
    detail: 'Acrylic full sets from €25. Gel polish from €6. Galway. Student discount with valid ID. DM @theenailnurse__',
    bg: '#FDF4FF', textColor: colors.navy,
    tagBg: 'rgba(184,134,11,0.15)', tagColor: '#92400E',
    emoji: '💅',
  },
  {
    type: 'partner',
    tag: 'Fitness',
    title: 'JMC Fitness — Elite Sports Coaching',
    detail: '12-week plan €300. In-person sessions €50 per hour. North Dublin 4G Astro. Analytics €100.',
    bg: '#F0FDF4', textColor: colors.navy,
    tagBg: 'rgba(21,128,61,0.12)', tagColor: '#15803D',
    emoji: '⚽',
  },
  {
    type: 'partner',
    tag: 'Creative',
    title: 'Nyz3ditz — Photography and Video',
    detail: 'Monthly mentorship €55 per month. One-to-one shoot session €90. WhatsApp +353 85 7272 875. @Nyz3ditz',
    bg: '#FFF7ED', textColor: colors.navy,
    tagBg: 'rgba(194,65,12,0.1)', tagColor: '#C2410C',
    emoji: '📸',
  },
  {
    type: 'partner',
    tag: 'Gym',
    title: 'Energie Fitness — Student Membership',
    detail: '€37.99 per month (normal €39.99 to €44.99). €15 joining fee. Mon to Fri 6am to 10pm. Sat to Sun 9am to 5pm.',
    bg: '#F0F9FF', textColor: colors.navy,
    tagBg: 'rgba(3,105,161,0.1)', tagColor: '#0369A1',
    emoji: '🏋️',
  },
  {
    type: 'app',
    tag: 'Campus Connect',
    title: 'Find your campus carpool',
    detail: 'Match with students on your route and split the cost every day.',
    bg: '#FEF9C3', textColor: colors.navy,
    tagBg: 'rgba(30,58,95,0.1)', tagColor: colors.navy,
    emoji: '🚗',
  },
  {
    type: 'app',
    tag: 'Course Connect',
    title: 'Share notes across Ireland',
    detail: '1,200 notes uploaded by students. Search by module and university.',
    bg: '#F5F0E8', textColor: colors.navy,
    tagBg: 'rgba(30,58,95,0.1)', tagColor: colors.navy,
    emoji: '📚',
  },
]

export default function AdBoardScreen() {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
        <UBPLogo height={28} color={colors.cream} />
        <TouchableOpacity style={styles.postBtn} activeOpacity={0.8}>
          <Plus size={15} color={colors.navy} strokeWidth={2.5} />
          <Text style={styles.postBtnText}>Post an Ad</Text>
        </TouchableOpacity>
      </View>

      {/* Heading */}
      <View style={styles.headingWrap}>
        <Text style={styles.screenTitle}>Advertisement Board</Text>
        <Text style={styles.screenSub}>Partner offers, services, and student listings across Ireland</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {ADS.map((ad, i) => (
          <TouchableOpacity key={i} activeOpacity={0.85}>
            <View style={[styles.adCard, { backgroundColor: ad.bg }]}>
              {ad.type === 'promo' ? (
                <View style={{ marginBottom: 14 }}>
                  <UBPLogo height={26} color={ad.textColor} />
                </View>
              ) : ad.emoji ? (
                <Text style={styles.adEmoji}>{ad.emoji}</Text>
              ) : null}

              <View style={[styles.adTag, { backgroundColor: ad.tagBg }]}>
                <Text style={[styles.adTagText, { color: ad.tagColor }]}>{ad.tag}</Text>
              </View>

              <Text style={[styles.adTitle, { color: ad.textColor }]}>{ad.title}</Text>
              <Text style={[styles.adDetail, { color: ad.type === 'promo' ? 'rgba(245,240,232,0.72)' : colors.muted }]}>
                {ad.detail}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.cream, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  postBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },

  headingWrap: { paddingHorizontal: spacing.md, paddingTop: 20, paddingBottom: 12 },
  screenTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy },
  screenSub:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 19 },

  scroll: { paddingHorizontal: spacing.md, paddingTop: 4 },

  adCard: {
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(30,58,95,0.07)',
  },
  adEmoji: { fontSize: 32, marginBottom: 12 },
  adTag: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 10 },
  adTagText: { fontFamily: fonts.sansSemiBold, fontSize: 11 },
  adTitle:  { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 22, marginBottom: 6 },
  adDetail: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19 },
})
