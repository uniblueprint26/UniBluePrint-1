import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, fonts, radius } from '../../constants/theme'

// Reusable "My Blueprint" / Studio segmented toggle.
// Shown in the top navigation bar for Handlers and Coaches, who each have
// two separate interfaces: their personal "My Blueprint" experience and
// their professional workspace, "The Blueprint Studio" (Handlers) or
// "The Elevation Studio" (Coaches). One tap switches between them.
//
// Props:
//   active      — 'personal' | 'studio'
//   onSwitch    — (next: 'personal' | 'studio') => void
//   studioLabel — the Studio-side segment label, e.g. "The Blueprint Studio"
//                 or "The Elevation Studio"

export default function PortalSwitcher({ active, onSwitch, studioLabel = 'The Studio' }) {
  return (
    <View style={styles.track}>
      <TouchableOpacity
        style={[styles.segment, active === 'personal' && styles.segmentActive]}
        activeOpacity={0.8}
        onPress={() => onSwitch?.('personal')}
      >
        <Text
          style={[styles.label, active === 'personal' && styles.labelActive]}
          numberOfLines={1}
        >
          My Blueprint
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.segment, active === 'studio' && styles.segmentActive]}
        activeOpacity={0.8}
        onPress={() => onSwitch?.('studio')}
      >
        <Text
          style={[styles.label, active === 'studio' && styles.labelActive]}
          numberOfLines={1}
        >
          {studioLabel}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.navy,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(245,240,232,0.14)',
  },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  segmentActive: {
    backgroundColor: colors.cream,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: 'rgba(245,240,232,0.7)',
    textAlign: 'center',
  },
  labelActive: {
    fontFamily: fonts.sansSemiBold,
    color: colors.navy,
  },
})
