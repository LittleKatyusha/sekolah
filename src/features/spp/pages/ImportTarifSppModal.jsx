import { useState, useRef, useCallback, useEffect } from 'react'
import * as XLSX from 'xlsx'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { showError } from '../../../utils/sweetalert'
import { tarifSppService } from '../services/sppService'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

const downloadTemplate = () => {
  const headers = ['nama_kelas', 'kode_tahun_ajaran', 'nominal', 'keterangan']
  const example = ['X MIPA 1', '2026-2027', '350000', 'SPP bulanan kelas X']
  const guide = [
    ['Versi template', 'template_import_tarif_spp_v1.xlsx'],
    ['Sheet wajib', 'Data — row 1 header, row 2 contoh (hapus sebelum import)'],
    ['Wajib diisi', 'nama_kelas, kode_tahun_ajaran, nominal'],
    ['Natural key', 'nama_kelas dan kode_tahun_ajaran harus sudah terdaftar dan saling sesuai.'],
    ['nominal', 'Angka non-negatif, maksimal 2 desimal, tanpa pemisah ribuan.'],
    ['keterangan', 'Opsional, maksimal 255 karakter.'],
    ['Duplicate', 'Kombinasi kelas dan tahun ajaran yang sudah terdaftar akan gagal (create-only).'],
    ['Batas', 'Maksimal 5.000 baris data, 100 kolom, file 5 MB'],
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, example])
  ws['!cols'] = headers.map(() => ({ wch: 25 }))
  ws['!autofilter'] = { ref: 'A1:D2' }

  headers.forEach((_, colIdx) => {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: colIdx })
    if (!ws[cellAddr]) return
    ws[cellAddr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4472C4' } },
    }
  })

  const wsGuide = XLSX.utils.aoa_to_sheet(guide)
  wsGuide['!cols'] = [{ wch: 20 }, { wch: 70 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk')
  XLSX.writeFile(wb, 'template_import_tarif_spp_v1.xlsx')
}

export const ImportTarifSppModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const fileInputRef = useRef(null)
  const dialogRef = useRef(null)
  const initialFocusRef = useRef(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement
    initialFocusRef.current?.focus()

    return () => previouslyFocused?.focus?.()
  }, [])

  const handleDialogKeyDown = (event) => {
    if (event.key === 'Escape' && !loading) {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key !== 'Tab') return

    const focusable = [...dialogRef.current.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    )]
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const handleFileChange = useCallback((selectedFile) => {
    if (!selectedFile) return
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      showError('Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls).')
      return
    }
    if (selectedFile.size > MAX_SIZE_BYTES) {
      showError('Ukuran file melebihi batas 5MB.')
      return
    }
    setFile(selectedFile)
    setResult(null)
  }, [])

  const handleInputChange = (e) => {
    handleFileChange(e.target.files?.[0])
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFileChange(e.dataTransfer.files?.[0])
  }

  const handleSubmit = async () => {
    if (!file || loading) return

    setLoading(true)
    const { data, error } = await tarifSppService.importExcel(file)
    setLoading(false)

    if (error) {
      showError(error?.message || 'Gagal mengimpor data tarif SPP.')
      return
    }

    setResult(data?.data || data)
    if ((data?.data?.imported ?? data?.imported ?? 0) > 0) {
      onSuccess?.()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-mapel-title"
        onKeyDown={handleDialogKeyDown}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="import-mapel-title" className="text-lg font-semibold text-gray-900 dark:text-white">Import Data Tarif SPP</h2>
          <button
            ref={initialFocusRef}
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={downloadTemplate}>
              Unduh Template
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">Maksimal 5 MB (.xlsx / .xls)</p>
          </div>

          {!result ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleInputChange}
                className="hidden"
                data-testid="file-input"
              />
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                Pilih file Excel atau seret ke sini
              </Button>
              {file && (
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                  {file.name} <span className="text-gray-500 dark:text-gray-400">{`${(file.size / 1024).toFixed(1)} KB`}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
                <div className="flex-1 px-4 py-3 text-center bg-green-50 dark:bg-green-900/20">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.imported}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Berhasil</p>
                </div>
                <div className="flex-1 px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-red-500">{result.failed}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gagal</p>
                </div>
                <div className="flex-1 px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">{result.skipped ?? 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Dilewati</p>
                </div>
              </div>

              {result.errors?.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Baris</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Target</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Tipe</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {result.errors.map((err, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{err.row}</td>
                          <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{err.identifier ?? '-'}</td>
                          <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{err.code}</td>
                          <td className="px-3 py-1.5 text-red-600 dark:text-red-400">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.errors_truncated && (
                    <p className="px-3 py-2 text-xs text-amber-600 dark:text-amber-400">Hanya 100 error pertama yang ditampilkan.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose} disabled={loading}>{result ? 'Tutup' : 'Batal'}</Button>
          {!result && (
            <PermissionGuard permission="tarif-spp.create">
              <Button onClick={handleSubmit} disabled={!file || loading} loading={loading}>Import</Button>
            </PermissionGuard>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImportTarifSppModal

