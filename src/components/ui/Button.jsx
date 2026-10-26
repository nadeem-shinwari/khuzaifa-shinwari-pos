import { cx } from '../../utils/format'

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600',
  secondary:
    'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50 focus-visible:outline-ink-400',
  ghost: 'text-ink-600 hover:bg-ink-100 focus-visible:outline-ink-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
}

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
}

/**
 * A button with the variants used across the app.
 */
export function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        className,
      )}
      {...props}
    />
  )
}

export default Button
