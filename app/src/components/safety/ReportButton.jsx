import { TouchableOpacity } from 'react-native'
import { Flag } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useReport } from './ReportProvider'

// A small flag button that opens the shared report sheet for one thing.
// Renders nothing for your own content. `target` is the same object
// openReport() takes: { contentType, contentId, reportedUserId, userName, noun }.
export default function ReportButton({ target, size = 15, style, label }) {
  const { colors } = useTheme()
  const { user } = useAuth()
  const { openReport } = useReport()
  if (!target || target.contentId == null) return null
  if (target.reportedUserId && target.reportedUserId === user?.id) return null
  return (
    <TouchableOpacity
      onPress={() => openReport(target)}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={label || `Report this ${target.noun || 'post'}`}
      style={[{ padding: 4 }, style]}
    >
      <Flag size={size} color={colors.textSecondary} strokeWidth={1.8} />
    </TouchableOpacity>
  )
}
