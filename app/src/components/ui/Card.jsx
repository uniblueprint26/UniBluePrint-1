import { View, StyleSheet } from 'react-native'
import { colors, shadows, radius } from '../../constants/theme'

export default function Card({ children, style }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: 20,
    ...shadows.card,
  },
})
