import { View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

// A thin ring that drains as the Live window closes. Children sit in the
// middle (the time left, usually).
export default function LiveCountdownRing({ size = 56, stroke = 5, secondsLeft, totalSeconds = 120, color, track, children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const frac = totalSeconds > 0 ? Math.max(0, Math.min(1, secondsLeft / totalSeconds)) : 0
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - frac)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  )
}
