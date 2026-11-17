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

// Where a post goes. Founder decision: Campus Connect = your campus only,
// Course Connect = public across Ireland, Friends only = people you follow.
export const AUDIENCES = {
  campus:  { key: 'campus',  label: 'Campus Connect', blurb: 'Your campus only',       pillar: 'campus' },
  course:  { key: 'course',  label: 'Course Connect', blurb: 'Public across Ireland',  pillar: 'course' },
  friends: { key: 'friends', label: 'Friends only',   blurb: 'People you follow' },
}
