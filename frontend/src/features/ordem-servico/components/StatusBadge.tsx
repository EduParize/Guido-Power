import { STATUS_LABELS } from '../types'
import type { StatusOrdem } from '../types'
import { STATUS_STYLES } from './statusStyles'

interface StatusBadgeProps {
  status: StatusOrdem
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles.badge}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {STATUS_LABELS[status]}
    </span>
  )
}
