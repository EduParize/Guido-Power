import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { THEME_STORAGE_KEY, ThemeContext, isTheme } from './ThemeContext'
import type { Theme } from './ThemeContext'

function readInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isTheme(stored)) return stored
  } catch {
    /* storage indisponível: segue para as preferências do sistema */
  }
  if (window.matchMedia('(prefers-contrast: more)').matches) return 'contrast'
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

/** Idempotente: se já houver um ThemeProvider acima, apenas repassa os filhos. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const parent = useContext(ThemeContext)
  if (parent) return <>{children}</>
  return <ThemeRoot>{children}</ThemeRoot>
}

function ThemeRoot({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* sem persistência: o tema vale só nesta sessão */
    }
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])
  return <ThemeContext value={value}>{children}</ThemeContext>
}
