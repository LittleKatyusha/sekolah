import { useState, useEffect } from 'react'
import { Sparkles, X, AlertCircle, Loader2 } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { rankingService } from '../services/rankingService'
import { kelasService } from '../../kelas/services/kelasService'
import { semesterService } from '../../semester/services/semesterService'
import { showSuccess, showError, showWarning } from '../../../utils/sweetalert'

export const GenerateRankingModal = ({ isOpen, onClose, onSuccess }) => {
  const [kelasOptions, setKelasOptions] = useState([])
  const [semesterOptions, setSemesterOptions] = useState([])
  const [selectedKelasId, setSelectedKelasId] = useState('all')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setSelectedKelasId('all')
      setSelectedSemesterId('')
      setErrorMsg('')
      return
    }

    const fetchOptions = async () => {
      setLoadingOptions(true)
      setErrorMsg('')
      try {
        const [kelasRes, semesterRes] = await Promise.all([
          kelasService.getAll({ per_page: 100 }),
          semesterService.getAll({ per_page: 100 }),
        ])
        const kelasList = kelasRes.data?.data || kelasRes.data || []
        const parsedKelas = Array.isArray(kelasList) ? kelasList : (kelasList?.data || [])
        setKelasOptions(parsedKelas.map((k) => ({
          value: String(k.id),
          label: k.nama_kelas || `Kelas #${k.id}`,
        })))

        const semesterList = semesterRes.data?.data || semesterRes.data || []
        const parsedSem = Array.isArray(semesterList) ? semesterList : (semesterList?.data || [])
        setSemesterOptions(parsedSem.map((s) => ({
          value: String(s.id),
          label: s.nama || (s.tahun_ajaran ? `${s.nama || 'Semester'} (${s.tahun_ajaran.nama})` : `Semester #${s.id}`),
          isActive: Boolean(s.is_active),
        })))

        const activeSem = parsedSem.find((s) => s.is_active)
        if (activeSem) setSelectedSemesterId(String(activeSem.id))
        else if (parsedSem.length > 0) setSelectedSemesterId(String(parsedSem[0].id))
      } catch (err) {
        console.error(err)
        setErrorMsg('Gagal memuat opsi kelas atau semester')
      } finally {
        setLoadingOptions(false)
      }
    }
    fetchOptions()
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSemesterId) {
      setErrorMsg('Pilih semester terlebih dahulu')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    const payload = {
      semester: parseInt(selectedSemesterId, 10),
    }

    if (selectedKelasId && selectedKelasId !== 'all') {
      payload.kelas_id = parseInt(selectedKelasId, 10)
    }

    const { data, error } = await rankingService.generate(payload)

    setSubmitting(false)
    if (error) {
      const msg = error.message || error.errors?.message || 'Gagal generate ranking siswa'
      setErrorMsg(msg)
      showError(msg)
      return
    }

    const results = data?.data
    let totalGenerated = 0
    if (Array.isArray(results)) {
      if (results.length > 0 && typeof results[0]?.peringkat_dibuat === 'number') {
        totalGenerated = results.reduce((sum, item) => sum + (item.peringkat_dibuat || 0), 0)
      } else {
        totalGenerated = results.length
      }
    }

    if (totalGenerated === 0) {
      showWarning(data?.message || 'Tidak ada data rapor pada semester/kelas yang dipilih. Silakan generate rapor terlebih dahulu di menu Rapor.')
    } else {
      showSuccess(data?.message || 'Ranking siswa berhasil di-generate secara otomatis!')
    }

    onSuccess?.(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-ranking-title"
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary-600 dark:text-primary-400" size={20} />
            <h2 id="generate-ranking-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Generate Ranking Siswa
            </h2>
          </div>
          <button
            type="button"
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
            <p className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300">
              Sistem menghitung peringkat secara otomatis berdasarkan rata-rata nilai rapor akhir dengan aturan competition ranking.
            </p>

            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs flex items-start gap-2 text-red-800 dark:text-red-300">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <p>{errorMsg}</p>
              </div>
            )}

            {loadingOptions ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="animate-spin" size={24} />
                <span>Memuat data kelas & semester...</span>
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="generate-ranking-kelas" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Kelas
                  </label>
                  <select
                    id="generate-ranking-kelas"
                    value={selectedKelasId}
                    onChange={(e) => setSelectedKelasId(e.target.value)}
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    <option value="all">Semua Kelas</option>
                    {kelasOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="generate-ranking-semester" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="generate-ranking-semester"
                    value={selectedSemesterId}
                    onChange={(e) => setSelectedSemesterId(e.target.value)}
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    <option value="">Pilih semester</option>
                    {semesterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} {opt.isActive ? '(Aktif)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/40 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting || loadingOptions || !selectedSemesterId}>
              {submitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Memproses...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Generate Sekarang
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GenerateRankingModal
