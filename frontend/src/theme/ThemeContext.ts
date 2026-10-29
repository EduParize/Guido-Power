import { createContext, useContext } from 'react'

export type Theme = 'light' | 'dark' | 'contrast'

export const THEMES: readonly { value: Theme; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Noturno' },
  { value: 'contrast', label: 'Alto contraste' },
]

export const THEME_STORAGE_KEY = 'gp.theme'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'contrast'
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme precisa estar dentro de <ThemeProvider>')
  return ctx
}
