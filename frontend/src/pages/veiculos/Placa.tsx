import { cn } from '../../shared/ui'
import { formatPlaca } from './format'

/** Placa em fonte monoespaçada, no estilo de uma placa de veículo. */
export function Placa({ placa, className }: { placa: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block rounded-md border-2 border-border-strong bg-surface px-2 py-0.5 font-mono text-[15px] font-bold tracking-widest text-text uppercase',
        className,
      )}
    >
      {formatPlaca(placa)}
    </span>
  )
}
