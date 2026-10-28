import { useState, useEffect } from 'react'
import { Sparkles, X, AlertCircle, Loader2 } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { raporService } from '../services/raporService'
import { kelasService } from '../../kelas/services/kelasService'
import { semesterService } from '../../semester/services/semesterService'
import { showSuccess, showError } from '../../../utils/sweetalert'

export const GenerateRaporKelasModal = ({ isOpen, onClose, onSuccess }) => {
  const [kelasOptions, setKelasOptions] = useState([])
  const [semesterOptions, setSemesterOptions] = useState([])
  const [selectedKelasId, setSelectedKelasId] = useState('')
  const [selectedSemesterId, setSelectedSemesterId] = useState('')
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setSelectedKelasId('')
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
        setKelasOptions(kelasList.map(k => ({ value: String(k.id), label: k.nama_kelas || `Kelas #${k.id}` })))

        const semesterList = semesterRes.data?.data || semesterRes.data || []
        setSemesterOptions(semesterList.map(s => ({
          value: String(s.id),
          label: s.nama || (s.tahun_ajaran ? `${s.nama || 'Semester'} (${s.tahun_ajaran.nama})` : `Semester #${s.id}`),
          isActive: Boolean(s.is_active),
        })))

        const activeSem = semesterList.find(s => s.is_active)
        if (activeSem) setSelectedSemesterId(String(activeSem.id))
        else if (semesterList.length > 0) setSelectedSemesterId(String(semesterList[0].id))
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
    if (!selectedKelasId || !selectedSemesterId) {
      setErrorMsg('Pilih kelas dan semester terlebih dahulu')
      return
    }

    setSubmitting(true)
    setErrorMsg('')
    const { data, error } = await raporService.generateKelas({
      kelas_id: parseInt(selectedKelasId, 10),
      semester: parseInt(selectedSemesterId, 10),
    })

    setSubmitting(false)
    if (error) {
      const msg = error.message || error.errors?.message || 'Gagal generate rapor kelas'
      setErrorMsg(msg)
      showError(msg)
      return
    }

    showSuccess(data?.message || 'Rapor kelas berhasil di-generate!')
    onSuccess?.(data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="generate-rapor-title" className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary-600 dark:text-primary-400" size={20} />
            <h2 id="generate-rapor-title" className="text-lg font-semibold text-gray-900 dark:text-white">Generate Rapor per Kelas</h2>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded" aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            <p className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300">
              Otomatis menghitung nilai akhir semua mapel dari nilai ujian serta merekap presensi (sakit, izin, alpa) untuk seluruh siswa aktif di kelas ini.
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
                  <label htmlFor="generate-kelas-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="generate-kelas-select"
                    value={selectedKelasId}
                    onChange={(e) => setSelectedKelasId(e.target.value)}
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    <option value="">Pilih kelas</option>
                    {kelasOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="generate-semester-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="generate-semester-select"
                    value={selectedSemesterId}
                    onChange={(e) => setSelectedSemesterId(e.target.value)}
                    disabled={submitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                  >
                    <option value="">Pilih semester</option>
                    {semesterOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label} {opt.isActive ? '(Aktif)' : ''}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting || loadingOptions} className="flex items-center gap-2">
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Sekarang</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GenerateRaporKelasModal

