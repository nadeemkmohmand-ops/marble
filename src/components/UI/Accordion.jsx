import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn.js'

/**
 * Accordion — expand/collapse sections.
 * items: [{ id, title, content }]; allowMultiple lets several stay open.
 */
export default function Accordion({
  items = [],
  defaultOpen = [],
  allowMultiple = false,
  className = '',
}) {
  const [openIds, setOpenIds] = useState(() => new Set(defaultOpen))

  const toggle = (id) => {
    setOpenIds((prev) => {
      const next = new Set(allowMultiple ? prev : [])
      if (prev.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className={cn('divide-y divide-border dark:divide-gray-700', className)}>
      {items.map((item) => {
        const open = openIds.has(item.id)
        return (
          <div key={item.id}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => toggle(item.id)}
              className="flex w-full items-center justify-between gap-3 py-4 text-start"
            >
              <span className="text-sm font-bold text-main">{item.title}</span>
              <ChevronDown
                size={18}
                className={cn('shrink-0 text-text-light transition-transform duration-300', open && 'rotate-180')}
                aria-hidden="true"
              />
            </button>
            {open && <div className="pb-4 text-sm leading-relaxed text-muted">{item.content}</div>}
          </div>
        )
      })}
    </div>
  )
}
