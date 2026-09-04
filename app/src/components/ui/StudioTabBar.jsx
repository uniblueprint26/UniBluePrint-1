import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ArrowLeftRight } from 'lucide-react-native'
import { colors, fonts } from '../../constants/theme'
import { useAuth } from '../../context/AuthContext'

// The four Handler-side Studio screens, in the order they appear here.
// `active` is the current screen's own name, so each screen just passes its
// own key and the row highlights itself correctly without extra state.
const TABS = [
  { key: 'StudioQueue',   label: 'Queue' },
  { key: 'PromptLibrary', label: 'Prompts' },
  { key: 'Availability',  label: 'Availability' },
  { key: 'Specialism',    label: 'Specialisms' },
]

/**
 * Sits under the header on every Handler Studio screen so a Handler can move
 * between Queue, Prompt Library, Availability, and Specialisms without going
 * back out to Home first. Uses navigation.replace() rather than navigate(),
 * so switching tabs swaps the current screen instead of stacking a new one
 * on top of it, matching how a tab bar should feel even though these are
 * plain stack screens, not a nested tab navigator.
 *
 * The "My Blueprint" exit is deliberately kept OUTSIDE the horizontal
 * ScrollView, not appended as a 5th scrolling item. On a standard phone
 * width the four tab labels alone fill nearly the full row, which pushed
 * an in-row exit link mostly or entirely off-screen, undiscoverable without
 * scrolling. The one way back out of the Studio can't be the thing that
 * requires scrolling to find.
 */
export default function StudioTabBar({ navigation, active }) {
  const { setPortalMode } = useAuth()

  function backToMyBlueprint() {
    setPortalMode('personal')
    navigation.navigate('HomeMain')
  }

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}
      >
        {TABS.map(tab => {
          const isActive = tab.key === active
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.pill, isActive && styles.pillActive]}
              activeOpacity={0.75}
              onPress={() => !isActive && navigation.replace(tab.key)}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      <TouchableOpacity style={styles.backLink} activeOpacity={0.75} onPress={backToMyBlueprint}>
        <ArrowLeftRight size={12} color="rgba(245,240,232,0.6)" strokeWidth={2} />
        <Text style={styles.backLinkText}>My Blueprint</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 14, marginHorizontal: -16, paddingHorizontal: 16, paddingBottom: 14,
  },
  scroll: { flex: 1 },
  row: { gap: 8, paddingRight: 8 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100,
    backgroundColor: 'rgba(245,240,232,0.1)',
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.16)',
  },
  pillActive: { backgroundColor: colors.cream, borderColor: colors.cream },
  pillText: { fontFamily: fonts.sansMedium, fontSize: 12, color: 'rgba(245,240,232,0.68)' },
  pillTextActive: { color: colors.navy, fontFamily: fonts.sansSemiBold },

  backLink: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: 'rgba(245,240,232,0.14)',
    flexShrink: 0,
  },
  backLinkText: { fontFamily: fonts.sansMedium, fontSize: 12, color: 'rgba(245,240,232,0.6)' },
})
