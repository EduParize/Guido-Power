import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Icon, cn } from '../shared/ui'
import { Sidebar } from './Sidebar'

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'

export function AppShell() {
  const [open, setOpen] = useState(false)
  const drawerRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])

  // Drawer aberto: foco entra no menu, Esc fecha, Tab fica preso dentro, foco volta ao botão ao fechar.
  useEffect(() => {
    if (!open) return
    const drawer = drawerRef.current
    const menuButton = menuButtonRef.current
    drawer?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key !== 'Tab' || !drawer) return
      const items = Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      menuButton?.focus()
    }
  }, [open])

  return (
    <div className="min-h-dvh">
      <a
        href="#conteudo"
        className="sr-only z-[80] rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-contrast focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>

      <aside
        ref={drawerRef}
        aria-label="Menu lateral"
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 border-r border-side-border transition-[transform,visibility] duration-200',
          open ? 'translate-x-0' : 'max-lg:invisible max-lg:-translate-x-full',
        )}
      >
        <Sidebar onNavigate={close} onClose={close} />
      </aside>

      {open ? <div className="anim-fade fixed inset-0 z-30 bg-overlay lg:hidden" onClick={close} aria-hidden="true" /> : null}

      <div className="lg:pl-72" inert={open || undefined}>
        <header className="side-scope sticky top-0 z-20 flex h-14 items-center gap-3 bg-side-bg px-3 text-side-text lg:hidden">
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Abrir menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-lg hover:bg-side-hover"
          >
            <Icon name="menu" size={24} />
          </button>
          <span className="font-display text-xl font-bold">Guido Power</span>
        </header>
        <main id="conteudo" tabIndex={-1} className="w-full px-4 py-6 outline-none sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
