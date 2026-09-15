import { useEffect } from 'react'

/**
 * useClickOutside — calls `handler` when a pointer press lands outside `ref`.
 *   const ref = useRef(null)
 *   useClickOutside(ref, () => setOpen(false), open)
 */
export function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined

    const listener = (event) => {
      const element = ref.current
      if (!element || element.contains(event.target)) return
      handler(event)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler, active])
}

export default useClickOutside
