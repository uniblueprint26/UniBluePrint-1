import StatusDot from './StatusDot'

// Studio Phase 13 -- the one consistent "good / warning / critical" visual
// language used across every hub's key numbers (GlanceCard, Tech's error
// count, Legal's GDPR overdue flag, Outreach's coach-recruitment reality,
// ...). A thin sibling of StatusDot, not a reimplementation -- it reuses
// StatusDot's own green/yellow/red/grey rendering (and, through it,
// theme.js's getStatusColor()) so there is exactly one place dark mode's
// brighter success/warning/destructive hex values live, never a second
// copy of that color logic here.
//
// `level`: 'good' | 'warning' | 'critical' | 'neutral'. Deliberately a
// semantic name rather than a raw color -- the CALLER still decides what
// "good" means for its own number (see StatusDot's own comment), this
// just gives every hub the same three words for it instead of each hub
// picking its own ad hoc green/amber/red mapping inline.
const LEVEL_TO_STATUS = { good: 'green', warning: 'yellow', critical: 'red', neutral: 'grey' }
const LEVEL_DEFAULT_LABEL = { good: 'On track', warning: 'Needs attention', critical: 'Critical', neutral: 'No signal yet' }

export default function HealthBadge({ level = 'neutral', label, size = 8, showLabel = true }) {
  const status = LEVEL_TO_STATUS[level] || 'grey'
  return <StatusDot status={status} label={label || LEVEL_DEFAULT_LABEL[level]} size={size} showLabel={showLabel} />
}
