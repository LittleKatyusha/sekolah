import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { tahunAjaranService } from '../services/tahunAjaranService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_OPTIONS = [
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' },
]

const TahunAjaranForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    is_active: '0',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEditMode) {
      fetchTahunAjaran()
    }
  }, [id])

  const fetchTahunAjaran = async () => {
    setFetchingData(true)
    const { data, error } = await tahunAjaranService.getById(id)
    if (data) {
      const item = data.data
      setFormData({
        kode: item.kode || '',
        nama: item.nama || '',
        tanggal_mulai: item.tanggal_mulai || '',
        tanggal_selesai: item.tanggal_selesai || '',
        is_active: item.is_active !== null && item.is_active !== undefined ? String(Number(item.is_active)) : '0',
      })
    } else {
      showError('Gagal mengambil data tahun ajaran')
      navigate('/admin/tahun-ajaran')
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
    if (!formData.kode.trim()) newErrors.kode = 'Kode wajib diisi'
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
      kode: formData.kode,
      nama: formData.nama,
      tanggal_mulai: formData.tanggal_mulai,
      tanggal_selesai: formData.tanggal_selesai,
      is_active: parseInt(formData.is_active) === 1,
    }

    let result
    if (isEditMode) {
      result = await tahunAjaranService.update(id, submitData)
    } else {
      result = await tahunAjaranService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Tahun Ajaran berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/admin/tahun-ajaran')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} tahun ajaran`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/admin/tahun-ajaran')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran Baru'}
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
                  Kode <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="kode"
                  value={formData.kode}
                  onChange={handleChange}
                  placeholder="Masukkan kode (cth: 2024/2025)"
                  error={errors.kode}
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
                  placeholder="Masukkan nama tahun ajaran"
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
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/tahun-ajaran')}>
                Batal
              </Button>
              <PermissionGuard permission="tahun-ajaran.manage">
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

export default TahunAjaranForm
