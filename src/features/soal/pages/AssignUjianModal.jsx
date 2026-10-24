import { useState, useEffect, useMemo, useCallback } from 'react'
import { BookOpen, X, AlertCircle } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { soalService } from '../services/soalService'
import { ujianService } from '../../ujian/services/ujianService'

export const AssignUjianModal = ({ open, onClose, selectedSoals = [], onSuccess }) => {
  const [selectedUjianId, setSelectedUjianId] = useState('')
  const [ujianList, setUjianList] = useState([])
  const [loadingUjian, setLoadingUjian] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const distinctMapelIds = useMemo(() => {
    const ids = new Set(selectedSoals.map((s) => s.mst_mapel_id).filter(Boolean))
    return Array.from(ids)
  }, [selectedSoals])

  const hasMixedMapel = distinctMapelIds.length > 1
  const targetMapelId = distinctMapelIds.length === 1 ? distinctMapelIds[0] : null

  const targetMapelName = useMemo(() => {
    if (selectedSoals.length === 0) return '-'
    const first = selectedSoals[0]
    return first.mapel?.nama || first.mapel?.nama_mapel || '-'
  }, [selectedSoals])

  useEffect(() => {
    if (!open) return
    let isMounted = true
    const loadUjian = async () => {
      setLoadingUjian(true)
      const { data } = await ujianService.getAll({ per_page: 200 })
      if (isMounted && data?.data) {
        setUjianList(data.data)
      }
      if (isMounted) setLoadingUjian(false)
    }
    loadUjian()
    return () => {
      isMounted = false
    }
  }, [open])

  const filteredUjianList = useMemo(() => {
    if (!targetMapelId) return ujianList
    return ujianList.filter((u) => u.mst_mapel_id === targetMapelId)
  }, [ujianList, targetMapelId])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!selectedUjianId) {
      showError('Pilih ujian tujuan terlebih dahulu')
      return
    }
    if (hasMixedMapel) {
      showError('Semua soal yang ditugaskan harus berasal dari mata pelajaran yang sama')
      return
    }

    setSubmitting(true)
    const soalIds = selectedSoals.map((s) => s.id)
    const { data, error } = await soalService.batchAssignUjian(selectedUjianId, soalIds)

    setSubmitting(false)
    if (error) {
      showError(error.message || 'Gagal menambahkan soal ke ujian')
      return
    }

    const assignedCount = data?.data?.assigned_count ?? soalIds.length
    showSuccess(`${assignedCount} soal berhasil ditambahkan ke ujian!`)
    onSuccess?.()
    onClose()
  }, [selectedUjianId, hasMixedMapel, selectedSoals, onSuccess, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-ujian-title"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <BookOpen className="text-primary-600 dark:text-primary-400" size={20} />
            <h2 id="assign-ujian-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Tambahkan Soal ke Ujian
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-blue-900 dark:text-blue-200">
                {selectedSoals.length} soal dipilih
              </p>
              {!hasMixedMapel && targetMapelName !== '-' && (
                <p className="text-blue-800 dark:text-blue-300">
                  Mata Pelajaran: <span className="font-medium">{targetMapelName}</span>
                </p>
              )}
            </div>

            {hasMixedMapel && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs flex items-start gap-2 text-red-800 dark:text-red-300">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <p>
                  Soal yang dipilih memiliki mata pelajaran yang berbeda. Silakan pilih soal dari mata pelajaran yang sama sebelum menambahkan ke ujian.
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="target_trx_ujian_id"
                className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
              >
                Pilih Ujian Tujuan <span className="text-red-500">*</span>
              </label>
              <select
                id="target_trx_ujian_id"
                value={selectedUjianId}
                onChange={(e) => setSelectedUjianId(e.target.value)}
                disabled={submitting || loadingUjian || hasMixedMapel}
                className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                required
              >
                <option value="">-- Pilih Ujian --</option>
                {filteredUjianList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nama || `Ujian #${u.id}`} {u.kelas?.nama_kelas ? `(${u.kelas.nama_kelas})` : ''} - {u.mapel?.nama || u.mapel?.nama_mapel || ''}
                  </option>
                ))}
              </select>
              {filteredUjianList.length === 0 && !loadingUjian && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Tidak ada ujian yang cocok untuk mata pelajaran ini.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting || !selectedUjianId || hasMixedMapel}
              className="flex items-center gap-2"
            >
              {submitting ? 'Menyimpan...' : 'Tugaskan ke Ujian'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AssignUjianModal

