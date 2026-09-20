import React, { useRef } from 'react'
import { Camera, Trash2, ImagePlus } from 'lucide-react'

/**
 * PhotoInput — camera/gallery capture with client-side compression
 * (max 1024px, JPEG q0.7 ≈ 60–120KB) so records stay small enough
 * for offline device storage and Supabase rows.
 */
export default function PhotoInput({ photos = [], onChange, max = 6 }) {
  const inputRef = useRef(null)

  async function handleFiles(fileList) {
    const files = [...fileList].slice(0, max - photos.length)
    const compressed = await Promise.all(files.map(compress))
    onChange([...photos, ...compressed.filter(Boolean)])
  }

  async function compress(file) {
    if (!file?.type?.startsWith('image/')) return null
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/jpeg', 0.7)
    } catch {
      return null
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {photos.map((src, i) => (
          <div key={i} className="relative group">
            <img src={src} alt={`photo ${i + 1}`} className="h-16 w-16 object-cover rounded-lg border border-[var(--border)]" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute -top-1.5 -end-1.5 h-5 w-5 rounded-full bg-danger text-white grid place-items-center"
              aria-label="Remove photo"
            >
              <Trash2 size={10} />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="h-16 w-16 rounded-lg border-2 border-dashed border-[var(--border)] grid place-items-center text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            aria-label="Add photo"
          >
            <span className="flex flex-col items-center gap-0.5">
              <Camera size={16} />
              <ImagePlus size={10} />
            </span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
