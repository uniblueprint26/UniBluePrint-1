import { View, Text, StyleSheet } from 'react-native'
import { colors, fonts, spacing } from '../../constants/theme'

export default function SectionHeader({ eyebrow, title, style }) {
  return (
    <View style={[styles.wrap, style]}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  eyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.navy,
  },
})
