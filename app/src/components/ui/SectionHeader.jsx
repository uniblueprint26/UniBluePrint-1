import { View, Text, StyleSheet } from 'react-native'
import { fonts, spacing } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

export default function SectionHeader({ eyebrow, title, style }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.wrap, style]}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>{eyebrow}</Text> : null}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  eyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 24,
  },
})
