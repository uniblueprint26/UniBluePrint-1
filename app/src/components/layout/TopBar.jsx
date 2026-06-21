import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bell, UserCircle } from 'lucide-react-native'
import { colors, fonts } from '../../constants/theme'

export default function TopBar({ notificationCount = 0, onProfilePress, onBellPress }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Logo text */}
      <Text style={styles.logo}>UniBlueprint</Text>

      {/* Right icons */}
      <View style={styles.right}>
        <TouchableOpacity
          onPress={onBellPress}
          style={styles.iconButton}
          accessibilityLabel="Notifications"
        >
          <Bell size={22} color={colors.navy} />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onProfilePress}
          style={styles.iconButton}
          accessibilityLabel="Profile"
        >
          <UserCircle size={22} color={colors.navy} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30,58,95,0.06)',
  },
  logo: {
    fontFamily: fonts.serif,
    fontSize: 20,
    color: colors.navy,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.destructive,
    borderRadius: 9999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    color: colors.white,
  },
})
