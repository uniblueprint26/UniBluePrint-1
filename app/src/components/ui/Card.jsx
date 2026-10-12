import { View } from 'react-native'
import { shadows, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

export default function Card({ children, style }) {
  const { colors, isDark } = useTheme()
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.card,
          padding: 20,
          // Dark mode leans on a hairline border for separation instead of a
          // shadow — a dark shadow barely reads against an already-dark
          // page, where light mode's soft navy shadow (shadows.card) works
          // fine against the cream background.
          ...(isDark ? { borderWidth: 1, borderColor: colors.border } : shadows.card),
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}
