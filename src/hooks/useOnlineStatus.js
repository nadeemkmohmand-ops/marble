import { useEffect, useState } from 'react'

/**
 * useOnlineStatus — true when the browser has a network connection.
 * Powers the "آف لائن موڈ" banner in Layout.jsx (PWA hardening).
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  )

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return online
}

export default useOnlineStatus
