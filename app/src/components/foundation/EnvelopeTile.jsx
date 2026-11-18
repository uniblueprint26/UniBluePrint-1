import { useRef } from 'react'
import { Animated, Pressable, View, Text, StyleSheet } from 'react-native'
import Svg, { Polygon } from 'react-native-svg'
import { fonts } from '../../constants/theme'
import { envelopePaper } from './envelopePaper'

// One sealed envelope in the Foundation grid. Closed, with the service icon
// on the seal at the flap's point and the service name on the paper below.
// `status` is only passed when the app really tracks one for this service
// ('in_progress' or 'delivered'); nothing is shown otherwise.
const HEIGHT = 158
const TILE_FLAP_DEPTH = 0.5

export const STATUS_TEXT = { in_progress: 'In progress', delivered: 'Delivered' }

export default function EnvelopeTile({ title, Icon, status, width, onPress, colors, isDark }) {
  const paper = envelopePaper(isDark)
  const press = useRef(new Animated.Value(0)).current
  const flapH = Math.round(HEIGHT * TILE_FLAP_DEPTH)

  const to = v => Animated.spring(press, { toValue: v, useNativeDriver: true, speed: 30, bounciness: 4 }).start()
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] })
  const lift = press.interpolate({ inputRange: [0, 1], outputRange: [0, -2] })

  const statusColor = status === 'delivered' ? (isDark ? '#7FD6A3' : '#2E8F5B') : colors.textSecondary

  return (
    <Animated.View style={{ width, transform: [{ translateY: lift }, { scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => to(1)}
        onPressOut={() => to(0)}
        accessibilityRole="button"
        accessibilityLabel={`${title}${status ? `, ${STATUS_TEXT[status]}` : ''}. Open envelope.`}
      >
        <View
          style={[
            s.body,
            { height: HEIGHT, backgroundColor: paper.body, borderColor: paper.edge, shadowColor: paper.shadow },
          ]}
        >
          <Svg width={width} height={flapH} style={s.flap}>
            <Polygon
              points={`0,0 ${width},0 ${width / 2},${flapH}`}
              fill={paper.flap}
              stroke={paper.edge}
              strokeWidth={1}
              strokeLinejoin="round"
            />
          </Svg>

          <View style={[s.seal, { backgroundColor: paper.sealBg, top: flapH - 15, left: width / 2 - 15 }]}>
            <Icon size={15} color={paper.sealFg} strokeWidth={1.9} />
          </View>

          <View style={s.textBlock}>
            <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={2}>{title}</Text>
            {status ? (
              <View style={s.statusRow}>
                <View style={[s.dot, { backgroundColor: statusColor }]} />
                <Text style={[s.statusText, { color: statusColor }]}>{STATUS_TEXT[status]}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  body: {
    borderRadius: 14, borderWidth: 1, overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 2,
  },
  flap: { position: 'absolute', top: 0, left: 0 },
  seal: {
    position: 'absolute', width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  textBlock: { position: 'absolute', left: 12, right: 12, top: 98, bottom: 8, justifyContent: 'center' },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, lineHeight: 17, textAlign: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: fonts.sansMedium, fontSize: 11 },
})
