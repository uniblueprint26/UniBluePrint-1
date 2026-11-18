/**
 * Shared look for the Ad Board: the accent, and the colour of each listing
 * type's icon tile. Everything flips with the theme through useTheme().
 *
 * There is no gold on the Ad Board (founder decision). The accent is the
 * normal app navy in light mode and the app cream in dark mode, which is the
 * theme's own accentBg / textPrimary pair. Deals use the Lifestyle colour.
 */
import {
  Heart, Briefcase, GraduationCap, FileText, ShoppingBag, Megaphone, Sparkles, Newspaper, Package,
} from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

const NAVY = '#1E3A5F'

const VISUALS = {
  deal:  { Icon: Heart,         color: '#D9596B' },   // Lifestyle
  ad:    { Icon: Megaphone,     color: NAVY },
  sale:  { Icon: ShoppingBag,   color: '#B0674A' },
  skill: { Icon: Sparkles,      color: '#6B4FA3' },
  job:   { Icon: Briefcase,     color: '#4A6FA5' },
  tutor: { Icon: GraduationCap, color: '#6B4FA3' },
  cv:    { Icon: FileText,      color: '#3C6EA8' },
  weekly:{ Icon: Newspaper,     color: '#3C6EA8' },
  ubp:   { Icon: Package,       color: NAVY },
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function mix(hex, target, amt) {
  const a = hexToRgb(hex)
  const b = hexToRgb(target)
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * amt))
  return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`
}

export function useAdTokens() {
  const { colors, isDark } = useTheme()

  // Icon + tile colours for a tinted tile of the given base colour.
  const tint = base => ({
    bg: `${base}${isDark ? '55' : '1F'}`,
    fg: isDark ? mix(base, '#FFFFFF', 0.4) : base,
  })

  return {
    colors,
    isDark,
    accent: colors.accentBg,
    accentInk: colors.accentFg,
    accentText: colors.textPrimary,
    accentTint: colors.tabFill,
    reviewed: isDark ? colors.success : '#147A3A',
    cardBorder: isDark ? { borderWidth: 1, borderColor: colors.border } : null,
    tint,
    // Solid folder colours for a basket tile of the given visual type: a very
    // light wash of the type colour over the card surface, with a matching edge.
    folder(key) {
      const v = VISUALS[key] || VISUALS.deal
      return {
        Icon: v.Icon,
        fill: mix(v.color, colors.surface, isDark ? 0.8 : 0.9),
        edge: mix(v.color, colors.surface, isDark ? 0.62 : 0.72),
        fg: isDark ? mix(v.color, '#FFFFFF', 0.45) : v.color,
        chip: mix(v.color, colors.surface, isDark ? 0.55 : 0.8),
      }
    },
    // Tile for a listing's visual type.
    visual(key) {
      const v = VISUALS[key] || VISUALS.deal
      // `text` is the type colour for small labels: darkened in light mode.
      return { Icon: v.Icon, ...tint(v.color), text: isDark ? mix(v.color, '#FFFFFF', 0.45) : mix(v.color, '#000000', 0.3) }
    },
  }
}
