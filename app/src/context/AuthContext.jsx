import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(false)
  return (
    <AuthContext.Provider value={{ authed, login: () => setAuthed(true), logout: () => setAuthed(false) }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
