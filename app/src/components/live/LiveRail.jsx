import { useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Plus } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { PILLARS } from '../../constants/pillars'
import { useBlockedIds } from '../../lib/reporting'
import { useLiveRail, timeLeftLabel } from '../../lib/live'

// A row of Live moments on Campus Connect and Course Connect.
//
//   <LiveRail audience="campus" navigation={navigation} />
//   <LiveRail audience="course" navigation={navigation} />
//
// The first circle is always "Your Live" (a plus, opens the camera). Then one
// circle per Live that is on right now, newest first, read from the database:
// nothing is invented, so with no Live moments the row is just that first
// circle and a quiet line. A coloured ring means not seen yet (the rail's own
// colour: Campus Connect or Course Connect), a grey ring means seen on this
// phone. Tap one to watch it and react with a mood.

const SIZE = 62

function firstName(name) {
  return (String(name || 'Member').trim().split(/\s+/)[0] || 'Member').slice(0, 12)
}

function initialsOf(name) {
  const parts = String(name || '?').trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

export default function LiveRail({ audience = 'course', navigation, style }) {
  const { colors, isDark } = useTheme()
  const { user } = useAuth()
  const blocked = useBlockedIds(user?.id)
  const { posts, seen, reload } = useLiveRail(audience, user?.id, blocked)
  const s = styles(colors)

  useFocusEffect(useCallback(() => { reload() }, [reload]))

  const pillar = PILLARS[audience === 'campus' ? 'campus' : 'course']
  const ring = isDark && audience === 'course' ? '#6FC3CB' : pillar.color
  const grey = colors.border

  function openCamera() { navigation.navigate('LiveCapture') }
  function open(post) { navigation.navigate('LiveViewer', { postId: post.id }) }

  const mine = posts.find(p => p.user_id === user?.id)
  const others = posts.filter(p => p.user_id !== user?.id)

  return (
    <View style={[s.wrap, style]}>
      <View style={s.head}>
        <Text style={s.title}>Live now</Text>
        <Text style={s.sub}>{audience === 'campus' ? 'From your campus community' : 'From across Ireland'}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        <TouchableOpacity
          style={s.item}
          activeOpacity={0.8}
          onPress={mine ? () => open(mine) : openCamera}
          accessibilityRole="button"
          accessibilityLabel={mine ? 'Your Live, watch it' : 'Post your Live'}
        >
          <View style={[s.circle, { borderColor: mine ? ring : colors.textPrimary, backgroundColor: colors.surface }]}>
            {mine
              ? <Text style={[s.initials, { color: colors.textPrimary }]}>{initialsOf(mine.author_name)}</Text>
              : <Plus size={24} color={colors.textPrimary} strokeWidth={1.8} />}
          </View>
          <Text style={s.label} numberOfLines={1}>Your Live</Text>
          {mine && <Text style={s.small} numberOfLines={1}>{timeLeftLabel(mine)}</Text>}
        </TouchableOpacity>

        {others.map(p => {
          const isSeen = seen.has(p.id)
          return (
            <TouchableOpacity
              key={p.id}
              style={s.item}
              activeOpacity={0.8}
              onPress={() => open(p)}
              accessibilityRole="button"
              accessibilityLabel={`Watch ${p.author_name || 'a member'}'s Live`}
            >
              <View style={[s.circle, { borderColor: isSeen ? grey : ring, backgroundColor: colors.surface }]}>
                <Text style={[s.initials, { color: isSeen ? colors.textSecondary : colors.textPrimary }]}>
                  {initialsOf(p.author_name)}
                </Text>
              </View>
              <Text style={s.label} numberOfLines={1}>{firstName(p.author_name)}</Text>
              <Text style={s.small} numberOfLines={1}>{timeLeftLabel(p)}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
      {others.length === 0 && (
        <Text style={s.empty}>
          {audience === 'campus'
            ? 'No one on your campus has posted a Live right now. Be the first.'
            : 'No Live moments right now. Be the first.'}
        </Text>
      )}
    </View>
  )
}

function styles(colors) {
  return StyleSheet.create({
    wrap: { paddingTop: 22, paddingBottom: 6 },
    head: { paddingHorizontal: 16, marginBottom: 14 },
    title: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary },
    sub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
    row: { paddingHorizontal: 16, gap: 14 },
    item: { width: 72, alignItems: 'center' },
    circle: {
      width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 2.5,
      alignItems: 'center', justifyContent: 'center',
    },
    initials: { fontFamily: fonts.sansBold, fontSize: 17 },
    label: { fontFamily: fonts.sansMedium, fontSize: 11.5, color: colors.textPrimary, marginTop: 8, textAlign: 'center' },
    small: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
    empty: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary, paddingHorizontal: 16, marginTop: 12 },
  })
}
