import { useState } from 'react'
import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { NameWithTick } from '../ui/VerifiedTick'
import { withAlpha } from '../../data/partnerCards'

// One directory style profile for partners AND coaches, modelled on the student
// profile and the Directory: a banner, a big round avatar that overlaps it
// (about 78 px), the name with the verified tick in the display font, a handle or
// category line, chips, a bio, links, blocks and a photo gallery grid.
// Every block is data driven. Pass only what exists and only that is shown.

export const BANNER_H = 112
export const AVATAR = 78

export function ProfileButton({ label, onPress, variant = 'primary', Icon, accessibilityLabel, style }) {
  const { colors } = useTheme()
  const primary = variant === 'primary'
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      style={({ pressed }) => [
        styles.btn,
        primary ? { backgroundColor: colors.accentBg } : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {Icon ? <Icon size={17} color={primary ? colors.accentFg : colors.textPrimary} strokeWidth={1.9} /> : null}
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: primary ? colors.accentFg : colors.textPrimary }} numberOfLines={1}>{label}</Text>
    </Pressable>
  )
}

export function Chip({ label, accent, strong }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.chip, { borderColor: withAlpha(accent || colors.textPrimary, strong ? 0.55 : 0.28), backgroundColor: strong ? withAlpha(accent || colors.textPrimary, 0.12) : 'transparent' }]}>
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textPrimary }} numberOfLines={1}>{label}</Text>
    </View>
  )
}

export function ProfileSection({ title, children, style }) {
  const { colors } = useTheme()
  return (
    <View style={[{ marginTop: 22, paddingHorizontal: 16 }, style]}>
      {!!title && <Text style={[styles.sectionTitle, { color: colors.textPrimary }]} accessibilityRole="header">{title}</Text>}
      {children}
    </View>
  )
}

function Gallery({ photos, label }) {
  const { colors } = useTheme()
  const [w, setW] = useState(0)
  const gap = 6
  const size = w > 0 ? Math.floor((w - gap * 2) / 3) : 0
  return (
    <ProfileSection title={label}>
      <View onLayout={e => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {size > 0 && photos.map((p, i) => (
          <Image
            key={i}
            source={typeof p === 'string' ? { uri: p } : p}
            resizeMode="cover"
            accessibilityLabel={`Photo ${i + 1} of ${photos.length}`}
            style={{ width: size, height: size, borderRadius: 10, backgroundColor: colors.surfaceSunk }}
          />
        ))}
      </View>
    </ProfileSection>
  )
}

// banner:  { image?, color, fit? }   avatar: { image?, initials, bg, fg, fit?, tileBg? }
export default function BrandProfile({
  banner, avatar, name, verified = true, subtitle, chips, actions, tagline, bio, links, gallery, galleryLabel = 'Photos', children,
}) {
  const { colors } = useTheme()
  const bannerColor = banner?.color || colors.surfaceSunk
  return (
    <View>
      <View style={{ height: BANNER_H, backgroundColor: bannerColor, overflow: 'hidden' }}>
        {!!banner?.image && (
          <Image source={banner.image} resizeMode={banner.fit || 'cover'} style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors />
        )}
        {!!banner?.image && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.12)' }]} />}
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <View style={[styles.avatar, { borderColor: colors.background, backgroundColor: avatar?.tileBg || avatar?.bg || colors.surface }]}>
          {avatar?.image ? (
            <Image source={avatar.image} resizeMode={avatar.fit || 'cover'} style={{ width: AVATAR - 8, height: AVATAR - 8, borderRadius: (AVATAR - 8) / 2 }} accessibilityIgnoresInvertColors />
          ) : (
            <Text style={{ fontFamily: fonts.serif, fontSize: 26, color: avatar?.fg || '#FFFFFF' }}>{avatar?.initials || ''}</Text>
          )}
        </View>

        <View style={{ marginTop: 8 }}>
          <NameWithTick name={name} verified={verified} color={colors.textPrimary} tickSize={20} textStyle={{ fontFamily: fonts.serif, fontSize: 26, lineHeight: 31 }} />
          {!!subtitle && <Text style={{ fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 3 }}>{subtitle}</Text>}
        </View>

        {chips && chips.length > 0 && <View style={styles.chips}>{chips}</View>}
        {!!actions && <View style={styles.actions}>{actions}</View>}
        {!!tagline && <Text style={{ fontFamily: fonts.serifItalic, fontSize: 18, lineHeight: 25, color: colors.textPrimary, marginTop: 16 }}>{tagline}</Text>}
        {!!bio && <Text style={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, color: colors.textPrimary, marginTop: tagline ? 10 : 16 }}>{bio}</Text>}
        {!!links && <View style={{ marginTop: 16 }}>{links}</View>}
      </View>

      {children}
      {gallery && gallery.length > 0 && <Gallery photos={gallery} label={galleryLabel} />}
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, borderWidth: 4, marginTop: -40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, paddingHorizontal: 18, borderRadius: 14, flexGrow: 1 },
  chip: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 21, marginBottom: 10 },
})
