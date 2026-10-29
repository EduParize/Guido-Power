import { createContext, useContext, useId } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from './cn'
import { Icon } from './Icon'

export interface FieldControlProps {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  'aria-required'?: true
}

const FieldContext = createContext<FieldControlProps | null>(null)

export interface FieldProps {
  label: string
  required?: boolean
  error?: string | null
  hint?: string
  /** Use quando o controle tem id próprio (sem contexto automático). */
  htmlFor?: string
  className?: string
  /** Elemento(s) — Input/Textarea/Select herdam id e aria automaticamente — ou função que recebe as props. */
  children: ReactNode | ((props: FieldControlProps) => ReactNode)
}

export function Field({ label, required, error, hint, htmlFor, className, children }: FieldProps) {
  const autoId = useId()
  const id = htmlFor ?? autoId
  const errorId = `${id}-erro`
  const hintId = `${id}-dica`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined
  const controlProps: FieldControlProps = {
    id,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    'aria-required': required ? true : undefined,
  }
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[15px] font-semibold text-text">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="ml-1 font-bold text-danger" title="Obrigatório">
              *
            </span>
            <span className="sr-only"> (obrigatório)</span>
          </>
        ) : null}
      </label>
      <FieldContext value={controlProps}>
        {typeof children === 'function' ? children(controlProps) : children}
      </FieldContext>
      {hint ? (
        <p id={hintId} className="text-sm text-text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-sm font-semibold text-danger">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
}

/** Nota padrão para o topo de formulários com campos obrigatórios. */
export function RequiredNote() {
  return (
    <p className="text-sm text-text-muted">
      <span aria-hidden="true" className="font-bold text-danger">*</span> Campo obrigatório
    </p>
  )
}

const CONTROL =
  'w-full rounded-lg border border-border-strong bg-surface px-3 text-base text-text placeholder:text-text-muted/80 transition-colors hover:border-text disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70 aria-[invalid=true]:border-danger aria-[invalid=true]:border-2 contrast:border-2'

export const controlClasses = CONTROL

function useControlProps(own: { id?: string }): Partial<FieldControlProps> {
  const ctx = useContext(FieldContext)
  if (!ctx) return {}
  return own.id ? {} : ctx
}

export function Input({ className, ...rest }: ComponentProps<'input'>) {
  const ctx = useControlProps(rest)
  return <input className={cn(CONTROL, 'h-11', className)} {...ctx} {...rest} />
}

export function Textarea({ className, rows = 4, ...rest }: ComponentProps<'textarea'>) {
  const ctx = useControlProps(rest)
  return <textarea rows={rows} className={cn(CONTROL, 'min-h-24 py-2.5 leading-relaxed', className)} {...ctx} {...rest} />
}

export interface SelectProps extends ComponentProps<'select'> {
  /** Texto da opção vazia (value ""). Use para o estado inicial sem escolha. */
  placeholder?: string
}

export function Select({ className, placeholder, children, ...rest }: SelectProps) {
  const ctx = useControlProps(rest)
  return (
    <div className="relative">
      <select className={cn(CONTROL, 'h-11 appearance-none pr-10', className)} {...ctx} {...rest}>
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {children}
      </select>
      <Icon
        name="chevron"
        size={18}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-text-muted"
      />
    </div>
  )
}
