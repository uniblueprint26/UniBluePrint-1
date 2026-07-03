import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { SessionUser } from '../lib/types'

const STORAGE_KEY = 'ubp_training_user'

interface AuthContextValue {
  user: SessionUser | null
  loading: boolean
  login: (
    email: string,
    accessCode: string,
  ) => Promise<{ error: string | null; user: SessionUser | null }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        setUser(JSON.parse(raw))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, accessCode: string) => {
    const { data, error } = await supabase
      .from('training_users')
      .select('id, email, full_name, university, role, access_code')
      .eq('email', email.trim().toLowerCase())
      .eq('access_code', accessCode.trim())
      .maybeSingle()

    if (error || !data) {
      return {
        error: 'Access code not recognised. Contact UniBlueprint Operations.',
        user: null,
      }
    }

    const sessionUser: SessionUser = {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      university: data.university,
      role: data.role,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser))
    setUser(sessionUser)
    return { error: null, user: sessionUser }
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
