import { View, Text, StyleSheet } from 'react-native'
import { Sparkles } from 'lucide-react-native'
import { fonts, radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

export default function MockContentBanner({ title = 'Coming Soon', subtitle }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
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
  // `banner`'s background is a fixed pale lavender in both modes (not
  // mode-aware) — title/subtitle/icon all need fixed dark colors, not
  // textPrimary/muted, which flip to near-white cream/warm-grey in dark
  // mode and become nearly unreadable against the still-pale background.
  title: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  subtitle: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(30,58,95,0.65)', marginTop: 2, lineHeight: 17 },
  })
}
