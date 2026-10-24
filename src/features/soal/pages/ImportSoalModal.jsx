import { useState, useRef, useCallback, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { Download, Upload, FileSpreadsheet, X } from 'lucide-react'
import useFileImport from '../../../hooks/useFileImport'
import ImportFeedback from '../../../components/ui/ImportFeedback'
import Button from '../../../components/ui/Button'
import { showError } from '../../../utils/sweetalert'
import { soalService } from '../services/soalService'
import { mapelService } from '../../mapel/services/mapelService'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export const downloadSoalTemplate = () => {
  const headers = [
    'pertanyaan',
    'tipe',
    'tingkat_kesulitan',
    'opsi_a',
    'opsi_b',
    'opsi_c',
    'opsi_d',
    'opsi_e',
    'kunci_jawaban',
    'kode_mapel',
  ]

  const exampleRows = [
    ['Berapakah hasil dari 5 x 5?', '1', '1', '10', '20', '25', '30', '', 'C', 'MAT-10'],
    ['Jelaskan proses fotosintesis pada tumbuhan hijau!', '2', '2', '', '', '', '', '', '', 'BIO-10'],
  ]

  const guide = [
    ['Versi template', 'template_import_bank_soal_v1.xlsx'],
    ['Sheet wajib', 'Data — baris 1 header, baris 2-3 contoh (hapus atau ganti dengan soal Anda)'],
    ['Wajib diisi', 'pertanyaan'],
    ['pertanyaan', 'Teks lengkap pertanyaan/soal ujian.'],
    ['tipe', '1 = Pilihan Ganda (PG), 2 = Essay / Esai (default: 1)'],
    ['tingkat_kesulitan', '1 = Mudah, 2 = Sedang, 3 = Sulit (default: 2)'],
    ['opsi_a s/d opsi_e', 'Untuk pilihan ganda: teks opsi. Minimal opsi_a dan opsi_b terisi.'],
    ['kunci_jawaban', 'Untuk pilihan ganda: huruf kunci jawaban (A, B, C, D, atau E).'],
    ['kode_mapel', 'Kode mapel (misal: MAT-10). Opsional jika memilih mata pelajaran pada form modal saat import.'],
    ['Batas', 'Maksimal 5.000 baris data, file maksimal 5 MB.'],
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows])
  ws['!cols'] = [
    { wch: 40 }, { wch: 10 }, { wch: 16 }, { wch: 25 }, { wch: 25 },
    { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 14 }, { wch: 14 },
  ]
  ws['!autofilter'] = { ref: 'A1:J3' }

  const wsGuide = XLSX.utils.aoa_to_sheet(guide)
  wsGuide['!cols'] = [{ wch: 20 }, { wch: 80 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk')
  XLSX.writeFile(wb, 'template_import_bank_soal_v1.xlsx')
}

export const ImportSoalModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedMapelId, setSelectedMapelId] = useState('')
  const [mapelOptions, setMapelOptions] = useState([])
  const [loadingMapel, setLoadingMapel] = useState(false)

  const fileInputRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    const loadMapel = async () => {
      setLoadingMapel(true)
      const { data } = await mapelService.getMapel({ per_page: 200 })
      if (isMounted && data?.data) {
        setMapelOptions(data.data)
      }
      if (isMounted) setLoadingMapel(false)
    }
    loadMapel()
    return () => {
      isMounted = false
    }
  }, [])

  const uploadFn = useCallback(
    async (fileToUpload) => {
      const formData = new FormData()
      formData.append('file', fileToUpload)
      if (selectedMapelId) {
        formData.append('mst_mapel_id', selectedMapelId)
      }
      return await soalService.importSoal(formData)
    },
    [selectedMapelId]
  )

  const { loading, result, setResult, error, setError, handleSubmit } = useFileImport(
    file,
    uploadFn,
    onSuccess
  )

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose()
      }
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

  const handleInputChange = (e) => {
    handleFileChange(e.target.files?.[0])
    e.target.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFileChange(e.dataTransfer.files?.[0])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-soal-title"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="text-primary-600 dark:text-primary-400" size={20} />
            <h2 id="import-soal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Import Bank Soal
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label
              htmlFor="mst_mapel_id"
              className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
            >
              Mata Pelajaran (Opsional jika ada di file)
            </label>
            <select
              id="mst_mapel_id"
              value={selectedMapelId}
              onChange={(e) => setSelectedMapelId(e.target.value)}
              disabled={loading || loadingMapel}
              className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="">-- Gunakan kode_mapel dari Excel --</option>
              {mapelOptions.map((mapel) => (
                <option key={mapel.id} value={mapel.id}>
                  {mapel.nama || mapel.nama_mapel} ({mapel.kode_mapel || mapel.kode})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Template Excel Resmi</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Kolom: pertanyaan, tipe, tingkat_kesulitan, opsi_a-e, kunci_jawaban, kode_mapel
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={downloadSoalTemplate}
              disabled={loading}
              className="flex items-center gap-1.5 shrink-0"
            >
              <Download size={14} />
              Unduh
            </Button>
          </div>

          <ImportFeedback error={error} result={result} />

          {!result ? (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleInputChange}
                className="hidden"
                disabled={loading}
              />
              <Upload className="mx-auto text-gray-400 mb-2" size={28} />
              {file ? (
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Tarik file ke sini, atau <span className="text-primary-600 font-medium">pilih file</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Format .xlsx atau .xls, maksimal 5MB</p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {result ? 'Tutup' : 'Batal'}
          </Button>
          {!result && (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!file || loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Mengimpor...
                </>
              ) : (
                'Mulai Import'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImportSoalModal

