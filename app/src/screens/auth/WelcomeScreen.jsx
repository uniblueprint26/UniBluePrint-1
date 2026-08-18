import { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FileText, Target, Users, Heart, Calculator } from 'lucide-react-native'
import { colors, fonts, spacing, radius } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'
import UBPLogo from '../../components/ui/UBPLogo'

// TEMPORARY — remove once the "network request failed" sign-in issue is
// resolved. Two chained iOS prompts (name, then college) so people can get
// past the login wall and into the app for filming without hitting Supabase.
function promptGuestAccess(guestSignIn) {
  Alert.prompt('Your name', 'Just for this preview session.', name => {
    if (!name?.trim()) return
    Alert.prompt('Your college', 'e.g. ATU Sligo, UCD, TU Dublin…', institution => {
      guestSignIn(name.trim(), institution?.trim() || '')
    })
  })
}

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
  const { guestSignIn } = useAuth()
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
        <TouchableOpacity
          style={styles.skipBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text style={styles.skipText}>Sign in</Text>
        </TouchableOpacity>
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

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 24 }]}>
        {slide < SLIDES.length - 1 ? (
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={() => goTo(slide + 1)}>
            <Text style={styles.primaryBtnText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('SignUp')}
            >
              <Text style={styles.primaryBtnText}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('SignIn')}
            >
              <Text style={styles.secondaryBtnText}>I already have an account</Text>
            </TouchableOpacity>
          </>
        )}

        {/* TEMPORARY — remove once sign-in network issue is resolved */}
        <TouchableOpacity
          style={styles.guestBtn}
          activeOpacity={0.7}
          onPress={() => promptGuestAccess(guestSignIn)}
        >
          <Text style={styles.guestBtnText}>Preview without an account</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  skipBtn: { paddingVertical: 12 },
  skipText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy },

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
    height: 48, alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy },

  guestBtn: { height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  guestBtnText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, textDecorationLine: 'underline' },
})
