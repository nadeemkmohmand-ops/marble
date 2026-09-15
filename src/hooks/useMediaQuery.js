import { useEffect, useState } from 'react'

/**
 * useMediaQuery — reactive CSS media query.
 *   const isDesktop = useMediaQuery(MEDIA_QUERIES.lgUp)   // ≥1024px
 *   const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)
    const onChange = (event) => setMatches(event.matches)
    setMatches(mediaQueryList.matches)
    mediaQueryList.addEventListener('change', onChange)
    return () => mediaQueryList.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export default useMediaQuery
