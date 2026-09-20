import { useEffect, useState } from 'react'
import { BREAKPOINTS } from '../constants/breakpoints'

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export const useMinWidth = (bp) => useMediaQuery(`(min-width: ${BREAKPOINTS[bp] || bp}px)`)
export const useMaxWidth = (bp) => useMediaQuery(`(max-width: ${BREAKPOINTS[bp] || bp}px)`)

export default useMediaQuery
