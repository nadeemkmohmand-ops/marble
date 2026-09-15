import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * useFocusTrap — traps Tab focus inside a container while active
 * and restores focus to the previously focused element on close.
 * Used by Modal.jsx and Drawer.jsx (a11y requirement).
 *
 * const trapRef = useFocusTrap({ active: open })
 * <div ref={trapRef} tabIndex={-1}>…</div>
 */
export function useFocusTrap({ active = true, restoreFocus = true } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    if (!active) return undefined
    const container = ref.current
    if (!container) return undefined

    const previouslyFocused = document.activeElement

    const focusFirst = () => {
      const first = container.querySelector(FOCUSABLE)
      if (first) first.focus()
      else container.focus()
    }
    const timer = setTimeout(focusFirst, 0)

    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return
      const focusables = Array.from(container.querySelectorAll(FOCUSABLE))
      if (focusables.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const current = document.activeElement

      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (current === last || !container.contains(current))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', onKeyDown)
      if (restoreFocus && previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus()
      }
    }
  }, [active, restoreFocus])

  return ref
}

export default useFocusTrap
