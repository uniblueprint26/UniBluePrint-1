import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export default function RouteFade({ children }: { children: ReactNode }) {
  const location = useLocation()
  return (
    <div key={location.pathname} className="route-fade">
      {children}
    </div>
  )
}
