import { View } from 'react-native'

// Course Connect's icon. Sized to sit alongside 22px lucide icons: `size` is the
// flag's height, width follows the 3:2 ratio.
export default function IrishFlag({ size = 16, style }) {
  const w = Math.round(size * 1.5)
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: w, height: size, flexDirection: 'row', borderRadius: 2, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.12)' }, style]}
    >
      <View style={{ flex: 1, backgroundColor: '#169B62' }} />
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
      <View style={{ flex: 1, backgroundColor: '#FF883E' }} />
    </View>
  )
}
