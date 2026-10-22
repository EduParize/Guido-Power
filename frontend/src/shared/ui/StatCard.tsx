import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  children: ReactNode
  hint?: string
  highlight?: boolean
  className?: string
}

export function StatCard({ label, children, hint, highlight = false, className = '' }: StatCardProps) {
  const palette = highlight
    ? 'border-brand-900 bg-brand-900 text-white'
    : 'border-slate-200 bg-white text-slate-900'
  const labelColor = highlight ? 'text-brand-100' : 'text-slate-600'

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${palette} ${className}`}>
      <p className={`text-xs font-semibold tracking-wide uppercase ${labelColor}`}>{label}</p>
      <div className={`mt-2 ${highlight ? 'text-3xl font-bold tabular-nums' : 'text-lg font-semibold'}`}>
        {children}
      </div>
      {hint && <p className={`mt-1 text-xs ${labelColor}`}>{hint}</p>}
    </div>
  )
}
