import { useState, useEffect, useRef } from 'react'
import { X, Printer, Download, RefreshCw, FileText, ExternalLink } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { reportService } from '../../../services/reportService'
import { showError, showSuccess } from '../../../utils/sweetalert'

const SklPreviewModal = ({ isOpen, onClose, siswaId, siswaNama }) => {
  const [htmlContent, setHtmlContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const iframeRef = useRef(null)

  const fetchPreview = async () => {
    if (!siswaId) return
    setLoading(true)
    setFetchError(null)
    try {
      const { data, error } = await reportService.preview({
        report_path: '/reports/akademik/skl_siswa',
        parameters: { siswa_id: siswaId },
      })
      if (error) setFetchError(error.message || 'Gagal memuat preview')
      else if (data?.html) setHtmlContent(data.html)
      else setFetchError('Tidak ada data HTML')
    } catch {
      setFetchError('Gagal memuat preview')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && siswaId) fetchPreview()
    else {
      setHtmlContent('')
      setFetchError(null)
    }
  }, [isOpen, siswaId])

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus()
      iframeRef.current.contentWindow.print()
    } else {
      window.print()
    }
  }

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true)
    try {
      const { error } = await reportService.generateAndDownload({
        report_path: '/reports/akademik/skl_siswa',
        parameters: { siswa_id: siswaId },
        format: 'pdf',
      })
      if (error) showError(error.message || 'Gagal unduh PDF')
      else showSuccess('PDF SKL berhasil diunduh!')
    } catch {
      showError('Gagal unduh PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleOpenTab = () => {
    if (!htmlContent) return
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(htmlContent)
      win.document.close()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <FileText size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">Preview Surat Keterangan Lulus (SKL)</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Siswa: <span className="font-semibold text-gray-700 dark:text-gray-300">{siswaNama || '-'}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleOpenTab} disabled={loading || !htmlContent} className="hidden sm:inline-flex">
              <ExternalLink size={15} className="mr-1.5" />Tab Baru
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handlePrint} disabled={loading || !htmlContent}>
              <Printer size={15} className="mr-1.5 text-indigo-600" /><span className="hidden sm:inline">Cetak</span>
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleDownloadPdf} loading={downloadingPdf} disabled={loading}>
              <Download size={15} className="mr-1.5" /><span className="hidden sm:inline">Unduh PDF</span>
            </Button>
            <button type="button" onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 ml-1" aria-label="Tutup">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-slate-100 dark:bg-gray-950 p-2 sm:p-4 overflow-hidden relative flex flex-col items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Memuat tampilan SKL...</p>
            </div>
          )}
          {!loading && fetchError && (
            <div className="text-center max-w-md p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-red-200 dark:border-red-900/40">
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">{fetchError}</p>
              <Button type="button" variant="outline" size="sm" onClick={fetchPreview}>
                <RefreshCw size={14} className="mr-1.5" />Coba Lagi
              </Button>
            </div>
          )}
          {!loading && !fetchError && htmlContent && (
            <div className="w-full h-full bg-white dark:bg-white rounded-xl shadow-inner overflow-hidden border border-gray-200 dark:border-gray-800">
              <iframe
                ref={iframeRef}
                srcDoc={htmlContent}
                title="Preview SKL Siswa"
                className="w-full h-full border-0"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SklPreviewModal
