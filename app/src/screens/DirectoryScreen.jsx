import { useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import DirectoryBrowser from '../components/directory/DirectoryBrowser'
import { useDirectoryData } from '../components/directory/useDirectoryData'
import { useFollows } from '../components/messages/useFollows'
import { avatarColorFor, initialsFor } from '../components/directory/helpers'
import { useTheme } from '../context/ThemeContext'

// The full Directory. It is no longer a tab: people now live in
// Messages > Discover, which embeds the same browse list. This route stays
// registered (hidden from the tab bar) so any existing link to it keeps
// working, and it shows exactly the same list, search and filters.
//
// Data comes from get_directory_profiles() via useDirectoryData(), the only
// path to another user's Directory data. It already enforces discoverable-
// only, never the caller, and no blocked pairs.

// Keyed by the STATUS_OPTIONS keys collected at sign-up (constants/directory.js).
// StudentProfileScreen imports this.
export const STATUS_STYLES = {
  open:   { color: '#166534', bg: 'rgba(22,101,52,0.08)',   border: 'rgba(22,101,52,0.14)' },
  study:  { color: '#1d4ed8', bg: 'rgba(29,78,216,0.07)',   border: 'rgba(29,78,216,0.14)' },
  mentor: { color: '#6d28d9', bg: 'rgba(109,40,217,0.07)', border: 'rgba(109,40,217,0.14)' },
}

// Re-exported: StudentProfileScreen imports these from here.
export { avatarColorFor, initialsFor }

export default function DirectoryScreen({ navigation, route }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const data = useDirectoryData()
  const follows = useFollows()

  // The whole candidate row is already in hand, so it is passed through
  // rather than re-fetched.
  function openProfile(student) {
    navigation.navigate('StudentProfile', { student })
  }

  // Messages > Discover opens a profile by routing through here (the profile
  // screen is registered in this stack). `openStudent` pushes the profile, and
  // when the person comes back from it with `from: 'messages'` we hop straight
  // back to Messages so Back lands where they started.
  const openStudent = route?.params?.openStudent
  const from = route?.params?.from
  useFocusEffect(useCallback(() => {
    if (openStudent) {
      navigation.setParams({ openStudent: undefined })
      navigation.navigate('StudentProfile', { student: openStudent })
    } else if (from === 'messages') {
      navigation.setParams({ from: undefined })
      navigation.getParent()?.navigate('Messages')
    }
  }, [navigation, openStudent, from]))

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} />
      <PageTitle title="Directory" subtitle="Search by name, course or any interest" />
      <DirectoryBrowser data={data} follows={follows} onOpenProfile={openProfile} bottomPad={insets.bottom + 32} heading={false} />
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
})
