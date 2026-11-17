/**
 * Shared look for the Ad Board: the accent, and the colour of each listing
 * type's icon tile. Everything flips with the theme through useTheme().
 *
 * The Ad Board accent (#C98A1D) is only 2.7:1 against the light page, so it
 * is used for large display text (the page title), and for fills carrying
 * dark ink. Small amber text uses `accentText`, which is darkened in light
 * mode and lightened in dark mode to stay readable.
 */
import {
  Tag, Briefcase, Car, Search, GraduationCap, FileText, ShoppingBag, Megaphone, Sparkles,
} from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { PILLARS } from '../../constants/pillars'

export const AD_ACCENT = '#C98A1D'
const AD_INK = '#2B1D05'

const VISUALS = {
  deal:  { Icon: Tag,           color: '#C98A1D' },
  ad:    { Icon: Megaphone,     color: '#C98A1D' },
  sale:  { Icon: ShoppingBag,   color: '#B0674A' },
  skill: { Icon: Sparkles,      color: '#6B4FA3' },
  job:   { Icon: Briefcase,     color: '#4A6FA5' },
  ride:  { Icon: Car,           color: '#A8703A' },
  lost:  { Icon: Search,        color: '#2F8F77' },
  tutor: { Icon: GraduationCap, color: '#6B4FA3' },
  notes: { Icon: FileText,      color: '#5F7482' },
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
    accent: AD_ACCENT,
    accentInk: AD_INK,
    accentText: isDark ? '#F0C060' : '#8A5A0B',
    accentTint: isDark ? 'rgba(240,192,96,0.16)' : 'rgba(201,138,29,0.14)',
    reviewed: isDark ? colors.success : '#147A3A',
    cardBorder: isDark ? { borderWidth: 1, borderColor: colors.border } : null,
    tint,
    // Tile for a listing's visual type.
    visual(key) {
      const v = VISUALS[key] || VISUALS.deal
      return { Icon: v.Icon, ...tint(v.color) }
    },
    // Tile + label colours for a Campus Connect / Course Connect label.
    pillar(originKey) {
      const p = PILLARS[originKey]
      if (!p) return null
      const t = tint(p.color)
      return {
        ...p,
        tileBg: t.bg,
        iconColor: t.fg,
        // Pillar colours are mid-tones; the text version is darkened (light)
        // or lightened (dark) so small labels still read.
        textColor: isDark ? mix(p.color, '#FFFFFF', 0.45) : mix(p.color, '#000000', 0.38),
      }
    },
  }
}
