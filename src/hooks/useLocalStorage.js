import { useCallback, useState } from 'react'
import { storageGet, storageRemove, storageSet } from '../utils/storage.js'

/**
 * useLocalStorage — state persisted to localStorage (JSON by default).
 *
 *   const [draft, setDraft] = useLocalStorage('mfa-draft', { note: '' })
 *   const [token, setToken] = useLocalStorage('mfa-token', '', { json: false })
 *
 * Returns [value, setValue, remove]. `setValue` accepts a value or updater
 * function, exactly like useState.
 */
export function useLocalStorage(key, initialValue, options = {}) {
  const [value, setValue] = useState(() => {
    const stored = storageGet(key, undefined, options)
    return stored === undefined ? initialValue : stored
  })

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        storageSet(key, resolved, options)
        return resolved
      })
    },
    // options object is expected to be stable at call sites
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  )

  const remove = useCallback(() => {
    storageRemove(key)
    setValue(initialValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [value, set, remove]
}

export default useLocalStorage
