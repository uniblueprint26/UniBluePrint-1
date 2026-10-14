import { View, Text, StyleSheet } from 'react-native'
import { Sparkles } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

export default function MockContentBanner({ title = 'Coming Soon', subtitle }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  return (
    <View style={styles.banner}>
      <Sparkles size={15} color={colors.textPrimary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  )
}

function __gs_styles(colors) {
  return StyleSheet.create({
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
  title: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 17 },
  })
}
