import { View, Text } from 'react-native'
import { fonts } from '../../constants/theme'

export default function UBPLogo({ height = 32, color = '#F5F0E8' }) {
  const fontSize = Math.round(height * 0.7)
  return (
    <View style={{ alignSelf: 'flex-start' }}>
      <Text style={{ fontFamily: fonts.serif, fontSize, color, includeFontPadding: false }}>
        UBP
      </Text>
      <View style={{ height: 2, backgroundColor: color, marginTop: 3 }} />
      <View style={{ height: 1.5, backgroundColor: color, marginTop: 3 }} />
    </View>
  )
}
