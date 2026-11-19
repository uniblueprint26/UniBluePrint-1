import { useMemo } from 'react'
import { PILLAR_ORDER } from '../constants/pillars'
import { useFoundationEnabled } from './useAppFlags'

// PILLAR_ORDER without Foundation while Foundation is closed (iOS and Android
// before app_flags.foundation_enabled is on). Use this wherever pillars are
// listed for people to tap. `exclude` removes other keys, for example 'compass'.
export function usePillarOrder(exclude = []) {
  const { enabled } = useFoundationEnabled()
  const key = exclude.join(',')
  return useMemo(
    () => PILLAR_ORDER.filter(k => (enabled || k !== 'foundation') && !exclude.includes(k)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, key],
  )
}
