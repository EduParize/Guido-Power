import { useState } from 'react'
import type { ComponentProps } from 'react'
import { Icon, Input } from '../../shared/ui'

/** Input de senha com botão mostrar/ocultar. Herda id/aria do <Field>. */
export function PasswordInput(props: Omit<ComponentProps<typeof Input>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className="pr-12" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        className="absolute top-1/2 right-1.5 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text"
      >
        <Icon name={visible ? 'eyeoff' : 'eye'} size={20} />
      </button>
    </div>
  )
}
