import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { semesterService } from '../services/semesterService'
import { tahunAjaranService } from '../../tahun-ajaran/services/tahunAjaranService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_OPTIONS = [
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' },
]

const formatDateForInput = (dateStr) => {
  if (!dateStr) return ''
  return String(dateStr).split('T')[0]
}

const SemesterForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    tahun_ajaran_id: '',
    nama: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    is_active: '0',
  })

  const [errors, setErrors] = useState({})
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState([])

  useEffect(() => {
    fetchTahunAjaranOptions()
    if (isEditMode) {
      fetchSemester()
    }
  }, [id])

  const fetchTahunAjaranOptions = async () => {
    const { data } = await tahunAjaranService.getAll({ per_page: 100 })
    if (data?.data) {
      const options = data.data.map((item) => ({
        value: String(item.id),
        label: item.nama || item.kode || `Tahun Ajaran #${item.id}`
      }))
      setTahunAjaranOptions(options)
    }
  }

  const fetchSemester = async () => {
    setFetchingData(true)
    const { data, error } = await semesterService.getById(id)
    if (data) {
      const item = data.data
      setFormData({
        tahun_ajaran_id: item.tahun_ajaran_id ? String(item.tahun_ajaran_id) : (item.tahun_ajaran?.id ? String(item.tahun_ajaran.id) : ''),
        nama: item.nama || '',
        tanggal_mulai: formatDateForInput(item.tanggal_mulai),
        tanggal_selesai: formatDateForInput(item.tanggal_selesai),
        is_active: item.is_active !== null && item.is_active !== undefined ? String(Number(item.is_active)) : '0',
      })
    } else {
      showError('Gagal mengambil data semester')
      navigate('/admin/semester')
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
    if (!formData.tahun_ajaran_id) newErrors.tahun_ajaran_id = 'Tahun Ajaran wajib dipilih'
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi'
    if (!formData.tanggal_mulai) newErrors.tanggal_mulai = 'Tanggal mulai wajib diisi'
    if (!formData.tanggal_selesai) newErrors.tanggal_selesai = 'Tanggal selesai wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const submitData = {
      tahun_ajaran_id: parseInt(formData.tahun_ajaran_id),
      nama: formData.nama,
      tanggal_mulai: formData.tanggal_mulai,
      tanggal_selesai: formData.tanggal_selesai,
      is_active: parseInt(formData.is_active) === 1,
    }

    let result
    if (isEditMode) {
      result = await semesterService.update(id, submitData)
    } else {
      result = await semesterService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Semester berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/admin/semester')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} semester`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/admin/semester')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Semester' : 'Tambah Semester Baru'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="tahun_ajaran_id"
                  value={formData.tahun_ajaran_id}
                  onChange={handleChange}
                  options={tahunAjaranOptions}
                  placeholder="Pilih tahun ajaran"
                  error={errors.tahun_ajaran_id}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama semester (cth: Ganjil)"
                  error={errors.nama}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="tanggal_mulai"
                  value={formData.tanggal_mulai}
                  onChange={handleChange}
                  error={errors.tanggal_mulai}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Selesai <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="tanggal_selesai"
                  value={formData.tanggal_selesai}
                  onChange={handleChange}
                  error={errors.tanggal_selesai}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <SearchableSelect
                  name="is_active"
                  value={formData.is_active}
                  onChange={handleChange}
                  options={STATUS_OPTIONS}
                  placeholder="Pilih status"
                  error={errors.is_active}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/semester')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'semester.edit' : 'semester.create'}>
                <Button type="submit" disabled={loading}>
                  <Save size={18} className="mr-2" />
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </PermissionGuard>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

export default SemesterForm
