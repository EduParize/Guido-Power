import type { ReactNode } from 'react'

type AlertVariant = 'error' | 'success'

const VARIANT_STYLES: Record<AlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
}

interface AlertProps {
  variant: AlertVariant
  children: ReactNode
  className?: string
}

export function Alert({ variant, children, className = '' }: AlertProps) {
  return (
    <p
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-4 py-3 text-sm ${VARIANT_STYLES[variant]} ${className}`}
    >
      {children}
    </p>
  )
}
