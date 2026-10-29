import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'
import { cn } from './cn'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border font-semibold leading-none whitespace-nowrap select-none transition-colors disabled:pointer-events-none disabled:opacity-55 contrast:border-2'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-primary text-primary-contrast hover:bg-primary-hover contrast:border-text',
  secondary:
    'border-border-strong bg-surface text-text hover:bg-surface-muted hover:border-text',
  ghost:
    'border-transparent bg-transparent text-text hover:bg-surface-muted contrast:border-border',
  danger:
    'border-transparent bg-danger text-danger-contrast hover:bg-danger-hover contrast:border-text',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[15px]',
  md: 'h-11 px-5 text-base',
}

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className)
}

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  /** Ícone à esquerda do texto. */
  icon?: IconName
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={buttonClasses(variant, size, className)}
      {...rest}
    >
      {isLoading ? <Spinner size={18} /> : icon ? <Icon name={icon} size={18} /> : null}
      {children}
    </button>
  )
}

export interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
}

/** Link de navegação com aparência de botão. */
export function LinkButton({ variant = 'primary', size = 'md', icon, className, children, ...rest }: LinkButtonProps) {
  return (
    <Link className={buttonClasses(variant, size, cn('no-underline', className))} {...rest}>
      {icon ? <Icon name={icon} size={18} /> : null}
      {children}
    </Link>
  )
}

export interface IconButtonProps extends Omit<ComponentProps<'button'>, 'aria-label'> {
  'aria-label': string
  icon: IconName
  variant?: ButtonVariant
  size?: ButtonSize
}

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  type = 'button',
  className,
  ...rest
}: IconButtonProps) {
  const box = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11'
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTS[variant], box, 'p-0', className)}
      title={rest['aria-label']}
      {...rest}
    >
      <Icon name={icon} size={size === 'sm' ? 18 : 20} />
    </button>
  )
}
