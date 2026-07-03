import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function OperationsRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'operations') return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
