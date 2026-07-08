import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

const ICONS = {
  success: CheckCircle2,
  danger: XCircle,
  warning: AlertTriangle,
} as const

const ICON_COLOR = {
  success: 'text-success',
  danger: 'text-danger',
  warning: 'text-warning',
} as const

export default function Callout({
  type,
  children,
}: {
  type: 'success' | 'danger' | 'warning'
  children: ReactNode
}) {
  const Icon = ICONS[type]
  return (
    <div className={`callout callout-${type}`}>
      <Icon size={20} className={`${ICON_COLOR[type]} shrink-0 mt-0.5`} />
      <div>{children}</div>
    </div>
  )
}
