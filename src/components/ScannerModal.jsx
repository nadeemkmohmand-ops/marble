import React, { useEffect, useRef, useState } from 'react'
import { X, CameraOff } from 'lucide-react'
import { useAppUI } from '../context/AppUIContext'
import { useLang } from '../context/LanguageContext'
import { parseScanCode } from '../utils/qr'

/**
 * Camera QR/barcode scanner (html5-qrcode, lazily imported).
 * Any page can call requestScan() from useAppUI().
 */
export default function ScannerModal() {
  const { scanState, resolveScan } = useAppUI()
  const { t } = useLang()
  const active = Boolean(scanState?.active)
  const [error, setError] = useState(null)
  const scannerRef = useRef(null)
  const elId = 'app-scanner-region'

  useEffect(() => {
    if (!active) return
    let stopped = false
    let scanner = null

    ;(async () => {
      try {
        const mod = await import('html5-qrcode')
        const Html5Qrcode = mod.Html5Qrcode
        scanner = new Html5Qrcode(elId, { verbose: false })
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          (decodedText) => {
            if (stopped) return
            stopped = true
            stopScanner().finally(() => resolveScan(decodedText))
          },
          () => { /* per-frame decode misses are normal */ },
        )
      } catch (e) {
        if (!stopped) setError(e?.message || 'camera_error')
      }
    })()

    async function stopScanner() {
      try {
        await scannerRef.current?.stop()
        scannerRef.current?.clear()
      } catch { /* noop */ }
    }

    return () => {
      if (!stopped) {
        stopped = true
        stopScanner()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  if (!active) return null

  return (
    <div className="fixed inset-0 z-[88] bg-black/80 grid place-items-center p-4" dir="ltr">
      <div className="card w-full max-w-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Scan QR / Barcode</h3>
          <button onClick={() => resolveScan(null)} className="btn btn-ghost h-8 w-8 justify-center" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {error ? (
          <div className="py-10 text-center text-sm text-[var(--muted)] flex flex-col items-center gap-2">
            <CameraOff size={28} />
            <p>{t('scanner.cameraError')}</p>
            <button className="btn btn-secondary min-h-9 px-4 text-xs" onClick={() => resolveScan(null)}>
              {t('common.close')}
            </button>
          </div>
        ) : (
          <>
            <div id={elId} className="rounded-xl overflow-hidden bg-black min-h-[230px]" />
            <p className="text-[11px] text-[var(--muted)] mt-2 text-center">{t('scanner.hint')}</p>
          </>
        )}
      </div>
    </div>
  )
}

export { parseScanCode }
