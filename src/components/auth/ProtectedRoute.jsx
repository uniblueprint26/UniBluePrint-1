import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div style={{
      padding: '80px 20px',
      textAlign: 'center',
      fontFamily: "'DM Sans', sans-serif",
      color: '#6B7280',
    }}>
      Loading...
    </div>
  )

  if (!user) return <Navigate to="/sign-in" state={{ from: location }} replace />

  return children
}
