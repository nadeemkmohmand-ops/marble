import { useCallback, useEffect, useState } from 'react'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { storage } from '../utils/storage'

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => storage.get(key, initial))
  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        storage.set(key, resolved)
        return resolved
      })
    },
    [key],
  )
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === key) setValue(storage.get(key, initial))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return [value, set]
}

export default useLocalStorage
