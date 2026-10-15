import { useEffect, useState } from 'react'
import { getHealth } from '../../shared/api/health'

type ApiStatus = 'carregando' | 'online' | 'offline'

const STATUS_STYLES: Record<ApiStatus, string> = {
  carregando: 'bg-slate-100 text-slate-700',
  online: 'bg-brand-100 text-brand-800',
  offline: 'bg-red-100 text-red-800',
}

export function HomePage() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('carregando')

  useEffect(() => {
    getHealth()
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'))
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold text-brand-900">Guido Power</h1>
      <p className="text-slate-600">Base do projeto pronta para as primeiras features.</p>
      <span
        className={`rounded-full px-4 py-1 text-sm font-medium ${STATUS_STYLES[apiStatus]}`}
        data-testid="api-status"
      >
        API: {apiStatus}
      </span>
    </main>
  )
}
