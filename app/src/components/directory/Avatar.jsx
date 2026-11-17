import { View, Text, Image } from 'react-native'
import { fonts } from '../../constants/theme'
import { avatarColorFor, initialsFor } from './helpers'

// Round avatar: the person's photo when they have one, otherwise initials on
// a colour that is stable for that person.
export default function Avatar({ person, size = 48, style }) {
  const name = person?.full_name || person?.name
  const radius = size / 2
  if (person?.avatar_url) {
    return (
      <Image
        source={{ uri: person.avatar_url }}
        style={[{ width: size, height: size, borderRadius: radius }, style]}
        accessibilityIgnoresInvertColors
      />
    )
  }
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: radius, backgroundColor: avatarColorFor(person?.id), alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <Text style={{ fontFamily: fonts.serif, fontSize: Math.round(size * 0.36), color: '#FFFFFF' }}>{initialsFor(name)}</Text>
    </View>
  )
}
