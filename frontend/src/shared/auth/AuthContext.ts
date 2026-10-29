import { createContext, useContext } from 'react'
import type { Role } from './roles'

export interface SessionUser {
  id: string
  nome: string
  email: string
  role: Role
}

export interface AuthContextValue {
  user: SessionUser | null
  role: Role | null
  isAdmin: boolean
  /** Rejeita com Error("E-mail ou senha incorretos") se as credenciais não conferem. */
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
