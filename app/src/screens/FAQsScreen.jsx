import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronRight } from 'lucide-react-native'
import Card from '../components/ui/Card'
import ScreenHeader from '../components/ui/ScreenHeader'
import { colors, fonts, spacing, radius } from '../constants/theme'
import { WEBSITE_LINKS } from '../constants/site'

const FAQS = [
  {
    q: 'Is UniBlueprint free to use?',
    a: 'Yes. UniBlueprint is free to join. Core features including CV submission, campus boards, course connect, and lifestyle deals are available to all members. Premium features unlock priority coach access and advanced document services.',
  },
  {
    q: 'How do Foundation Blueprint services work?',
    a: 'You submit your details and any existing documents through the app. Your submission is AI-assisted, and every output is always reviewed by a trained Campus Handler before it comes back to you within 48 hours (Standard) or the same day (Premium).',
  },
  {
    q: 'What is a Campus Handler?',
    a: 'Campus Handlers are students or recent graduates trained by UniBlueprint to review and optimise career documents. They understand what employers in Ireland are actually looking for and apply that knowledge to every submission they handle.',
  },
  {
    q: 'How do I book a coach through Elevation Blueprint?',
    a: 'Open Elevation Blueprint from the menu, view each coach\'s profile, services, and pricing, then tap "View Profile" to contact or book directly. Each coach manages their own availability.',
  },
  {
    q: 'How do partner deals work?',
    a: 'Partner deals are exclusive arrangements between UniBlueprint and verified Irish businesses. Tap any partner in the Lifestyle section to see the full deal details, pricing, and how to claim. Most deals require you to mention UniBlueprint when booking.',
  },
  {
    q: 'Is my data safe with UniBlueprint?',
    a: 'Yes. Your data is stored securely and we never sell or share your personal data with third parties. Your documents and profile information are used only to deliver our services to you.',
  },
  {
    q: 'How do I cancel or get a refund?',
    a: 'If you are not satisfied with a service, contact us within 48 hours of delivery at uniblueprintoperations@gmail.com and we will work with you to resolve it.',
    link: { label: 'Read our refund policy', url: WEBSITE_LINKS.refundPolicy },
  },
  {
    q: 'Can I become a Campus Handler or Coach?',
    a: 'Yes. We are always looking for motivated students and professionals to join our team. Tap "Become a Coach" in the Profile section to apply. For Campus Handler applications, contact us directly at uniblueprintoperations@gmail.com.',
  },
  {
    q: 'Which universities does UniBlueprint cover?',
    a: 'UniBlueprint is open to students from all universities and colleges across Ireland, including UCD, TCD, UCC, DCU, University of Galway, UL, Maynooth, TU Dublin, RCSI, ATU, TUS, and SETU. If your institution is not listed, select "Other" when signing up.',
  },
]

export default function FAQsScreen({ navigation }) {
  const [open, setOpen] = useState(null)
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        variant="navy"
        onBack={() => navigation.goBack()}
        eyebrow="SUPPORT"
        title="FAQs"
        subtitle="Common questions about UniBlueprint, answered."
        style={styles.hero}
        titleStyle={styles.heroTitle}
      />

      <View style={styles.body}>
        <View style={{ gap: 10 }}>
          {FAQS.map(({ q, a, link }, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={0.85}
              onPress={() => setOpen(open === i ? null : i)}
            >
              <Card style={[styles.faqCard, open === i && styles.faqCardOpen]}>
                <View style={styles.faqTop}>
                  <Text style={styles.faqQ}>{q}</Text>
                  <ChevronRight
                    size={16}
                    color={colors.muted}
                    style={{ transform: [{ rotate: open === i ? '90deg' : '0deg' }], flexShrink: 0 }}
                  />
                </View>
                {open === i && (
                  <>
                    <Text style={styles.faqA}>{a}</Text>
                    {link && (
                      <Text
                        style={styles.faqLink}
                        onPress={() => Linking.openURL(link.url)}
                      >
                        {link.label} →
                      </Text>
                    )}
                  </>
                )}
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <Card style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still have questions?</Text>
          <Text style={styles.contactSub}>
            We're happy to help. Reach out at{' '}
            <Text
              style={styles.contactEmail}
              onPress={() => Linking.openURL('mailto:uniblueprintoperations@gmail.com')}
            >
              uniblueprintoperations@gmail.com
            </Text>
          </Text>
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
  heroTitle: { fontFamily: fonts.serif, fontSize: 34, color: colors.cream, marginTop: 4 },

  body: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  faqCard: { padding: 16 },
  faqCardOpen: { borderWidth: 1.5, borderColor: colors.navy },
  faqTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  faqQ: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.navy, flex: 1, lineHeight: 20 },
  faqA: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 20, marginTop: 12 },
  faqLink: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy, marginTop: 10, textDecorationLine: 'underline' },

  contactCard: {
    backgroundColor: colors.navy, padding: 18, marginTop: spacing.xl,
  },
  contactTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.cream },
  contactSub: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.7)', marginTop: 6, lineHeight: 21 },
  contactEmail: { fontFamily: fonts.sansSemiBold, color: colors.cream, textDecorationLine: 'underline' },
})
