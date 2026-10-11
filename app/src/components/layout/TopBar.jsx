import { View, Text, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bell, User, ChevronLeft } from 'lucide-react-native'
import { colors, fonts } from '../../constants/theme'
import UBPLogo from '../ui/UBPLogo'
import { HeaderIconButton } from '../ui/ScreenHeader'
import { goToHome } from '../../navigation/helpers'

// Shared utility header used by screens pushed from Home (Lifestyle,
// Budgeting). `showBack` renders the same back chevron used everywhere
// else in the app (size 20, cream, top-left) and pops the screen —
// pass `navigation` alongside it so it has something to call goBack() on.
export default function TopBar({ navigation, showBack = false, notificationCount = 0, onProfilePress, onBellPress }) {
  const insets = useSafeAreaInsets()

  // Both icons used to render with no handler at all when the caller (e.g.
  // BudgetingScreen) passed neither prop — dead taps. Default to sensible
  // in-app destinations instead: Notifications is a sibling screen in the
  // same stack TopBar is used from, Profile is a different bottom tab.
  const handleBellPress = onBellPress || (() => navigation?.navigate('Notifications'))
  const handleProfilePress = onProfilePress || (() => navigation?.getParent()?.navigate('Profile'))

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.left}>
        {showBack && (
          <HeaderIconButton
            icon={ChevronLeft}
            onPress={() => navigation?.goBack()}
            color={colors.cream}
            size={20}
            style={styles.backBtn}
            accessibilityLabel="Go back"
          />
        )}
        <UBPLogo height={33} color={colors.cream} onPress={() => goToHome(navigation)} />
      </View>
      <View style={styles.right}>
        <View style={styles.bellWrap}>
          <HeaderIconButton
            icon={Bell}
            onPress={handleBellPress}
            color={colors.cream}
            size={20}
            accessibilityLabel="Notifications"
          />
          {notificationCount > 0 && (
            <View style={styles.badge} pointerEvents="none">
              <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
            </View>
          )}
        </View>
        <HeaderIconButton
          icon={User}
          onPress={handleProfilePress}
          color={colors.navy}
          size={17}
          style={styles.avatarBtn}
          accessibilityLabel="Profile"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  // HeaderIconButton is a real 44×44pt target; pull it back in by the same
  // amount ScreenHeader's own back button does so it doesn't visually eat
  // into the header's padding.
  backBtn: { marginLeft: -12 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bellWrap: { position: 'relative' },
  badge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: '#F59E0B', borderRadius: 9999,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: colors.navy,
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 9, color: colors.white },
  avatarBtn: {
    borderRadius: 22,
    backgroundColor: 'rgba(245,240,232,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(245,240,232,0.25)',
  },
})
