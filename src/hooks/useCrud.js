import { useCallback, useState } from 'react'
import { useCollection } from './useCollection'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LanguageContext'

/**
 * Form state machine used by CrudPage:
 * open(add) · openEdit(record) · save() · remove(record)
 */
export function useCrud(collection, { onSaved } = {}) {
  const { add, update, remove } = useCollection(collection)
  const toast = useToast()
  const { t } = useLang()
  const [form, setForm] = useState(null) // null = closed
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const openAdd = useCallback((defaults = {}) => {
    setEditingId(null)
    setForm({ ...defaults })
  }, [])

  const openEdit = useCallback((record) => {
    setEditingId(record.id)
    setForm({ ...record })
  }, [])

  const close = useCallback(() => {
    setForm(null)
    setEditingId(null)
  }, [])

  const setField = useCallback((key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
  }, [])

  const save = useCallback(
    async (prepared) => {
      if (!form) return null
      setSaving(true)
      try {
        const payload = { ...form, ...(prepared || {}) }
        const rec = editingId ? update(editingId, payload) : add(payload)
        toast.success(t('common.saved'))
        close()
        onSaved?.(rec, editingId ? 'update' : 'add')
        return rec
      } catch (e) {
        toast.error(e?.message || t('common.error'))
        return null
      } finally {
        setSaving(false)
      }
    },
    [form, editingId, add, update, toast, t, close, onSaved],
  )

  const destroy = useCallback(
    async (record) => {
      remove(record.id)
      toast.success(t('common.deleted'))
    },
    [remove, toast, t],
  )

  return {
    form,
    editingId,
    saving,
    openAdd,
    openEdit,
    close,
    setField,
    setForm,
    save,
    destroy,
    isOpen: Boolean(form),
  }
}

export default useCrud
