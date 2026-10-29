import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { usuariosApi } from '../api/usuarios.ts'
import { sha256Hex } from '../lib/crypto.ts'
import { AuthContext } from './AuthContext'
import type { AuthContextValue, SessionUser } from './AuthContext'
import { roleForEmail } from './roles'

const SESSION_KEY = 'gp.session'
export const INVALID_CREDENTIALS = 'E-mail ou senha incorretos'

function isSessionUser(v: unknown): v is SessionUser {
  if (typeof v !== 'object' || v === null) return false
  const u = v as Record<string, unknown>
  return (
    typeof u.id === 'string' &&
    typeof u.nome === 'string' &&
    typeof u.email === 'string' &&
    (u.role === 'admin' || u.role === 'atendente')
  )
}

function readSession(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isSessionUser(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeSession(user: SessionUser | null) {
  try {
    if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* sem sessionStorage: a sessão vale só até recarregar */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readSession)

  const login = useCallback(async (email: string, senha: string) => {
    const wanted = email.trim().toLowerCase()
    const [usuarios, hash] = await Promise.all([usuariosApi.list(), sha256Hex(senha)])
    const found = usuarios.find((u) => u.email.trim().toLowerCase() === wanted)
    // Nunca guardamos senha nem hash: a sessão leva só id, nome, e-mail e papel.
    if (!found || found.senhaHash.toLowerCase() !== hash.toLowerCase()) throw new Error(INVALID_CREDENTIALS)
    const next: SessionUser = { id: found.id, nome: found.nome, email: found.email, role: roleForEmail(found.email) }
    writeSession(next)
    setUser(next)
  }, [])

  const logout = useCallback(() => {
    writeSession(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, role: user?.role ?? null, isAdmin: user?.role === 'admin', login, logout }),
    [user, login, logout],
  )
  return <AuthContext value={value}>{children}</AuthContext>
}
