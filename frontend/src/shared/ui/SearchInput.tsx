import { useId } from 'react'
import { cn } from './cn'
import { controlClasses } from './Field'
import { Icon } from './Icon'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Rótulo acessível (visualmente oculto). */
  label?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = 'Buscar…', label = 'Buscar', className }: SearchInputProps) {
  const id = useId()
  return (
    <div role="search" className={cn('relative w-full sm:max-w-sm', className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(controlClasses, 'h-11 pr-11 pl-10 [&::-webkit-search-cancel-button]:hidden')}
      />
      {value ? (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-1.5 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text"
        >
          <Icon name="close" size={16} />
        </button>
      ) : null}
    </div>
  )
}
