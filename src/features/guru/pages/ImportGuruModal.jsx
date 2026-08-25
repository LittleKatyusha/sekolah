import { useState, useRef, useCallback, useEffect } from 'react'
import * as XLSX from 'xlsx'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { showError } from '../../../utils/sweetalert'
import { guruService } from '../services/guruService'

const MAX_SIZE_BYTES = 5 * 1024 * 1024

const downloadTemplate = () => {
  const headers = [
    'nip', 'nama', 'jenis_kelamin', 'nuptk', 'nik', 'agama',
    'tanggal_lahir', 'tempat_lahir', 'alamat', 'email', 'no_hp',
    'pendidikan_terakhir', 'kode_mapel',
  ]
  const example = [
    '198501012010011001', 'Siti Aminah', 'P', '1234567890123456',
    '3201012345670001', 'Islam', '1985-01-01', 'Bandung',
    'Jl. Merdeka No. 1', 'siti@example.test', '081200000001', 'S1', 'MAT-10,FIS-10',
  ]
  const guide = [
    ['Versi template', 'template_import_guru_v1.xlsx'],
    ['Sheet wajib', 'Data — row 1 header, row 2 contoh (hapus sebelum import)'],
    ['Wajib diisi', 'nip, nama, jenis_kelamin'],
    ['nip', 'Maksimal 20 karakter, unik. Nol di depan dipertahankan.'],
    ['nama', 'Maksimal 100 karakter, tidak boleh kosong.'],
    ['jenis_kelamin', 'L atau P (atau Laki-Laki / Perempuan).'],
    ['nuptk', 'Opsional, maksimal 20 karakter, unik jika diisi.'],
    ['nik', 'Opsional, maksimal 16 karakter, unik jika diisi.'],
    ['agama', 'Opsional, contoh: Islam, Kristen, Katholik, Hindu, Buddha, Khonghucu.'],
    ['tanggal_lahir', 'Opsional, format YYYY-MM-DD (sebelum hari ini).'],
    ['tempat_lahir', 'Opsional, maksimal 50 karakter.'],
    ['alamat', 'Opsional, teks alamat.'],
    ['email', 'Opsional, format email valid, maksimal 100 karakter, unik jika diisi.'],
    ['no_hp', 'Opsional, nomor telepon/HP, maksimal 20 karakter, unik jika diisi.'],
    ['pendidikan_terakhir', 'Opsional, contoh: SD, SMP, SMA/SMK, D3/Diploma, S1/Sarjana, S2/Magister, S3/Doktor.'],
    ['kode_mapel', 'Opsional, dipisahkan koma contoh: MAT-10,FIS-10. Semua kode mapel harus sudah terdaftar.'],
    ['Duplicate policy', 'Create-only. NIP/NIK/NUPTK/email/no_hp duplikat akan gagal.'],
    ['Batas', 'Maksimal 5.000 baris data, 100 kolom, file 5 MB'],
  ]

  const ws = XLSX.utils.aoa_to_sheet([headers, example])
  ws['!cols'] = headers.map(() => ({ wch: 22 }))
  ws['!autofilter'] = { ref: 'A1:M2' }

  headers.forEach((_, colIdx) => {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: colIdx })
    if (!ws[cellAddr]) return
    ws[cellAddr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4472C4' } },
    }
  })

  const wsGuide = XLSX.utils.aoa_to_sheet(guide)
  wsGuide['!cols'] = [{ wch: 22 }, { wch: 75 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk')
  XLSX.writeFile(wb, 'template_import_guru_v1.xlsx')
}

export const ImportGuruModal = ({ onClose, onSuccess }) => {
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

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFileChange(e.dataTransfer?.files?.[0])
  }

  const handleSubmit = async () => {
    if (!file || loading) return

    setLoading(true)
    const response = await guruService.importExcel(file)
    setLoading(false)

    if (response?.error) {
      const err = response.error
      showError(err.message || 'Gagal mengimpor file Excel')
      return
    }

    const payload = response.data?.data ?? response.data
    setResult(payload)

    if (payload?.imported > 0) {
      onSuccess?.(payload)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onKeyDown={handleDialogKeyDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-guru-title"
        className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="import-guru-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            Import Data Guru
          </h2>
          <button
            ref={initialFocusRef}
            onClick={onClose}
            disabled={loading}
            aria-label="Tutup dialog import guru"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-700 dark:text-blue-300">
            <span>Gunakan template Excel standar untuk menghindari kegagalan.</span>
            <Button size="sm" variant="secondary" onClick={downloadTemplate} type="button">
              Download Template
            </Button>
          </div>

          {!result ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                data-testid="file-input"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files[0])}
              />
              <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                {file ? file.name : 'Tarik & lepas file Excel di sini, atau klik untuk memilih'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Maksimal 5MB (.xlsx / .xls)</p>
              {file && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
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
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">NIP</th>
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
            <PermissionGuard permission="guru.create">
              <Button onClick={handleSubmit} disabled={!file || loading} loading={loading}>Import</Button>
            </PermissionGuard>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImportGuruModal
