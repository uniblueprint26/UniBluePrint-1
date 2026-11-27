import { useMemo } from 'react'
import Svg, { Rect } from 'react-native-svg'
import qrcode from 'qrcode-generator'

// A QR code drawn with react-native-svg. No native module, works in Expo Go and on web.
// `value` is the member code text. Dark squares use `color`, the quiet zone is `background`.
export default function QrCode({ value, size = 72, color = '#111111', background = '#FFFFFF', quiet = 2 }) {
  const modules = useMemo(() => {
    try {
      const qr = qrcode(0, 'M')
      qr.addData(String(value || ''))
      qr.make()
      const n = qr.getModuleCount()
      const rows = []
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) if (qr.isDark(r, c)) rows.push([r, c])
      }
      return { n, dark: rows }
    } catch {
      return { n: 0, dark: [] }
    }
  }, [value])
  if (!modules.n) return null
  const total = modules.n + quiet * 2
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${total} ${total}`} accessibilityLabel="QR code of your member code">
      <Rect x={0} y={0} width={total} height={total} fill={background} />
      {modules.dark.map(([r, c]) => (
        <Rect key={`${r}-${c}`} x={c + quiet} y={r + quiet} width={1.02} height={1.02} fill={color} />
      ))}
    </Svg>
  )
}
