import { cx } from '../../utils/format'

/**
 * A section wrapper used across the app: title, optional description, actions.
 */
export function Card({ title, description, actions, children, className, bodyClassName }) {
  return (
    <section className={cx('rounded-xl border border-ink-200 bg-white card-shadow', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-200 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-ink-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cx('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

export default Card
