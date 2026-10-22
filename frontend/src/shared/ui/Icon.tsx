const PATHS = {
  dashboard: 'M3 12 12 4l9 8M5 10v10h5v-6h4v6h5V10',
  ordem: 'M9 5h6M9 3h6a1 1 0 0 1 1 1v2H8V4a1 1 0 0 1 1-1ZM8 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2M9 12h6M9 16h4',
  cliente: 'M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 19v-1a4 4 0 0 0-3-3.9M15 4.2a3.5 3.5 0 0 1 0 6.6',
  veiculo: 'M5 16v2M19 16v2M3 16h18v-4l-2-5H5l-2 5v4ZM3 12h18M7 14h.01M17 14h.01',
  usuario: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 0 1 14 0',
  plus: 'M12 5v14M5 12h14',
}

export type IconName = keyof typeof PATHS

interface IconProps {
  name: IconName
  className?: string
}

export function Icon({ name, className = 'h-5 w-5' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
