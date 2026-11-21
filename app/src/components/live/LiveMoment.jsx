import { View, Image, StyleSheet } from 'react-native'
import { Camera } from 'lucide-react-native'
import { radius } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// One Live picture: the back camera shot fills the frame and the front camera
// shot sits in the top left corner with a white edge. With no front shot (a
// phone that could not take one) only the back shot shows. `backUrl` and
// `frontUrl` are plain image links (a signed link, or a local file on the
// compose screen). While a link is still loading, a calm placeholder shows.
export default function LiveMoment({ backUrl, frontUrl, style, insetScale = 0.28, rounded = true }) {
  const { colors } = useTheme()
  return (
    <View style={[s.frame, { backgroundColor: colors.border }, rounded && { borderRadius: radius.card }, style]}>
      {backUrl ? (
        <Image source={{ uri: backUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <View style={s.placeholder}>
          <Camera size={26} color={colors.textTertiary} strokeWidth={1.6} />
        </View>
      )}
      {!!frontUrl && (
        <View style={[s.inset, { width: `${insetScale * 100}%`, aspectRatio: 3 / 4 }]}>
          <Image source={{ uri: frontUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  frame: { overflow: 'hidden' },
  placeholder: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  inset: {
    position: 'absolute', top: 12, left: 12,
    borderRadius: 12, borderWidth: 2, borderColor: '#fff', overflow: 'hidden',
    backgroundColor: '#222',
  },
})
