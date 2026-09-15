import { useEffect, useRef } from 'react'

/**
 * useKeyboard — declarative keyboard shortcut.
 *
 *   useKeyboard('Escape', closeMenu)
 *   useKeyboard('k', openSearch, { ctrl: true })
 *   useKeyboard('Escape', close, { active: isOpen })  // conditionally bound
 */
export function useKeyboard(
  key,
  handler,
  { ctrl = false, shift = false, alt = false, meta = false, active = true } = {}
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!active) return undefined

    const onKeyDown = (event) => {
      if (event.key.toLowerCase() !== key.toLowerCase()) return
      if (
        event.ctrlKey !== ctrl ||
        event.shiftKey !== shift ||
        event.altKey !== alt ||
        event.metaKey !== meta
      ) {
        return
      }
      handlerRef.current(event)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [key, ctrl, shift, alt, meta, active])
}

export default useKeyboard
