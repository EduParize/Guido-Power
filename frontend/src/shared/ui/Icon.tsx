import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'dashboard' | 'ordem' | 'orcamento' | 'cliente' | 'veiculo' | 'item'
  | 'usuario' | 'config' | 'logout' | 'plus' | 'search' | 'edit' | 'trash'
  | 'close' | 'check' | 'alert' | 'chevron' | 'whatsapp' | 'sun' | 'moon'
  | 'contrast' | 'menu' | 'info' | 'eye' | 'eyeoff' | 'inbox' | 'lock'

const PATHS: Record<IconName, ReactNode> = {
  dashboard: <path d="M4 4h6v7H4zM14 4h6v4h-6zM14 12h6v8h-6zM4 15h6v5H4z" />,
  ordem: <path d="M9 4h6v3H9zM7 5.5H6a2 2 0 0 0-2 2V20a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5a2 2 0 0 0-2-2h-1M8.5 12h7M8.5 16.5h5" />,
  orcamento: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />,
  cliente: <path d="M3 5h18v14H3zM8 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM4.8 16.5c.6-2.4 5.8-2.4 6.4 0M14 9.5h4M14 13.5h4" />,
  veiculo: <path d="M3 13l2-6h14l2 6v5h-3v-2H6v2H3zM3 13h18M7.5 14.5h.01M16.5 14.5h.01" />,
  item: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9" />,
  usuario: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />,
  config: <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4" />,
  logout: <path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  alert: <path d="M12 3l10 18H2zM12 10v5M12 18h.01" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  whatsapp: <path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6zM9 9c0 3 3 6 6 6l1-1.5-2-1-1 .8c-1-.4-2-1.4-2.4-2.4l.8-1-1-2z" />,
  sun: <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  contrast: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  info: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8h.01" />,
  eye: <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />,
  eyeoff: <path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2" />,
  inbox: <path d="M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5" />,
  lock: <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />,
}

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
}

/** Ícone decorativo (aria-hidden). Use `aria-label` no botão/elemento pai. */
export function Icon({ name, size = 20, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
