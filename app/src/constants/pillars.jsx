import { FileText, TrendingUp, Heart, Building2, Compass } from 'lucide-react-native'
import IrishFlag from '../components/ui/IrishFlag'

// The one place that says which icon and colour each pillar uses. Founder
// decisions (2026-11-17): Foundation is a file, Elevation is the arrow,
// Course Connect is the Irish flag, Campus Connect is a building.
// `Icon` is always called as <Icon size={n} color={c} strokeWidth={w} />;
// the flag ignores color/strokeWidth.
export const PILLARS = {
  foundation: { key: 'foundation', label: 'Foundation', Icon: FileText, color: '#1E3A5F', route: 'Foundation' },
  elevation:  { key: 'elevation',  label: 'Elevation',  Icon: TrendingUp, color: '#5B4B8A', route: 'Elevation' },
  lifestyle:  { key: 'lifestyle',  label: 'Lifestyle',  Icon: Heart, color: '#D9596B', route: 'Lifestyle' },
  campus:     { key: 'campus',     label: 'Campus Connect', short: 'Campus', Icon: Building2, color: '#C96A42', route: 'CampusConnect' },
  course:     { key: 'course',     label: 'Course Connect', short: 'Course', Icon: ({ size = 20 }) => <IrishFlag size={Math.round(size * 0.78)} />, color: '#4FA3AC', route: 'CourseConnect' },
  compass:    { key: 'compass',    label: 'Compass',    Icon: Compass, color: '#1B2D6A', route: 'Compass' },
}

export const PILLAR_ORDER = ['foundation', 'elevation', 'lifestyle', 'campus', 'course', 'compass']

// Where a post goes. Founder decisions: Course Connect is always first and the
// default (public across Ireland, everyone on the same course of life). Campus
// Connect is your own community in the same situation. Friends only is mutual
// follows. Key order here IS the display order.
//
// The pillar name "Campus Connect" never changes. Only its helper text adapts to
// who the person is (see audienceBlurb), because not everyone is at college.
export const AUDIENCES = {
  course:  { key: 'course',  label: 'Course Connect', blurb: 'Everyone across Ireland, on the same course of life', pillar: 'course' },
  campus:  { key: 'campus',  label: 'Campus Connect', blurb: 'People like you',        pillar: 'campus' },
  friends: { key: 'friends', label: 'Friends only',   blurb: 'People you follow back' },
}

export const AUDIENCE_ORDER = Object.keys(AUDIENCES)
export const DEFAULT_AUDIENCE = AUDIENCE_ORDER[0] // 'course'

// Helper text for Campus Connect by profiles.user_type (constants/userTypes.js).
// Anything else (gap year, unknown, not loaded yet) gets the safe
// fallback "People like you".
const CAMPUS_BLURB_BY_USER_TYPE = {
  student:    'Your campus',
  apprentice: 'Your trade, apprentices like you',
  worker:     'Your industry, people in the same kind of work',
}

export function audienceBlurb(key, userType) {
  const a = AUDIENCES[key]
  if (!a) return ''
  if (key === 'campus') return CAMPUS_BLURB_BY_USER_TYPE[userType] || a.blurb
  return a.blurb
}
