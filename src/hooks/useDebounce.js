import { useEffect, useRef, useState } from 'react'

/**
 * useDebounce — mirrors a fast-changing value (search input) with a delay.
 *   const debouncedQuery = useDebounce(query, 300)
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

/**
 * useDebouncedCallback — delays invoking a callback until events stop.
 *   const onSearch = useDebouncedCallback((q) => runSearch(q), 300)
 */
export function useDebouncedCallback(fn, delay = 300) {
  const timer = useRef(null)
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => () => clearTimeout(timer.current), [])

  return (...args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fnRef.current(...args), delay)
  }
}
