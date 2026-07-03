import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Header({ backTo, title = 'Blueprint Studio' }: { backTo?: string; title?: string }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="w-full h-[72px] bg-card shadow-header flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        {backTo && (
          <Link
            to={backTo}
            aria-label="Back"
            className="text-navy hover:opacity-70 transition-opacity"
          >
            <ArrowLeft size={20} />
          </Link>
        )}
        <span className="font-heading text-navy text-[20px]">{title}</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden sm:inline text-[14px] text-muted">{user?.full_name}</span>
        <button onClick={handleLogout} className="text-[14px] text-faint hover:text-navy">
          Log out
        </button>
      </div>
    </header>
  )
}
