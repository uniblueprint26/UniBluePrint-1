import { View, Text, StyleSheet } from 'react-native'
import { Sparkles } from 'lucide-react-native'
import { colors, fonts, radius } from '../../constants/theme'

export default function MockContentBanner({ title = 'Coming Soon', subtitle }) {
  return (
    <View style={styles.banner}>
      <Sparkles size={15} color={colors.navy} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(30,58,95,0.1)',
    marginVertical: 8,
  },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  subtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 17 },
})
