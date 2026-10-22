import type { StatusOrdem } from '../types'

export const STATUS_STYLES: Record<StatusOrdem, { badge: string; dot: string }> = {
  'Em espera': { badge: 'bg-slate-100 text-slate-700 ring-slate-300', dot: 'bg-slate-400' },
  Diagnostico: { badge: 'bg-brand-100 text-brand-800 ring-brand-500/30', dot: 'bg-brand-500' },
  'Em serviço': { badge: 'bg-indigo-100 text-indigo-800 ring-indigo-300', dot: 'bg-indigo-500' },
  'Aguardando Peça': { badge: 'bg-amber-100 text-amber-800 ring-amber-300', dot: 'bg-amber-500' },
  Pausado: { badge: 'bg-orange-100 text-orange-800 ring-orange-300', dot: 'bg-orange-500' },
  Finalizado: { badge: 'bg-green-100 text-green-800 ring-green-300', dot: 'bg-green-500' },
  Cancelado: { badge: 'bg-red-100 text-red-800 ring-red-300', dot: 'bg-red-500' },
}
