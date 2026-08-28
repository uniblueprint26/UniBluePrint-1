import { useState, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FileText, Target, Users, Heart, Calculator } from 'lucide-react-native'
import { colors, fonts, spacing, radius } from '../../constants/theme'
import UBPLogo from '../../components/ui/UBPLogo'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    icon: FileText,
    color: '#EFF6FF',
    eyebrow: 'FOUNDATION BLUEPRINT',
    title: 'Your career\ndocuments, done right.',
    sub: 'Professional CVs, cover letters, personal statements and LinkedIn profiles. Crafted by verified writers, built for young people across Ireland.',
  },
  {
    icon: Target,
    color: '#F0FDF4',
    eyebrow: 'ELEVATION BLUEPRINT',
    title: 'Coaches who\nget you.',
    sub: 'Book verified coaches in fitness, career, branding, nutrition, trading, creative skills and more. Starting from €25.',
  },
  {
    icon: Users,
    color: '#FFF7ED',
    eyebrow: 'CAMPUS AND COURSE CONNECT',
    title: 'Your campus.\nYour community.',
    sub: 'Connect with classmates, share notes, find project teammates, post on campus boards, and split carpools.',
  },
  {
    icon: Heart,
    color: '#FDF4FF',
    eyebrow: 'LIFESTYLE BLUEPRINT',
    title: 'Deals built\nfor your life.',
    sub: 'Exclusive discounts from verified partners, mental health resources, and weekly money tips. All in one place.',
  },
  {
    icon: Calculator,
    color: '#F0FDF4',
    eyebrow: 'BUDGETING TOOL',
    title: 'Know where\nyour money goes.',
    sub: 'Track your spending, set savings goals, and understand your SUSI entitlement. Built around what life actually costs.',
  },
]

export default function WelcomeScreen({ navigation }) {
  const [slide, setSlide] = useState(0)
  const scrollRef = useRef(null)
  const insets = useSafeAreaInsets()

  function goTo(i) {
    setSlide(i)
    scrollRef.current?.scrollTo({ x: i * width, animated: true })
  }

  function onScroll(e) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width)
    setSlide(idx)
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* Logo header */}
      <View style={styles.logoHeader}>
        <UBPLogo height={44} color={colors.navy} variant="wordmark" />
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ flex: 1 }}
      >
        {SLIDES.map(({ icon: Icon, color, eyebrow, title, sub }, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={[styles.iconWrap, { backgroundColor: color }]}>
              <Icon size={40} color={colors.navy} />
            </View>
            <Text style={styles.slideEyebrow}>{eyebrow}</Text>
            <Text style={styles.slideTitle}>{title}</Text>
            <Text style={styles.slideSub}>{sub}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
            <View style={[styles.dot, slide === i && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Entry — real sign-up / sign-in */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={styles.secondaryBtnText}>I already have an account</Text>
        </TouchableOpacity>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  logoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },

  slide: {
    flex: 1, paddingHorizontal: spacing.md + 8,
    alignItems: 'flex-start', justifyContent: 'center',
    paddingBottom: 60,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  slideEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: colors.muted, letterSpacing: 1.2,
    marginBottom: 10,
  },
  slideTitle: {
    fontFamily: fonts.serif, fontSize: 38,
    color: colors.navy, lineHeight: 46,
    marginBottom: 16,
  },
  slideSub: {
    fontFamily: fonts.sans, fontSize: 15,
    color: colors.muted, lineHeight: 24,
  },

  dots: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 8, paddingVertical: 20,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(30,58,95,0.2)' },
  dotActive: { width: 24, backgroundColor: colors.navy },

  actions: { paddingHorizontal: spacing.md, gap: 12 },

  primaryBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    height: 54, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.cream },

  secondaryBtn: {
    height: 54, alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
})
