import { parseDecimalBR } from '../../shared/lib/money.ts'
import { Input, cn } from '../../shared/ui'
import { useState } from 'react'

export type DecimalKind = 'money' | 'hours' | 'int'

function parseText(text: string): number {
  const t = text.trim()
  if (!t) return 0
  return parseDecimalBR(t) ?? Number.NaN
}

function formatValue(n: number, kind: DecimalKind): string {
  if (!Number.isFinite(n)) return ''
  const digits = kind === 'money' ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: kind === 'hours' ? 4 : 0 }
  return n.toLocaleString('pt-BR', { ...digits, useGrouping: false })
}

export interface DecimalInputProps {
  value: number
  onChange: (value: number) => void
  kind: DecimalKind
  'aria-label': string
  invalid?: boolean
  required?: boolean
  disabled?: boolean
  className?: string
}

/**
 * Campo numérico pt-BR ("1.234,56"). Vazio vale 0; texto inválido vira NaN (a validação aponta o erro).
 * Enquanto o texto digitado representa `value`, ele é preservado; se `value` mudar por fora, mostra o novo valor.
 */
export function DecimalInput({ value, onChange, kind, invalid, required, disabled, className, ...rest }: DecimalInputProps) {
  const [text, setText] = useState('')
  const shown = Object.is(parseText(text), value) ? text : formatValue(value, kind)
  return (
    <div className="relative">
      {kind === 'money' ? (
        <span aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[15px] font-semibold text-text-muted">
          R$
        </span>
      ) : null}
      {kind === 'hours' ? (
        <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[15px] font-semibold text-text-muted">
          h
        </span>
      ) : null}
      <Input
        type="text"
        inputMode={kind === 'int' ? 'numeric' : 'decimal'}
        autoComplete="off"
        placeholder={kind === 'money' ? '0,00' : kind === 'hours' ? '0' : '1'}
        value={shown}
        disabled={disabled}
        aria-invalid={invalid ? true : undefined}
        aria-required={required ? true : undefined}
        onChange={(e) => {
          setText(e.target.value)
          onChange(parseText(e.target.value))
        }}
        className={cn('text-right tabular-nums', kind === 'money' && 'pl-10', kind === 'hours' && 'pr-8', className)}
        {...rest}
      />
    </div>
  )
}
