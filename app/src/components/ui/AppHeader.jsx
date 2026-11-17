import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Search, CalendarDays, Bell, ChevronLeft } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { goToHome, openInHomeStack } from '../../navigation/helpers'
import { useSafeGoBack } from '../../hooks/useSafeGoBack'

// The one top bar for every main screen (founder decision 2026-11-17):
// "UniBlueprint" in the middle, Search on the left, Calendar and Notifications
// on the right. The screen's own name is NOT shown here: render it as a large
// serif title in the page with <PageTitle> so the wordmark never gets replaced.
//
// `showBack` swaps Search for a back chevron on pushed screens.
export default function AppHeader({
  navigation,
  unreadCount = 0,
  showBack = false,
  onSearch,
  onCalendar,
  onBell,
  style,
}) {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const safeGoBack = useSafeGoBack(navigation)

  const search = onSearch || (() => openInHomeStack(navigation, 'Explore'))
  const calendar = onCalendar || (() => openInHomeStack(navigation, 'Calendar'))
  const bell = onBell || (() => openInHomeStack(navigation, 'Notifications'))

  return (
    <View style={[s.bar, { paddingTop: insets.top + 6, backgroundColor: colors.surface, borderBottomColor: colors.border }, style]}>
      <View style={s.side}>
        {showBack ? (
          <IconBtn label="Go back" onPress={safeGoBack}><ChevronLeft size={24} color={colors.textPrimary} strokeWidth={1.8} /></IconBtn>
        ) : (
          <IconBtn label="Search" onPress={search}><Search size={22} color={colors.textPrimary} strokeWidth={1.8} /></IconBtn>
        )}
      </View>

      <TouchableOpacity
        style={s.center}
        activeOpacity={0.7}
        onPress={() => goToHome(navigation)}
        accessibilityRole="button"
        accessibilityLabel="UniBlueprint, go to Home"
      >
        <Text style={[s.wordmark, { color: colors.textPrimary }]} numberOfLines={1}>UniBlueprint</Text>
      </TouchableOpacity>

      <View style={[s.side, s.right]}>
        <IconBtn label="Calendar" onPress={calendar}><CalendarDays size={22} color={colors.textPrimary} strokeWidth={1.8} /></IconBtn>
        <IconBtn label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'} onPress={bell}>
          <Bell size={22} color={colors.textPrimary} strokeWidth={1.8} />
          {unreadCount > 0 && <View style={[s.dot, { borderColor: colors.surface }]} />}
        </IconBtn>
      </View>
    </View>
  )
}

function IconBtn({ children, onPress, label }) {
  return (
    <TouchableOpacity
      style={s.btn}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {children}
    </TouchableOpacity>
  )
}

// Large serif page title that sits under the header, e.g. "Ad Board".
export function PageTitle({ title, subtitle, color, right, style }) {
  const { colors } = useTheme()
  return (
    <View style={[s.titleRow, style]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.title, { color: color || colors.textPrimary }]} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={[s.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {right || null}
    </View>
  )
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: { width: 92, flexDirection: 'row', alignItems: 'center' },
  right: { justifyContent: 'flex-end' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  wordmark: { fontFamily: fonts.serif, fontSize: 22, letterSpacing: -0.2, includeFontPadding: false },
  btn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute', top: 10, right: 10, width: 9, height: 9, borderRadius: 5,
    backgroundColor: '#E5484D', borderWidth: 1.5,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  title: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 38, includeFontPadding: false },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, marginTop: 2 },
})
