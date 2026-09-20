import { useCallback, useEffect, useState } from 'react'
import { db } from '../services/db'

/**
 * useCollection('slabs') → reactive CRUD access to any collection.
 * Re-renders automatically when the collection changes anywhere in
 * the app (db event bus) — including after backup restore.
 */
export function useCollection(name) {
  const [items, setItems] = useState(() => db.list(name))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setItems(db.list(name))
    return db.onChange((collection) => {
      if (collection === name) setItems(db.list(name))
    })
  }, [name])

  const add = useCallback((data) => db.save(name, data), [name])
  const update = useCallback((id, data) => db.save(name, { ...data, id }), [name])
  const remove = useCallback((id) => db.remove(name, id), [name])
  const getById = useCallback((id) => db.get(name, id), [name])

  return { items, loading, add, update, remove, getById }
}

export default useCollection
