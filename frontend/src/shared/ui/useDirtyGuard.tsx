import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useBlocker } from 'react-router-dom'
import { ConfirmDialog } from './Modal'

export const DIRTY_MESSAGE = 'Você tem alterações não salvas. Deseja realmente cancelar?'

export interface DirtyGuard {
  /** Renderize em qualquer lugar do componente. */
  dialog: ReactNode
  /** Para botões "Cancelar": roda `action` já se estiver limpo; senão pergunta antes. */
  confirmLeave: (action: () => void) => void
  /** Chame logo antes de navegar após salvar com sucesso (libera o bloqueio do estado ainda "sujo"). */
  allowLeave: () => void
}

/** Bloqueia navegação do react-router (data router) e fechamento da aba enquanto `isDirty`. */
export function useDirtyGuard(isDirty: boolean): DirtyGuard {
  const bypass = useRef(false)
  const [pending, setPending] = useState<(() => void) | null>(null)
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    isDirty && !bypass.current && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (isDirty) bypass.current = false
  }, [isDirty])

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      if (bypass.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const confirmLeave = useCallback(
    (action: () => void) => {
      if (!isDirty || bypass.current) action()
      else setPending(() => action)
    },
    [isDirty],
  )

  const allowLeave = useCallback(() => {
    bypass.current = true
  }, [])

  const blocked = blocker.state === 'blocked'
  const open = blocked || pending !== null

  function onConfirm() {
    bypass.current = true
    if (blocker.state === 'blocked') blocker.proceed()
    if (pending) {
      const action = pending
      setPending(null)
      action()
    }
  }

  function onCancel() {
    if (blocker.state === 'blocked') blocker.reset()
    setPending(null)
  }

  const dialog = (
    <ConfirmDialog
      open={open}
      title="Alterações não salvas"
      message={DIRTY_MESSAGE}
      confirmLabel="Sim, descartar"
      cancelLabel="Continuar editando"
      tone="danger"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )

  return { dialog, confirmLeave, allowLeave }
}
