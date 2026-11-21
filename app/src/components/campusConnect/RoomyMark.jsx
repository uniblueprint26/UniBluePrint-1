import { View, Text } from 'react-native'
import { fonts } from '../../constants/theme'

// Roomy.ie partner mark. The founder has permission to use Roomy's logo; the
// file has not been added to the repo yet, so this is a plain neutral tile
// until it is. To use the real logo, drop it in app/assets/partners/roomy/
// and swap this component for an Image.
export function RoomyMark({ size = 48 }) {
  return (
    <View
      accessibilityLabel="Roomy.ie"
      style={{ width: size, height: size, borderRadius: size * 0.28, backgroundColor: '#1E3A5F', alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ fontFamily: fonts.serif, color: '#FFFFFF', fontSize: size * 0.5, lineHeight: size * 0.62, includeFontPadding: false }}>R</Text>
    </View>
  )
}
