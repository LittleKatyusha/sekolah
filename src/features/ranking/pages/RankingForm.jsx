import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { rankingService } from '../services/rankingService'
import { siswaService } from '../../siswa/services/siswaService'
import { kelasService } from '../../kelas/services/kelasService'
import { referenceService } from '../../../services/referenceService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const RankingForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    mst_siswa_id: '',
    mst_kelas_id: '',
    semester: '',
    tahun_ajaran: '',
    rata_rata_nilai: '',
    peringkat: ''
  })

  const [errors, setErrors] = useState({})
  const [siswaOptions, setSiswaOptions] = useState([])
  const [kelasOptions, setKelasOptions] = useState([])
  const [semesterOptions, setSemesterOptions] = useState([])

  useEffect(() => {
    fetchOptions()
    if (isEditMode) {
      fetchRanking()
    }
  }, [id])

  const fetchOptions = async () => {
    const [siswaResult, kelasResult] = await Promise.all([
      siswaService.getAll({ per_page: 100 }),
      kelasService.getAll({ per_page: 100 })
    ])

    if (siswaResult.data?.data) {
      setSiswaOptions(siswaResult.data.data.map(s => ({
        value: String(s.id),
        label: `${s.nama} (${s.nis || '-'})`
      })))
    }

    if (kelasResult.data?.data) {
      setKelasOptions(kelasResult.data.data.map(k => ({
        value: String(k.id),
        label: k.nama_kelas
      })))
    }

    // Try to fetch semester options from reference service
    try {
      const semesterResult = await referenceService.getReferencesByCategory('kategori_semester')
      if (semesterResult.data?.data) {
        setSemesterOptions(semesterResult.data.data.map(s => ({
          value: String(s.kode),
          label: s.nama
        })))
      }
    } catch {
      setSemesterOptions([
        { value: '1', label: 'Semester 1' },
        { value: '2', label: 'Semester 2' }
      ])
    }
  }

  const fetchRanking = async () => {
    setFetchingData(true)
    const { data, error } = await rankingService.getById(id)
    if (data) {
      const ranking = data.data
      setFormData({
        mst_siswa_id: ranking.siswa?.id ? String(ranking.siswa.id) : (ranking.mst_siswa_id ? String(ranking.mst_siswa_id) : ''),
        mst_kelas_id: ranking.kelas?.id ? String(ranking.kelas.id) : (ranking.mst_kelas_id ? String(ranking.mst_kelas_id) : ''),
        semester: ranking.semester ? String(ranking.semester) : '',
        tahun_ajaran: ranking.tahun_ajaran || '',
        rata_rata_nilai: ranking.rata_rata_nilai !== null && ranking.rata_rata_nilai !== undefined ? String(ranking.rata_rata_nilai) : '',
        peringkat: ranking.peringkat !== null && ranking.peringkat !== undefined ? String(ranking.peringkat) : ''
      })
    } else {
      showError('Gagal mengambil data ranking')
      navigate('/akademik/ranking')
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
    if (!formData.mst_siswa_id) newErrors.mst_siswa_id = 'Siswa wajib dipilih'
    if (!formData.mst_kelas_id) newErrors.mst_kelas_id = 'Kelas wajib dipilih'
    if (!formData.semester) newErrors.semester = 'Semester wajib diisi'
    if (!formData.tahun_ajaran.trim()) newErrors.tahun_ajaran = 'Tahun ajaran wajib diisi'
    if (!formData.rata_rata_nilai) newErrors.rata_rata_nilai = 'Rata-rata nilai wajib diisi'
    if (!formData.peringkat) newErrors.peringkat = 'Peringkat wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)

    const submitData = {
      mst_siswa_id: parseInt(formData.mst_siswa_id),
      mst_kelas_id: parseInt(formData.mst_kelas_id),
      semester: formData.semester,
      tahun_ajaran: formData.tahun_ajaran,
      rata_rata_nilai: parseFloat(formData.rata_rata_nilai),
      peringkat: parseInt(formData.peringkat)
    }

    let result

    if (isEditMode) {
      result = await rankingService.update(id, submitData)
    } else {
      result = await rankingService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Ranking berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/akademik/ranking')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} ranking`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/ranking')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Ranking' : 'Tambah Ranking Baru'}
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

              {/* Kelas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kelas <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="mst_kelas_id"
                  value={formData.mst_kelas_id}
                  onChange={handleChange}
                  options={kelasOptions}
                  placeholder="Pilih kelas"
                  error={errors.mst_kelas_id}
                />
              </div>

              {/* Semester */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Semester <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  options={semesterOptions}
                  placeholder="Pilih semester"
                  error={errors.semester}
                />
              </div>

              {/* Tahun Ajaran */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="tahun_ajaran"
                  value={formData.tahun_ajaran}
                  onChange={handleChange}
                  placeholder="Contoh: 2024/2025"
                  error={errors.tahun_ajaran}
                />
              </div>

              {/* Rata-rata Nilai */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rata-rata Nilai <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="rata_rata_nilai"
                  value={formData.rata_rata_nilai}
                  onChange={handleChange}
                  placeholder="0 - 100"
                  error={errors.rata_rata_nilai}
                  step="0.01"
                  min="0"
                  max="100"
                />
              </div>

              {/* Peringkat */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Peringkat <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="peringkat"
                  value={formData.peringkat}
                  onChange={handleChange}
                  placeholder="Masukkan peringkat"
                  error={errors.peringkat}
                  min="1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/akademik/ranking')}>
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

export default RankingForm