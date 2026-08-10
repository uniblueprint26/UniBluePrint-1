import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Mail, MessageCircle, FileText, Shield, ChevronRight, ChevronLeft } from 'lucide-react-native'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius } from '../constants/theme'

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
      { label: 'How to find and book a coach',         detail: 'Go to the Blueprint tab and select Elevation. Browse coaches by category or use the filter pills to narrow by specialism.' },
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
      { label: 'Deleting your account',             detail: 'To permanently delete your account, email uniblueprintoperations@gmail.com from your registered address with the subject "Account Deletion Request".' },
      { label: 'How your data is stored and used',  detail: 'We use Supabase for secure storage and authentication. We never sell or share your data with third parties. See our Privacy Policy for full details.' },
    ],
  },
]

export default function HelpScreen({ navigation }) {
  const insets = useSafeAreaInsets()

  function openTopic(item) {
    Alert.alert(item.label, item.detail, [{ text: 'Got it', style: 'default' }])
  }

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
        <Text style={styles.heroEyebrow}>SUPPORT</Text>
        <Text style={styles.heroTitle}>Help and Support</Text>
        <Text style={styles.heroSub}>
          Everything you need to get the most out of UniBlueprint.
        </Text>
      </View>

      <View style={styles.body}>

        {/* Contact card */}
        <Card style={styles.contactCard}>
          <Mail size={20} color={colors.navy} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Email us directly</Text>
            <Text style={styles.contactSub}>We aim to respond within 24 hours on business days.</Text>
          </View>
          <TouchableOpacity
            style={styles.contactBtn}
            activeOpacity={0.8}
            onPress={() => Linking.openURL('mailto:uniblueprintoperations@gmail.com')}
          >
            <Text style={styles.contactBtnText}>Email</Text>
          </TouchableOpacity>
        </Card>

        {/* Help topics */}
        {TOPICS.map(({ icon: Icon, title, items }) => (
          <View key={title} style={styles.topicSection}>
            <View style={styles.topicHeader}>
              <View style={styles.topicIcon}>
                <Icon size={18} color={colors.navy} />
              </View>
              <Text style={styles.topicTitle}>{title}</Text>
            </View>
            <Card style={styles.topicCard}>
              {items.map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.topicRow, i < items.length - 1 && styles.topicRowBorder]}
                  activeOpacity={0.7}
                  onPress={() => openTopic(item)}
                >
                  <Text style={styles.topicItem}>{item.label}</Text>
                  <ChevronRight size={14} color={colors.light} />
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        <Card style={styles.footerCard}>
          <Text style={styles.footerTitle}>Didn't find what you're looking for?</Text>
          <Text style={styles.footerSub}>
            Email us at{' '}
            <Text
              style={styles.footerLink}
              onPress={() => Linking.openURL('mailto:uniblueprintoperations@gmail.com')}
            >
              uniblueprintoperations@gmail.com
            </Text>{' '}
            and we'll get back to you as quickly as possible.
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
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream, marginLeft: 4 },
  heroEyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: 'rgba(245,240,232,0.55)', letterSpacing: 1.2 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 34, color: colors.cream, marginTop: 4 },
  heroSub: { fontFamily: fonts.sans, fontSize: 14, color: 'rgba(245,240,232,0.72)', marginTop: 8, lineHeight: 22 },

  body: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
  },
  contactTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  contactSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  contactBtn: {
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  contactBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },

  topicSection: { marginTop: spacing.xl },
  topicHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.sm },
  topicIcon: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  topicTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.navy },

  topicCard: { padding: 0 },
  topicRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  topicRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  topicItem: { fontFamily: fonts.sans, fontSize: 14, color: colors.navy, flex: 1, marginRight: 8 },

  footerCard: {
    backgroundColor: colors.navy, padding: 20, marginTop: spacing.xl,
  },
  footerTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.cream },
  footerSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.75)', marginTop: 8, lineHeight: 21 },
  footerLink: { fontFamily: fonts.sansSemiBold, color: colors.cream },
})
