import { useState } from 'react'
import { View, Text, Image, ScrollView } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/theme'

// One picture for a real partner. Uses the partner's own hero picture first,
// then their logo. A partner with neither gets a plain tile in their brand
// colour with their initials (never a stock photo).
export default function PartnerPicture({ partner, height = 120, style }) {
  const { colors } = useTheme()
  const src = partner.hero || partner.logo
  if (src) {
    const source = typeof src === 'string' ? { uri: src } : src
    return (
      <View style={[{ height, backgroundColor: colors.tabFill, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}>
        <Image source={source} style={{ width: '100%', height: '100%' }} resizeMode={partner.hero ? 'cover' : 'contain'} />
      </View>
    )
  }
  return (
    <View style={[{ height, backgroundColor: colors.tabFill, alignItems: 'center', justifyContent: 'center' }, style]}>
      <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: partner.initBg || colors.accentBg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.serif, fontSize: 22, color: '#FFFFFF' }}>{partner.initials}</Text>
      </View>
    </View>
  )
}

export function hasPicture(p) { return !!(p.hero || p.logo) }

// Swipeable pictures for a partner (hero first, then gallery). One picture shows
// without dots. No pictures: the plain tile.
export function PictureSwiper({ partner, height = 220, style }) {
  const { colors } = useTheme()
  const [w, setW] = useState(0)
  const [i, setI] = useState(0)
  const pics = [partner.hero, ...(partner.gallery || [])].filter(Boolean)
  if (pics.length === 0) return <PartnerPicture partner={partner} height={Math.round(height * 0.7)} style={style} />
  return (
    <View style={[{ height, backgroundColor: colors.tabFill, overflow: 'hidden' }, style]} onLayout={e => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <ScrollView
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => setI(Math.round(e.nativeEvent.contentOffset.x / w))}
          accessibilityLabel={`${partner.brand} pictures, swipe for more`}
        >
          {pics.map((src, n) => (
            <Image key={n} source={typeof src === 'string' ? { uri: src } : src} style={{ width: w, height }} resizeMode="cover" />
          ))}
        </ScrollView>
      )}
      {pics.length > 1 && (
        <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }} pointerEvents="none">
          {pics.map((_, n) => (
            <View key={n} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: n === i ? '#FFFFFF' : 'rgba(255,255,255,0.5)' }} />
          ))}
        </View>
      )}
    </View>
  )
}
