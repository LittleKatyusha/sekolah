import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { tugasService, tugasSiswaService } from '../services/tugasService'
import { siswaService } from '../../siswa/services/siswaService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_KUMPUL_OPTIONS = [
  { value: 'sudah', label: 'Sudah Dikumpulkan' },
  { value: 'belum', label: 'Belum Dikumpulkan' },
  { value: 'terlambat', label: 'Terlambat' },
]

const TugasSiswaForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [formData, setFormData] = useState({
    mst_tugas_id: '',
    mst_siswa_id: '',
    jawaban: '',
    file_path: '',
    tanggal_kumpul: '',
    status_kumpl: '',
    nilai: '',
    catatan: ''
  })

  const [errors, setErrors] = useState({})
  const [tugasOptions, setTugasOptions] = useState([])
  const [siswaOptions, setSiswaOptions] = useState([])

  useEffect(() => {
    fetchTugasOptions()
    fetchSiswaOptions()
    if (isEditMode) {
      fetchTugasSiswa()
    }
  }, [id])

  const fetchTugasOptions = async () => {
    const { data, error } = await tugasService.getAll({ per_page: 100 })
    if (data?.data) {
      const options = data.data.map(tugas => ({
        value: String(tugas.id),
        label: tugas.judul || `Tugas #${tugas.id}`
      }))
      setTugasOptions(options)
    }
  }

  const fetchSiswaOptions = async () => {
    const { data, error } = await siswaService.getAll({ per_page: 100 })
    if (data?.data) {
      const options = data.data.map(siswa => ({
        value: String(siswa.id),
        label: `${siswa.nis ? siswa.nis + ' - ' : ''}${siswa.nama || siswa.name || `Siswa #${siswa.id}`}`
      }))
      setSiswaOptions(options)
    }
  }

  const fetchTugasSiswa = async () => {
    setFetchingData(true)
    const { data, error } = await tugasSiswaService.getById(id)
    if (data) {
      const ts = data.data
      // Format datetime for datetime-local input
      let tanggalKumpul = ''
      if (ts.tanggal_kumpul) {
        const dt = new Date(ts.tanggal_kumpul)
        tanggalKumpul = dt.toISOString().slice(0, 16)
      }
      setFormData({
        mst_tugas_id: ts.tugas?.id ? String(ts.tugas.id) : (ts.mst_tugas_id ? String(ts.mst_tugas_id) : ''),
        mst_siswa_id: ts.siswa?.id ? String(ts.siswa.id) : (ts.mst_siswa_id ? String(ts.mst_siswa_id) : ''),
        jawaban: ts.jawaban || '',
        file_path: ts.file_path || '',
        tanggal_kumpul: tanggalKumpul,
        status_kumpl: ts.status_kumpl !== null && ts.status_kumpl !== undefined ? String(ts.status_kumpl) : '',
        nilai: ts.nilai !== null && ts.nilai !== undefined ? String(ts.nilai) : '',
        catatan: ts.catatan || ''
      })
    } else {
      showError('Gagal mengambil data tugas siswa')
      navigate('/akademik/tugas-siswa')
    }
    setFetchingData(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.mst_tugas_id) newErrors.mst_tugas_id = 'Tugas wajib dipilih'
    if (!formData.mst_siswa_id) newErrors.mst_siswa_id = 'Siswa wajib dipilih'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    const submitData = {
      mst_tugas_id: parseInt(formData.mst_tugas_id),
      mst_siswa_id: parseInt(formData.mst_siswa_id),
      jawaban: formData.jawaban || null,
      file_path: formData.file_path || null,
      tanggal_kumpul: formData.tanggal_kumpul || null,
      status_kumpl: formData.status_kumpl || null,
      nilai: formData.nilai !== '' ? parseFloat(formData.nilai) : null,
      catatan: formData.catatan || null
    }

    let result
    
    if (isEditMode) {
      result = await tugasSiswaService.update(id, submitData)
    } else {
      result = await tugasSiswaService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Tugas siswa berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/akademik/tugas-siswa')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} tugas siswa`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/tugas-siswa')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Tugas Siswa' : 'Tambah Pengumpulan Tugas'}
        </h1>
      </div>

      <Card>
        {fetchingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tugas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tugas <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="mst_tugas_id"
                  value={formData.mst_tugas_id}
                  onChange={handleChange}
                  options={tugasOptions}
                  placeholder="Pilih tugas"
                  error={errors.mst_tugas_id}
                />
              </div>

              {/* Siswa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Siswa <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="mst_siswa_id"
                  value={formData.mst_siswa_id}
                  onChange={handleChange}
                  options={siswaOptions}
                  placeholder="Pilih siswa"
                  error={errors.mst_siswa_id}
                />
              </div>

              {/* Jawaban */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jawaban
                </label>
                <textarea
                  name="jawaban"
                  value={formData.jawaban}
                  onChange={handleChange}
                  placeholder="Masukkan jawaban siswa"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-y"
                />
                {errors.jawaban && (
                  <p className="mt-1 text-sm text-red-500">{errors.jawaban}</p>
                )}
              </div>

              {/* File Path */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  File Path
                </label>
                <Input
                  type="text"
                  name="file_path"
                  value={formData.file_path}
                  onChange={handleChange}
                  placeholder="Path file (opsional)"
                  error={errors.file_path}
                />
              </div>

              {/* Tanggal Kumpul */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Kumpul
                </label>
                <input
                  type="datetime-local"
                  name="tanggal_kumpul"
                  value={formData.tanggal_kumpul}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
                {errors.tanggal_kumpul && (
                  <p className="mt-1 text-sm text-red-500">{errors.tanggal_kumpul}</p>
                )}
              </div>

              {/* Status Kumpul */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status Kumpul
                </label>
                <SearchableSelect
                  name="status_kumpl"
                  value={formData.status_kumpl}
                  onChange={handleChange}
                  options={STATUS_KUMPUL_OPTIONS}
                  placeholder="Pilih status"
                  error={errors.status_kumpl}
                />
              </div>

              {/* Nilai - only shown in edit mode */}
              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nilai (0-100)
                  </label>
                  <Input
                    type="number"
                    name="nilai"
                    value={formData.nilai}
                    onChange={handleChange}
                    placeholder="Masukkan nilai"
                    min="0"
                    max="100"
                    error={errors.nilai}
                  />
                </div>
              )}

              {/* Catatan */}
              <div className={isEditMode ? '' : 'md:col-span-2'}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Catatan Guru
                </label>
                <textarea
                  name="catatan"
                  value={formData.catatan}
                  onChange={handleChange}
                  placeholder="Catatan dari guru (opsional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-y"
                />
                {errors.catatan && (
                  <p className="mt-1 text-sm text-red-500">{errors.catatan}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/akademik/tugas-siswa')}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                <Save size={18} className="mr-2" />
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

export default TugasSiswaForm