import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Bell, User } from 'lucide-react-native'
import { colors, fonts } from '../../constants/theme'
import UBPLogo from '../ui/UBPLogo'

export default function TopBar({ notificationCount = 0, onProfilePress, onBellPress }) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <UBPLogo height={30} color={colors.cream} />
      <View style={styles.right}>
        <TouchableOpacity
          onPress={onBellPress}
          style={styles.iconButton}
          activeOpacity={0.7}
          accessibilityLabel="Notifications"
        >
          <Bell size={20} color={colors.cream} />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onProfilePress}
          style={styles.avatarBtn}
          activeOpacity={0.7}
          accessibilityLabel="Profile"
        >
          <User size={17} color={colors.navy} />
        </TouchableOpacity>
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
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: {
    position: 'relative', width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#F59E0B', borderRadius: 9999,
    minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: colors.navy,
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 9, color: colors.white },
  avatarBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(245,240,232,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(245,240,232,0.25)',
  },
})
