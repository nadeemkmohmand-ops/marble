import React from 'react'
import { AlertOctagon } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'

export default function ErrorState({ message, onRetry }) {
  const { t } = useLang()
  return (
    <div className="py-12 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-red-500/15 text-red-500 grid place-items-center">
        <AlertOctagon size={24} />
      </div>
      <p className="mt-3 text-sm font-medium">{message || t('common.error')}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary min-h-9 px-4 text-sm mt-3">
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}
