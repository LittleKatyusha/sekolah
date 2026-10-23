import { useState, useRef, useCallback, useEffect } from 'react'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import ImportFeedback, { ImportErrorMessage } from '../../../components/ui/ImportFeedback'
import useFileImport from '../../../hooks/useFileImport'
import { showError } from '../../../utils/sweetalert'
import { nilaiService } from '../services/nilaiService'
import { downloadNilaiTemplate } from '../utils/templateUtils'
import { Download, Upload, FileSpreadsheet } from 'lucide-react'

const MAX_SIZE_BYTES = 5 * 1024 * 1024

export const ImportNilaiModal = ({
  onClose,
  onSuccess,
  ujianId,
  kelasId,
  ujianName,
  className,
  siswaList = [],
}) => {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  const uploadFn = useCallback(
    async (fileToUpload) => {
      if (!ujianId) return { error: { message: 'Ujian wajib dipilih' } }
      return await nilaiService.importExcel({
        file: fileToUpload,
        trx_ujian_id: ujianId,
        mst_kelas_id: kelasId || undefined,
      })
    },
    [ujianId, kelasId]
  )

  const { loading, result, setResult, error, setError, handleSubmit } = useFileImport(file, uploadFn, onSuccess)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [loading, onClose])

  const handleFileChange = useCallback(
    (f) => {
      if (!f) return
      if (!f.name.match(/\.(xlsx|xls)$/i)) {
        showError('Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls).')
        return
      }
      if (f.size > MAX_SIZE_BYTES) {
        showError('Ukuran file melebihi batas 5MB.')
        return
      }
      setFile(f)
      setResult(null)
      setError('')
    },
    [setResult, setError]
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-nilai-title"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-primary-600" size={20} />
            <h2 id="import-nilai-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Import Nilai Excel
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs space-y-1">
            <p className="font-semibold text-blue-900 dark:text-blue-200">Target Ujian & Kelas:</p>
            <p className="text-blue-800 dark:text-blue-300">
              Ujian: <span className="font-medium">{ujianName || `#${ujianId}`}</span>
              {className && <> &bull; Kelas: <span className="font-medium">{className}</span></>}
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Format Template Resmi</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Sheet Data: nis, nama_siswa, nilai, keterangan</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => downloadNilaiTemplate(siswaList, ujianName, className)}
              disabled={loading}
              className="flex items-center gap-1.5 shrink-0"
            >
              <Download size={14} />
              Unduh Template
            </Button>
          </div>

          <ImportFeedback error={error} result={result} />

          {!result ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                handleFileChange(e.dataTransfer.files?.[0])
              }}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  handleFileChange(e.target.files?.[0])
                  e.target.value = ''
                }}
                className="hidden"
                data-testid="nilai-file-input"
              />
              <Upload className="mx-auto text-gray-400 dark:text-gray-500 mb-2" size={28} />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                Pilih file Excel atau seret ke sini
              </Button>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Maksimal 5 MB (.xlsx / .xls)</p>
              {file && (
                <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-200 font-medium">
                  {file.name} <span className="text-gray-500 dark:text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
                <div className="flex-1 px-4 py-3 text-center bg-green-50 dark:bg-green-900/20">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.imported}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Berhasil</p>
                </div>
                <div className="flex-1 px-4 py-3 text-center bg-red-50 dark:bg-red-900/20">
                  <p className="text-2xl font-bold text-red-500">{result.failed}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Gagal</p>
                </div>
                <div className="flex-1 px-4 py-3 text-center bg-gray-50 dark:bg-gray-700">
                  <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">{result.skipped ?? 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Dilewati</p>
                </div>
              </div>

              {result.errors?.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Baris</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">NIS</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {result.errors.map((err, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                          <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{err.row}</td>
                          <td className="px-3 py-1.5 font-mono text-gray-700 dark:text-gray-300">{err.identifier ?? '-'}</td>
                          <td className="px-3 py-1.5 text-red-600 dark:text-red-400 font-semibold">{err.code}</td>
                          <td className="px-3 py-1.5 text-red-600 dark:text-red-400">
                            <ImportErrorMessage error={err} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {result ? 'Tutup' : 'Batal'}
          </Button>
          {!result && (
            <PermissionGuard permission="nilai.create">
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!file || !ujianId || loading}
                loading={loading}
              >
                {loading ? 'Mengimpor...' : 'Import Sekarang'}
              </Button>
            </PermissionGuard>
          )}
        </div>

      </div>
    </div>
  )
}

export default ImportNilaiModal
