import { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FileText, Target, Users, Heart, Calculator } from 'lucide-react-native'
import { fonts, spacing, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useLightBackgroundStatusBar } from '../../hooks/useStatusBarStyle'
import UBPLogo from '../../components/ui/UBPLogo'
import { useFoundationEnabled } from '../../hooks/useAppFlags'
import { NATIVE_NEUTRAL_BILLING } from '../../constants/platformPolicy'

const { width } = Dimensions.get('window')

const ALL_SLIDES = [
  {
    key: 'foundation',
    icon: FileText,
    color: '#1E3A5F',
    eyebrow: 'FOUNDATION BLUEPRINT',
    title: 'Your career\ndocuments, done right.',
    sub: 'Professional CVs, cover letters, personal statements and LinkedIn profiles. Crafted by verified writers, built for young people across Ireland.',
  },
  {
    icon: Target,
    color: '#5B4B8A',
    eyebrow: 'ELEVATION BLUEPRINT',
    title: 'Coaches who\nget you.',
    // No price on iOS and Android (neutral billing).
    sub: NATIVE_NEUTRAL_BILLING
      ? 'Find coaches in fitness, career, branding, nutrition, creative skills and more.'
      : 'Book coaches in fitness, career, branding, nutrition, creative skills and more. Starting from €25.',
  },
  {
    icon: Users,
    color: '#C96A42',
    eyebrow: 'CAMPUS AND COURSE CONNECT',
    title: 'Your campus.\nYour community.',
    sub: 'Connect with classmates, share notes, find project teammates, post on campus boards, and split carpools.',
  },
  {
    icon: Heart,
    color: '#D9596B',
    eyebrow: 'LIFESTYLE BLUEPRINT',
    title: 'Deals built\nfor your life.',
    sub: 'Exclusive discounts from verified partners, mental health resources, and weekly money tips. All in one place.',
  },
  {
    icon: Calculator,
    color: '#B4923A',
    eyebrow: 'BUDGETING TOOL',
    title: 'Know where\nyour money goes.',
    sub: 'Track your spending, set savings goals, and see every grant, wage support or scheme you could be owed. Built around what life actually costs, student, apprentice, or working.',
  },
]

const CARD_W = width - 64
const GAP = 12

export default function WelcomeScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  // Cream screen, so the status bar icons must be dark here.
  useLightBackgroundStatusBar()
  // The Foundation slide is left out while Foundation is closed on iOS and Android.
  const { enabled: foundationOpen } = useFoundationEnabled()
  const SLIDES = foundationOpen ? ALL_SLIDES : ALL_SLIDES.filter(sl => sl.key !== 'foundation')
  const [slide, setSlide] = useState(0)
  const scrollRef = useRef(null)
  const insets = useSafeAreaInsets()

  function goTo(i) {
    setSlide(i)
    scrollRef.current?.scrollTo({ x: i * (CARD_W + GAP), animated: true })
  }

  function onScroll(e) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + GAP))
    setSlide(Math.max(0, Math.min(SLIDES.length - 1, idx)))
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* Wordmark left, Sign in right */}
      <View style={styles.topRow}>
        <UBPLogo height={34} color={colors.textPrimary} variant="wordmark" />
        <TouchableOpacity
          onPress={() => navigation.navigate('SignIn')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          <Text style={styles.signInLink}>Sign in</Text>
        </TouchableOpacity>
      </View>

      {/* One card per pillar. The next card peeks in from the right. */}
      <View style={styles.cardsWrap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_W + GAP}
          decelerationRate="fast"
          onMomentumScrollEnd={onScroll}
          contentContainerStyle={styles.cardsRow}
        >
          {SLIDES.map(({ icon: Icon, color, eyebrow, title, sub }, i) => (
            <View
              key={i}
              style={[styles.card, { width: CARD_W, backgroundColor: color + '1F', borderColor: color + '33' }]}
            >
              <View style={[styles.iconWrap, { backgroundColor: color + '2E' }]}>
                <Icon size={34} color={colors.textPrimary} strokeWidth={1.7} />
              </View>
              <Text style={styles.slideEyebrow}>{eyebrow}</Text>
              <Text style={styles.slideTitle}>{title}</Text>
              <Text style={styles.slideSub}>{sub}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`Show card ${i + 1}`}>
            <View style={[styles.dot, slide === i && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      {/* Entry: real sign-up and sign-in */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('SignUp')}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>Get started</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('SignIn')}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryBtnText}>I already have an account</Text>
        </TouchableOpacity>
      </View>

    </View>
  )
}

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  topRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: 10,
  },
  signInLink: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.textPrimary },

  cardsWrap: { marginTop: 14 },
  cardsRow: { paddingHorizontal: spacing.lg, gap: GAP },
  card: {
    minHeight: 430, borderRadius: 28, borderWidth: 1,
    paddingHorizontal: 26, paddingTop: 28, paddingBottom: 28,
    alignItems: 'flex-start', justifyContent: 'flex-start',
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },
  slideEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 12,
    color: colors.textSecondary, letterSpacing: 1.3,
    marginBottom: 12,
  },
  slideTitle: {
    fontFamily: fonts.serif, fontSize: 34,
    color: colors.textPrimary, lineHeight: 41,
    marginBottom: 16,
  },
  slideSub: {
    fontFamily: fonts.sans, fontSize: 16,
    color: colors.textSecondary, lineHeight: 24,
  },

  dots: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 8, paddingVertical: 22,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 24, backgroundColor: colors.accentBg },

  actions: { paddingHorizontal: spacing.lg, gap: 12 },

  primaryBtn: {
    backgroundColor: colors.accentBg, borderRadius: radius.button,
    height: 54, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.accentFg },

  secondaryBtn: {
    height: 54, alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
  })
}
