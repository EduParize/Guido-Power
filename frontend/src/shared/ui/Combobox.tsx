import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from './cn'
import { controlClasses } from './Field'
import { Icon } from './Icon'

const MAX_RENDERED = 100

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

function Highlight({ text, query }: { text: string; query: string }) {
  const nq = normalize(query)
  const nt = text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  const at = nq && nt.length === text.length ? nt.indexOf(nq) : -1
  if (at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-sm bg-primary-soft px-0.5 font-bold text-primary-soft-text">
        {text.slice(at, at + nq.length)}
      </mark>
      {text.slice(at + nq.length)}
    </>
  )
}

export interface ComboboxProps<T> {
  items: T[]
  getKey: (item: T) => string | number
  getLabel: (item: T) => string
  /** Conteúdo da opção; recebe o rótulo já com destaque da busca. */
  renderItem?: (item: T, ctx: { query: string; label: ReactNode }) => ReactNode
  /** Sobrescreve o filtro padrão (rótulo, sem acento e sem diferenciar caixa). */
  filter?: (item: T, query: string) => boolean
  value: T | null
  onChange: (item: T | null) => void
  placeholder?: string
  label?: string
  /** Rótulo acessível quando `label` não é exibido. */
  'aria-label'?: string
  required?: boolean
  error?: string | null
  emptyText?: string
  allowFreeText?: boolean
  onFreeText?: (text: string) => void
  disabled?: boolean
  className?: string
}

export function Combobox<T>({
  items,
  getKey,
  getLabel,
  renderItem,
  filter,
  value,
  onChange,
  placeholder,
  label,
  'aria-label': ariaLabel,
  required,
  error,
  emptyText = 'Nenhum resultado encontrado',
  allowFreeText = false,
  onFreeText,
  disabled,
  className,
}: ComboboxProps<T>) {
  const uid = useId()
  const inputId = `${uid}-input`
  const listId = `${uid}-lista`
  const errorId = `${uid}-erro`
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [query, setQuery] = useState('')
  const [typing, setTyping] = useState(false)
  const [freeText, setFreeText] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const sorted = useMemo(
    () => [...items].sort((a, b) => getLabel(a).localeCompare(getLabel(b), 'pt-BR')),
    [items, getLabel],
  )
  const matches = useMemo(() => {
    const nq = normalize(query)
    if (!typing || !nq) return sorted
    return sorted.filter((item) => (filter ? filter(item, query) : normalize(getLabel(item)).includes(nq)))
  }, [sorted, query, typing, filter, getLabel])
  const visible = matches.slice(0, MAX_RENDERED)

  const display = typing ? query : value ? getLabel(value) : freeText
  const hasText = display.length > 0
  const activeId = open && visible[active] ? `${listId}-${active}` : undefined

  useEffect(() => {
    if (!open) return
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  function select(item: T) {
    onChange(item)
    setFreeText('')
    setTyping(false)
    setQuery('')
    setOpen(false)
  }

  function clear() {
    onChange(null)
    setFreeText('')
    setQuery('')
    setTyping(false)
    setOpen(false)
    inputRef.current?.focus()
  }

  function commitOrRevert() {
    setOpen(false)
    if (!typing) return
    const text = query.trim()
    if (allowFreeText && text) {
      setFreeText(text)
      onChange(null)
      onFreeText?.(text)
    } else if (allowFreeText && !text) {
      setFreeText('')
      onFreeText?.('')
    }
    setTyping(false)
    setQuery('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const last = visible.length - 1
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!open) { setOpen(true); setActive(0) } else setActive((i) => Math.min(i + 1, last))
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!open) { setOpen(true); setActive(Math.max(last, 0)) } else setActive((i) => Math.max(i - 1, 0))
        break
      case 'Home':
        if (open) { e.preventDefault(); setActive(0) }
        break
      case 'End':
        if (open) { e.preventDefault(); setActive(Math.max(last, 0)) }
        break
      case 'Enter':
        if (open) {
          e.preventDefault()
          const item = visible[active]
          if (item) select(item)
          else commitOrRevert()
        }
        break
      case 'Escape':
        if (open) { e.preventDefault(); e.stopPropagation(); setOpen(false) }
        else if (typing) { setTyping(false); setQuery('') }
        break
      case 'Tab':
        commitOrRevert()
        break
    }
  }

  const describedBy = error ? errorId : undefined

  return (
    <div
      className={cn('relative flex min-w-0 flex-col gap-1.5', className)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) commitOrRevert()
      }}
    >
      {label ? (
        <label htmlFor={inputId} className="text-[15px] font-semibold text-text">
          {label}
          {required ? (
            <>
              <span aria-hidden="true" className="ml-1 font-bold text-danger" title="Obrigatório">*</span>
              <span className="sr-only"> (obrigatório)</span>
            </>
          ) : null}
        </label>
      ) : null}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          type="text"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-label={label ? undefined : ariaLabel}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          aria-required={required ? true : undefined}
          disabled={disabled}
          placeholder={placeholder}
          value={display}
          onChange={(e) => {
            setQuery(e.target.value)
            setTyping(true)
            setOpen(true)
            setActive(0)
          }}
          onFocus={() => !disabled && setOpen(true)}
          onClick={() => !disabled && setOpen(true)}
          onKeyDown={onKeyDown}
          className={cn(controlClasses, 'h-11 pr-20')}
        />
        <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-0.5">
          {hasText && !disabled ? (
            <button
              type="button"
              aria-label="Limpar seleção"
              title="Limpar"
              onClick={clear}
              className="grid h-8 w-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text"
            >
              <Icon name="close" size={16} />
            </button>
          ) : null}
          <Icon name="chevron" size={18} className={cn('mr-2 text-text-muted transition-transform', open && 'rotate-180')} />
        </div>
      </div>
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label ?? ariaLabel}
          className="anim-pop absolute top-full right-0 left-0 z-30 mt-1 max-h-72 overflow-auto rounded-lg border border-border-strong bg-surface-raised p-1 shadow-pop"
        >
          {visible.length === 0 ? (
            <li role="presentation" className="px-3 py-3 text-[15px] text-text-muted">
              {allowFreeText && query.trim() ? `${emptyText}. Pressione Tab para usar “${query.trim()}”.` : emptyText}
            </li>
          ) : (
            visible.map((item, index) => {
              const text = getLabel(item)
              const labelNode = <Highlight text={text} query={typing ? query : ''} />
              const isActive = index === active
              const isSelected = value !== null && getKey(value) === getKey(item)
              return (
                <li
                  key={getKey(item)}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(item)}
                  onMouseMove={() => setActive(index)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-[15px] text-text',
                    isActive && 'bg-primary-soft text-primary-soft-text contrast:bg-primary contrast:text-primary-contrast',
                    isSelected && 'font-bold',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    {renderItem ? renderItem(item, { query: typing ? query : '', label: labelNode }) : labelNode}
                  </span>
                  {isSelected ? <Icon name="check" size={16} className="shrink-0" /> : null}
                </li>
              )
            })
          )}
          {matches.length > MAX_RENDERED ? (
            <li role="presentation" className="px-3 py-2 text-sm text-text-muted">
              Mostrando {MAX_RENDERED} de {matches.length}. Digite para refinar.
            </li>
          ) : null}
        </ul>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {open ? `${matches.length} ${matches.length === 1 ? 'resultado' : 'resultados'}` : ''}
      </p>
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-sm font-semibold text-danger">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
}
