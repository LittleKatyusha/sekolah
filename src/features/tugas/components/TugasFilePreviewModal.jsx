import { useState, useEffect, useCallback } from 'react'
import { X, RotateCw, RotateCcw, ZoomIn, ZoomOut, Download, FileText, Image as ImageIcon, ExternalLink, RefreshCw } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { isImageFile, isPdfFile, getFileName, resolveFileUrl, openAttachment } from '../utils/tugasFileUtils'

export const TugasFilePreviewModal = ({
  isOpen,
  onClose,
  filePath,
  fileUrl,
  title = 'Pratinjau Berkas',
  subtitle = '',
}) => {
  const [resolvedUrl, setResolvedUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)

  const candidate = fileUrl || filePath || ''
  const isImage = isImageFile(candidate)
  const isPdf = isPdfFile(candidate)
  const fileName = getFileName(candidate)

  useEffect(() => {
    if (!isOpen || (!filePath && !fileUrl)) {
      setResolvedUrl('')
      setRotation(0)
      setZoom(1)
      return
    }
    let isMounted = true
    setLoading(true)
    setRotation(0)
    setZoom(1)
    resolveFileUrl(filePath, fileUrl)
      .then((url) => { if (isMounted) setResolvedUrl(url) })
      .finally(() => { if (isMounted) setLoading(false) })
    return () => { isMounted = false }
  }, [isOpen, filePath, fileUrl])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose?.()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] border border-gray-200 dark:border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/80 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              {isImage ? <ImageIcon size={18} /> : <FileText size={18} />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle || fileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isImage && (
              <>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                  className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Putar Kiri 90°"
                  aria-label="Putar Kiri 90°"
                >
                  <RotateCcw size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Putar Kanan 90°"
                  aria-label="Putar Kanan 90°"
                >
                  <RotateCw size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                  disabled={zoom <= 0.5}
                  className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40"
                  title="Perkecil"
                >
                  <ZoomOut size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))))}
                  disabled={zoom >= 2.5}
                  className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40"
                  title="Perbesar"
                >
                  <ZoomIn size={17} />
                </button>
                {(rotation !== 0 || zoom !== 1) && (
                  <button
                    type="button"
                    onClick={() => { setRotation(0); setZoom(1) }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                    title="Reset rotasi"
                  >
                    <RefreshCw size={12} />
                    <span>Reset</span>
                  </button>
                )}
                {rotation !== 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 font-mono font-medium">
                    {rotation}°
                  </span>
                )}
                <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
              </>
            )}
            <button
              type="button"
              onClick={() => openAttachment(filePath, fileUrl)}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Unduh / Tab Baru"
              aria-label="Unduh / Tab Baru"
            >
              <Download size={17} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Tutup"
              aria-label="Tutup"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100/70 dark:bg-gray-900/60 min-h-[360px] max-h-[72vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-primary-600" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Memuat berkas...</p>
            </div>
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
              <img
                src={resolvedUrl || candidate}
                alt={title}
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: 'center center',
                  maxHeight: rotation % 180 !== 0 ? 'min(52vh, 480px)' : '65vh',
                  maxWidth: rotation % 180 !== 0 ? 'min(52vh, 480px)' : '100%',
                }}
                className="object-contain transition-transform duration-200 ease-out select-none shadow-md rounded"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={resolvedUrl || candidate}
              title={title}
              className="w-full h-[68vh] rounded-lg border border-gray-200 dark:border-gray-700 bg-white"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-4">
                <FileText size={32} />
              </div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{fileName}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Format berkas tidak mendukung pratinjau langsung di peramban.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openAttachment(filePath, fileUrl)}
                className="inline-flex items-center gap-2"
              >
                <Download size={15} />
                <span>Unduh / Buka Berkas</span>
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
          <div>
            {isImage && (
              <span className="hidden sm:inline">
                Tips: Gunakan tombol putar (<RotateCw size={12} className="inline mx-0.5" />) jika foto terbalik.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openAttachment(filePath, fileUrl)}
              className="inline-flex items-center gap-1.5"
            >
              <ExternalLink size={14} />
              <span>Buka di Tab Baru</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TugasFilePreviewModal

