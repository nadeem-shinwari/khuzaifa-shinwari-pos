import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from 'lucide-react'

import { cx } from '../../utils/format'

const variants = {
  info: {
    wrapper: 'border-brand-200 bg-brand-50 text-brand-900',
    icon: 'text-brand-600',
    Icon: Info,
  },
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icon: 'text-emerald-600',
    Icon: CircleCheck,
  },
  warning: {
    wrapper: 'border-amber-200 bg-amber-50 text-amber-900',
    icon: 'text-amber-600',
    Icon: TriangleAlert,
  },
  error: {
    wrapper: 'border-red-200 bg-red-50 text-red-900',
    icon: 'text-red-600',
    Icon: CircleAlert,
  },
}

/**
 * An inline status banner.
 */
export function Alert({ variant = 'info', title, children, className }) {
  const config = variants[variant] ?? variants.info
  const { Icon } = config

  return (
    <div
      role="status"
      className={cx('flex gap-3 rounded-lg border px-4 py-3 text-sm', config.wrapper, className)}
    >
      <Icon className={cx('mt-0.5 size-5 shrink-0', config.icon)} aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx(title && 'mt-0.5', 'break-words')}>{children}</div>}
      </div>
    </div>
  )
}

/**
 * A centred loading indicator with an optional label.
 */
export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-500">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

/**
 * A friendly empty state.
 */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {Icon && (
        <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-ink-100 text-ink-500">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <p className="text-sm font-semibold text-ink-800">{title}</p>
      {description && <p className="max-w-md text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export default Alert
