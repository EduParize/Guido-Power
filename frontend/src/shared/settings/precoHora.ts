import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'gp.precoHora'
export const DEFAULT_PRECO_HORA = 120

const listeners = new Set<() => void>()

function notify(): void {
  listeners.forEach((l) => l())
}

export function getPrecoHora(): number {
  try {
    const n = Number(localStorage.getItem(STORAGE_KEY))
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_PRECO_HORA
  } catch {
    return DEFAULT_PRECO_HORA
  }
}

export function setPrecoHora(n: number): void {
  if (!Number.isFinite(n) || n <= 0) return
  try {
    localStorage.setItem(STORAGE_KEY, String(Math.round(n * 100) / 100))
  } catch {
    // armazenamento indisponível: mantém o valor atual
  }
  notify()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function usePrecoHora(): number {
  return useSyncExternalStore(subscribe, getPrecoHora, () => DEFAULT_PRECO_HORA)
}
