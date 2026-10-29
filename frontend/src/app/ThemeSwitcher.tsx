import type { KeyboardEvent } from 'react'
import { THEMES, useTheme } from '../theme'
import type { Theme } from '../theme'
import { Icon, cn } from '../shared/ui'
import type { IconName } from '../shared/ui'

const ICONS: Record<Theme, IconName> = { light: 'sun', dark: 'moon', contrast: 'contrast' }

/** Controle segmentado (radiogroup) para Claro / Noturno / Alto contraste. */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const index = THEMES.findIndex((t) => t.value === theme)
    const next = THEMES[(index + step + THEMES.length) % THEMES.length]
    setTheme(next.value)
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-theme-option="${next.value}"]`)?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Tema da interface"
      onKeyDown={onKeyDown}
      className="grid grid-cols-3 gap-1 rounded-lg border border-side-border p-1"
    >
      {THEMES.map((t) => {
        const selected = t.value === theme
        return (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t.label}
            title={t.label}
            tabIndex={selected ? 0 : -1}
            data-theme-option={t.value}
            onClick={() => setTheme(t.value)}
            className={cn(
              'flex h-10 items-center justify-center rounded-md transition-colors',
              selected ? 'bg-side-active-bg text-side-active-fg' : 'text-side-muted hover:bg-side-hover hover:text-side-text',
            )}
          >
            <Icon name={ICONS[t.value]} size={20} />
          </button>
        )
      })}
    </div>
  )
}
