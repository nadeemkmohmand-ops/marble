import React, { useEffect } from 'react'
import { Search, X, Mic } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import { useLang } from '../../context/LanguageContext'

/**
 * SearchInput with optional voice dictation (Web Speech API).
 * The mic button only appears where the browser supports it; dictation
 * writes straight into the search box (works in English & Urdu).
 */
export default function SearchInput({ value, onChange, placeholder, className }) {
  const { lang } = useLang()
  const voice = useVoiceInput({ lang: lang === 'ur' ? 'ur-PK' : 'en-US' })

  useEffect(() => {
    if (voice.enabled && voice.text) onChange(voice.text)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.text])

  return (
    <div className={cn('relative flex-1 min-w-[10rem]', className)}>
      <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
      <input
        className="input ps-9 pe-16"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {voice.enabled && (
        <button
          onClick={() => (voice.listening ? voice.stop() : voice.start())}
          className={cn(
            'absolute end-8 top-1/2 -translate-y-1/2 transition',
            voice.listening ? 'text-red-500 animate-pulse' : 'text-[var(--muted)] hover:text-[var(--text)]',
          )}
          aria-label="Voice search"
          type="button"
        >
          <Mic size={14} />
        </button>
      )}
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute end-2 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
          aria-label="Clear"
          type="button"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
