import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import {
  Briefcase, Heart, Eye, UserX, Bell, Sun, Lock, Download, Trash2, Compass,
  HelpCircle, LifeBuoy, Info, Users, LogOut,
} from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import { Row, RowGroup, SectionLabel } from '../components/profile/Rows'
import {
  AccountTypeModal, AppearanceModal, DirectoryProfileModal,
} from '../components/profile/ProfileModals'
import InterestsModal from '../components/profile/InterestsModal'
import NotificationPrefsSheet from '../components/notifications/NotificationPrefsSheet'
import { fonts } from '../constants/theme'
import { LEGAL_ENTITY_LINE } from '../constants/legal'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useUserType } from '../hooks/useUserType'
import { useInterests } from '../hooks/useInterests'
import { useDirectoryProfile } from '../hooks/useDirectoryProfile'
import { useNotificationPrefs } from '../lib/notificationPrefs'
import { useBlockedIds } from '../lib/reporting'

const appVersion = Constants.expoConfig?.version || '1.0.0'

// Round three pick A, with everything a store reviewer and a member expect:
// notification choices, privacy, blocked members, data export, account
// deletion, about and the version.
export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { colors, preference, mode } = useTheme()
  const { user, signOut } = useAuth()
  const { label: userTypeLabel } = useUserType()
  const { interests } = useInterests()
  const { discoverable } = useDirectoryProfile()
  const { prefs, save, failed } = useNotificationPrefs(user?.id)
  const blocked = useBlockedIds(user?.id)
  const [accountType, setAccountType] = useState(false)
  const [interestsOpen, setInterestsOpen] = useState(false)
  const [directory, setDirectory] = useState(false)
  const [appearance, setAppearance] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const appearanceValue = preference === 'system' ? 'System' : preference === 'dark' ? 'Dark' : 'Light'
  const notifValue = prefs.pillar_alerts || prefs.interest_alerts || prefs.trending_alerts || prefs.following_alerts || prefs.budget_nudges ? 'On' : 'Off'

  function confirmSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out', style: 'destructive',
        onPress: async () => {
          setSigningOut(true)
          try { await signOut() } catch { Alert.alert('Could not sign out', 'Please try again.') } finally { setSigningOut(false) }
        },
      },
    ])
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <PageTitle title="Settings" />

        <SectionLabel>Account</SectionLabel>
        <RowGroup>
          <Row Icon={Briefcase} label="Account type" value={userTypeLabel} onPress={() => setAccountType(true)} />
          <Row Icon={Heart} label="Interests" value={interests.length ? `${interests.length} chosen` : 'Not set'} onPress={() => setInterestsOpen(true)} />
          <Row Icon={Eye} label="Directory profile" value={discoverable ? 'Visible' : 'Hidden'} onPress={() => setDirectory(true)} />
          <Row Icon={UserX} label="Blocked members" value={blocked.size ? String(blocked.size) : 'None'} onPress={() => navigation.navigate('BlockedMembers')} last />
        </RowGroup>

        <SectionLabel>App</SectionLabel>
        <RowGroup>
          <Row Icon={Bell} label="Notifications" value={notifValue} onPress={() => setNotifOpen(true)} />
          <Row Icon={Sun} label="Appearance" value={appearanceValue} onPress={() => setAppearance(true)} last />
        </RowGroup>

        <SectionLabel>Privacy and data</SectionLabel>
        <RowGroup>
          <Row Icon={Lock} label="Privacy and data" sub="Your rights and what we keep" onPress={() => navigation.navigate('PrivacyData')} />
          <Row Icon={Download} label="Download my data" sub="Get a copy of everything we hold" onPress={() => navigation.navigate('PrivacyData')} />
          <Row Icon={Trash2} label="Delete account" sub="Permanent. Takes effect straight away" danger onPress={() => navigation.navigate('PrivacyData')} last />
        </RowGroup>

        <SectionLabel>Support</SectionLabel>
        <RowGroup>
          <Row Icon={Compass} label="How UniBlueprint works" onPress={() => navigation.navigate('BlueprintTour')} />
          <Row Icon={HelpCircle} label="FAQs" onPress={() => navigation.navigate('FAQs')} />
          <Row Icon={LifeBuoy} label="Help and support" onPress={() => navigation.navigate('Help')} />
          <Row Icon={Users} label="For parents" sub="What UniBlueprint is, for a parent or guardian" onPress={() => navigation.navigate('ParentInfo')} />
          <Row Icon={Info} label="About UniBlueprint" onPress={() => navigation.navigate('About')} last />
        </RowGroup>

        <TouchableOpacity
          style={[styles.signOut, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.8}
          onPress={confirmSignOut}
          disabled={signingOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <LogOut size={19} color={colors.textPrimary} strokeWidth={1.9} />
          <Text style={[styles.signOutText, { color: colors.textPrimary }]}>{signingOut ? 'Signing out' : 'Sign out'}</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textTertiary }]}>UniBlueprint, version {appVersion}</Text>
        <Text style={[styles.legal, { color: colors.textTertiary }]}>{LEGAL_ENTITY_LINE}</Text>
      </ScrollView>

      <AccountTypeModal visible={accountType} onClose={() => setAccountType(false)} />
      <InterestsModal visible={interestsOpen} onClose={() => setInterestsOpen(false)} />
      <DirectoryProfileModal visible={directory} onClose={() => setDirectory(false)} />
      <AppearanceModal visible={appearance} onClose={() => setAppearance(false)} />
      <NotificationPrefsSheet
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
        userId={user?.id}
        prefs={prefs}
        save={save}
        failed={failed}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 16, marginTop: 26, height: 56, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
  signOutText: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  version: { fontFamily: fonts.sans, fontSize: 13, textAlign: 'center', marginTop: 22 },
  legal: { fontFamily: fonts.sans, fontSize: 12, textAlign: 'center', marginTop: 6, marginHorizontal: 24, lineHeight: 17 },
})
