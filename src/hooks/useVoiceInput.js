import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * useVoiceInput — Web Speech API dictation for search boxes & notes.
 * Zero dependencies; degrades gracefully (enabled=false everywhere the
 * browser has no SpeechRecognition — e.g. Firefox, iOS Safari < 14.5).
 *
 * const voice = useVoiceInput({ lang: 'en-US' | 'ur-PK' })
 * voice.start() / voice.stop() / voice.enabled / voice.listening / voice.text
 */
export function useVoiceInput({ lang = 'en-US', continuous = false } = {}) {
  const [listening, setListening] = useState(false)
  const [text, setText] = useState('')
  const recRef = useRef(null)
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => {
    return () => {
      try { recRef.current?.stop() } catch { /* unmounted */ }
    }
  }, [])

  const start = useCallback(() => {
    if (!SR || listening) return
    try {
      const rec = new SR()
      rec.lang = lang
      rec.continuous = continuous
      rec.interimResults = true
      rec.onresult = (e) => {
        let out = ''
        for (let i = 0; i < e.results.length; i += 1) out += e.results[i][0].transcript
        setText(out)
      }
      rec.onend = () => setListening(false)
      rec.onerror = () => setListening(false)
      recRef.current = rec
      setText('')
      rec.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }, [SR, lang, continuous, listening])

  const stop = useCallback(() => {
    try { recRef.current?.stop() } catch { /* already stopped */ }
    setListening(false)
  }, [])

  return { enabled: Boolean(SR), listening, text, start, stop, reset: () => setText('') }
}

export default useVoiceInput
