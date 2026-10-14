import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Mail, MessageCircle, FileText, Shield, ChevronRight } from 'lucide-react-native'
import Card from '../components/ui/Card'
import ScreenHeader from '../components/ui/ScreenHeader'
import { fonts, spacing, radius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useSafeGoBack } from '../hooks/useSafeGoBack'

const TOPICS = [
  {
    icon: FileText,
    title: 'Foundation Blueprint',
    items: [
      { label: 'How to submit a document request',              detail: 'Open Foundation Blueprint from the Home screen or sidebar. Choose your service, tap "Order", and follow the submission steps.' },
      { label: 'What information to include in your submission', detail: 'Include your current CV or relevant experience, the role or industry you are targeting, and any specific instructions for your Campus Handler.' },
      { label: 'Standard vs Premium, what\'s the difference',  detail: 'Standard delivers your document within 48 hours. Premium is same-day and includes unlimited revisions until you are satisfied.' },
      { label: 'Turnaround times and delivery',                 detail: 'Standard: 48 hours. Premium: same day. You will receive a notification and message when your document is ready.' },
      { label: 'Requesting revisions on a delivered document',  detail: 'Premium orders include revisions. Contact your Campus Handler directly through Messages to request changes to a delivered document.' },
    ],
  },
  {
    icon: MessageCircle,
    title: 'Elevation Blueprint (Coaches)',
    items: [
      { label: 'How to find and book a coach',         detail: 'Open the menu and select Elevation Blueprint. Browse coaches by category or use the filter pills to narrow by specialism.' },
      { label: 'What happens after I book',            detail: 'Your coach will confirm the session via Messages. Check your Messages tab for confirmation details and any pre-session instructions.' },
      { label: 'Rescheduling or cancelling a session', detail: 'Contact your coach directly through Messages to reschedule or cancel. Cancellation policies vary by coach and are listed on their profile.' },
      { label: 'How coach pricing works',              detail: 'Each coach sets their own rates. Pricing is shown on the coach card. Some coaches offer free initial consultations.' },
    ],
  },
  {
    icon: Shield,
    title: 'Account and Privacy',
    items: [
      { label: 'Updating your profile information', detail: 'Go to the Profile tab and tap "Edit Profile" to update your display name and profile photo. Institution and course details set during sign-up cannot be changed here yet.' },
      { label: 'Changing your password',            detail: 'From the sign-in screen, tap "Forgot Password" and follow the steps. An email link will be sent to your registered address.' },
      { label: 'Deleting your account',             detail: 'Go to Profile, then "Privacy and Data", then "Delete your account". This deletes your account and all associated data immediately and cannot be undone.' },
      { label: 'How your data is stored and used',  detail: 'Your data is stored securely, and we never sell or share it with third parties. See our Privacy Policy for full details.' },
    ],
  },
]

export default function HelpScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = getStyles(colors)
  const insets = useSafeAreaInsets()
  const safeGoBack = useSafeGoBack(navigation)
  // Inline accordion, same expand-to-read-more pattern as FAQsScreen, rather
  // than a system Alert.alert popup — keyed by "section-index" since item
  // labels aren't unique across topic sections.
  const [openKey, setOpenKey] = useState(null)

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        variant="navy"
        onBack={safeGoBack}
        eyebrow="SUPPORT"
        title="Help and Support"
        subtitle="Everything you need to get the most out of UniBlueprint."
        style={styles.hero}
        titleStyle={styles.heroTitle}
      />

      <View style={styles.body}>

        {/* Contact card */}
        <Card style={styles.contactCard}>
          <Mail size={20} color={colors.textPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Email us directly</Text>
            <Text style={styles.contactSub}>We aim to respond within 24 hours on business days.</Text>
          </View>
          <TouchableOpacity
            style={styles.contactBtn}
            activeOpacity={0.8}
            onPress={() => Linking.openURL('mailto:support@uniblueprint.ie')}
          >
            <Text style={styles.contactBtnText}>Email</Text>
          </TouchableOpacity>
        </Card>

        {/* Help topics */}
        {TOPICS.map(({ icon: Icon, title, items }) => (
          <View key={title} style={styles.topicSection}>
            <View style={styles.topicHeader}>
              <View style={styles.topicIcon}>
                <Icon size={18} color={colors.textPrimary} />
              </View>
              <Text style={styles.topicTitle}>{title}</Text>
            </View>
            <Card style={styles.topicCard}>
              {items.map((item, i) => {
                const key = `${title}-${i}`
                const isOpen = openKey === key
                return (
                  <View key={key} style={[styles.topicRow, i < items.length - 1 && styles.topicRowBorder]}>
                    <TouchableOpacity
                      style={styles.topicRowTop}
                      activeOpacity={0.7}
                      onPress={() => setOpenKey(isOpen ? null : key)}
                    >
                      <Text style={styles.topicItem}>{item.label}</Text>
                      <ChevronRight
                        size={14}
                        color={colors.light}
                        style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }], flexShrink: 0 }}
                      />
                    </TouchableOpacity>
                    {isOpen && <Text style={styles.topicDetail}>{item.detail}</Text>}
                  </View>
                )
              })}
            </Card>
          </View>
        ))}

        <Card style={styles.footerCard}>
          <Text style={styles.footerTitle}>Didn't find what you're looking for?</Text>
          <Text style={styles.footerSub}>
            Email us at{' '}
            <Text
              style={styles.footerLink}
              onPress={() => Linking.openURL('mailto:support@uniblueprint.ie')}
            >
              support@uniblueprint.ie
            </Text>{' '}
            and we'll get back to you as quickly as possible.
          </Text>
        </Card>

      </View>
    </ScrollView>
  )
}

function getStyles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: {},

  hero: {
    backgroundColor: colors.chromeBg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  heroTitle: { fontFamily: fonts.serif, fontSize: 34, color: colors.chromeFg, marginTop: 4 },

  body: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
  },
  contactTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
  contactSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  contactBtn: {
    backgroundColor: colors.accentBg, borderRadius: radius.button,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  contactBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accentFg },

  topicSection: { marginTop: spacing.xl },
  topicHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.sm },
  topicIcon: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  topicTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.textPrimary },

  topicCard: { padding: 0 },
  topicRow: { paddingHorizontal: 16, paddingVertical: 14 },
  topicRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  topicRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  topicItem: { fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary, flex: 1, marginRight: 8 },
  topicDetail: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 19, marginTop: 10 },

  footerCard: {
    backgroundColor: colors.accentBg, padding: 20, marginTop: spacing.xl,
  },
  footerTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.accentFg },
  footerSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.75)', marginTop: 8, lineHeight: 21 },
  footerLink: { fontFamily: fonts.sansSemiBold, color: colors.accentFg },
  })
}
