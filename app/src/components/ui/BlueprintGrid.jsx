import { StyleSheet } from 'react-native'
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg'

// The app's one "Blueprint" visual motif — a subtle dot-grid, matching the
// exact pattern already used on the website/marketing side (see the "UBP
// Blueprint Tour" reference: radial-gradient(circle, rgba(30,58,95,0.05) 1px,
// transparent 1px) 0 0 / 26px 26px). The brand is named Blueprint three times
// over (Foundation/Elevation/Lifestyle) but nothing in the app referenced
// that visually before this — this is the one shared implementation, so a
// navy header and a cream completion screen both draw from the same pattern
// rather than each screen inventing its own texture.
//
// Pass a light rgba `color` for dots-on-navy (header blocks) or the default
// navy-on-cream rgba for light backgrounds (e.g. GenerationSubmittedScreen).
export default function BlueprintGrid({
  color = 'rgba(30,58,95,0.05)',
  spacing = 26,
  dotRadius = 1,
  style,
}) {
  return (
    <Svg style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Defs>
        <Pattern
          id="blueprintDots"
          width={spacing}
          height={spacing}
          patternUnits="userSpaceOnUse"
        >
          <Circle cx={spacing / 2} cy={spacing / 2} r={dotRadius} fill={color} />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#blueprintDots)" />
    </Svg>
  )
}
