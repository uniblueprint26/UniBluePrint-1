import { Image, View } from 'react-native'
import { ROOMY } from '../../constants/partnerBrands'

// Roomy.ie partner logo (square, from app/assets/partners/roomy/logo.png).
export function RoomyMark({ size = 48 }) {
  return (
    <View
      accessibilityLabel="Roomy.ie logo"
      style={{ width: size, height: size, borderRadius: size * 0.22, overflow: 'hidden', backgroundColor: ROOMY.deep }}
    >
      <Image source={require('../../../assets/partners/roomy/logo.png')} style={{ width: size, height: size }} resizeMode="cover" />
    </View>
  )
}
