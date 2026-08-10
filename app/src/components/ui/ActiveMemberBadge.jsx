import { View, Text, StyleSheet } from 'react-native'
import { fonts, radius } from '../../constants/theme'

// Small pill badge shown on the My Blueprint side for active Handlers and
// Coaches, reminding them the platform gives them free Pro access for as
// long as they remain active.

export default function ActiveMemberBadge({ style }) {
  return (
    <View style={[styles.badge, style]}>
      <View style={styles.dot} />
      <Text style={styles.text}>Active Member, Pro Access</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803D',
  },
  text: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: '#15803D',
    letterSpacing: 0.2,
  },
})
