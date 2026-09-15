/**
 * EmptyState — friendly placeholder for empty tables / lists.
 *   <EmptyState icon={Boxes} title={t('states.empty')} description={t('states.emptyHint')} />
 */
export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`surface flex flex-col items-center justify-center gap-3 px-6 py-12 text-center ${className}`}>
      {Icon && (
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-text-light dark:bg-gray-700 dark:text-gray-400">
          <Icon size={26} aria-hidden="true" />
        </span>
      )}
      <div>
        <p className="text-base font-bold text-main">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
