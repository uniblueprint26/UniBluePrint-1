import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Mail, MessageCircle, FileText, Shield, ChevronRight, ChevronLeft } from 'lucide-react-native'
import { colors, fonts, spacing, radius } from '../constants/theme'

const TOPICS = [
  {
    icon: FileText,
    title: 'Foundation Blueprint',
    items: [
      'How to submit a document request',
      'What information to include in your submission',
      'Standard vs Premium — what\'s the difference',
      'Turnaround times and delivery',
      'Requesting revisions on a delivered document',
    ],
  },
  {
    icon: MessageCircle,
    title: 'Elevation Blueprint (Coaches)',
    items: [
      'How to find and book a coach',
      'What happens after I book',
      'Rescheduling or cancelling a session',
      'How coach pricing works',
    ],
  },
  {
    icon: Shield,
    title: 'Account & Privacy',
    items: [
      'Updating your profile information',
      'Changing your password',
      'Deleting your account',
      'How your data is stored and used',
    ],
  },
]

export default function HelpScreen({ navigation }) {
  const insets = useSafeAreaInsets()

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
        <Text style={styles.heroTitle}>Help & Support</Text>
        <Text style={styles.heroSub}>
          Everything you need to get the most out of UniBlueprint.
        </Text>
      </View>

      <View style={styles.body}>

        {/* Contact card */}
        <View style={styles.contactCard}>
          <Mail size={20} color={colors.navy} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Email us directly</Text>
            <Text style={styles.contactSub}>We aim to respond within 24 hours on business days.</Text>
          </View>
          <TouchableOpacity
            style={styles.contactBtn}
            activeOpacity={0.8}
            onPress={() => Linking.openURL('mailto:hello@uniblueprint.ie')}
          >
            <Text style={styles.contactBtnText}>Email</Text>
          </TouchableOpacity>
        </View>

        {/* Help topics */}
        {TOPICS.map(({ icon: Icon, title, items }) => (
          <View key={title} style={styles.topicSection}>
            <View style={styles.topicHeader}>
              <View style={styles.topicIcon}>
                <Icon size={18} color={colors.navy} />
              </View>
              <Text style={styles.topicTitle}>{title}</Text>
            </View>
            <View style={styles.topicCard}>
              {items.map((item, i) => (
                <View
                  key={i}
                  style={[styles.topicRow, i < items.length - 1 && styles.topicRowBorder]}
                >
                  <Text style={styles.topicItem}>{item}</Text>
                  <ChevronRight size={14} color={colors.light} />
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Didn't find what you're looking for?</Text>
          <Text style={styles.footerSub}>
            Email us at{' '}
            <Text
              style={styles.footerLink}
              onPress={() => Linking.openURL('mailto:hello@uniblueprint.ie')}
            >
              hello@uniblueprint.ie
            </Text>{' '}
            and we'll get back to you as quickly as possible.
          </Text>
        </View>

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
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#EFF6FF', borderRadius: radius.card,
    padding: 16, borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
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

  topicCard: {
    backgroundColor: colors.white, borderRadius: radius.card,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
  },
  topicRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  topicRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.06)' },
  topicItem: { fontFamily: fonts.sans, fontSize: 14, color: colors.navy, flex: 1, marginRight: 8 },

  footerCard: {
    backgroundColor: colors.navy, borderRadius: radius.card,
    padding: 20, marginTop: spacing.xl,
  },
  footerTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.cream },
  footerSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(245,240,232,0.75)', marginTop: 8, lineHeight: 21 },
  footerLink: { fontFamily: fonts.sansSemiBold, color: colors.cream },
})
