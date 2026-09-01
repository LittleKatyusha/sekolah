import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { sekolahService } from '../services/sekolahService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_OPTIONS = [
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' },
]

const PLAN_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'basic', label: 'Basic' },
  { value: 'premium', label: 'Premium' },
  { value: 'enterprise', label: 'Enterprise' },
]

const SekolahForm = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [sekolahId, setSekolahId] = useState(null)

  const [formData, setFormData] = useState({
    nama_sekolah: '',
    npsn: '',
    alamat: '',
    logo_path: '',
    is_active: '1',
    subscription_plan: '',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchSekolah()
  }, [])

  const fetchSekolah = async () => {
    setFetchingData(true)
    const { data, error } = await sekolahService.getAll({ per_page: 1 })
    if (data) {
      const list = data.data?.data || data.data || []
      const first = Array.isArray(list) ? list[0] : list
      if (first) {
        setSekolahId(first.id)
        setFormData({
          nama_sekolah: first.nama_sekolah || '',
          npsn: first.npsn || '',
          alamat: first.alamat || '',
          logo_path: first.logo_path || '',
          is_active: first.is_active !== null && first.is_active !== undefined ? String(Number(first.is_active)) : '1',
          subscription_plan: first.subscription_plan || '',
        })
      }
    } else {
      showError('Gagal mengambil data sekolah')
      navigate('/sekolah')
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
    if (!formData.nama_sekolah.trim()) newErrors.nama_sekolah = 'Nama sekolah wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)

    const submitData = {
      nama_sekolah: formData.nama_sekolah,
      npsn: formData.npsn || null,
      alamat: formData.alamat || null,
      logo_path: formData.logo_path || null,
      is_active: formData.is_active !== '' ? Boolean(parseInt(formData.is_active)) : null,
      subscription_plan: formData.subscription_plan || null,
    }

    let result

    if (sekolahId) {
      result = await sekolahService.update(sekolahId, submitData)
    } else {
      result = await sekolahService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Profil sekolah berhasil ${sekolahId ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/sekolah')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${sekolahId ? 'memperbarui' : 'menambahkan'} profil sekolah`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/sekolah')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {sekolahId ? 'Edit Profil Sekolah' : 'Tambah Sekolah Baru'}
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
              {/* Nama Sekolah */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Sekolah <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="nama_sekolah"
                  value={formData.nama_sekolah}
                  onChange={handleChange}
                  placeholder="Masukkan nama sekolah"
                  error={errors.nama_sekolah}
                />
              </div>

              {/* NPSN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  NPSN
                </label>
                <Input
                  type="text"
                  name="npsn"
                  value={formData.npsn}
                  onChange={handleChange}
                  placeholder="Masukkan NPSN"
                  error={errors.npsn}
                />
              </div>

              {/* Status */}
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

              {/* Alamat */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alamat
                </label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  placeholder="Masukkan alamat sekolah"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-y"
                />
                {errors.alamat && (
                  <p className="mt-1 text-sm text-red-500">{errors.alamat}</p>
                )}
              </div>

              {/* Logo Path */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Logo Path
                </label>
                <Input
                  type="text"
                  name="logo_path"
                  value={formData.logo_path}
                  onChange={handleChange}
                  placeholder="Path logo (opsional)"
                  error={errors.logo_path}
                />
              </div>

              {/* Subscription Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subscription Plan
                </label>
                <SearchableSelect
                  name="subscription_plan"
                  value={formData.subscription_plan}
                  onChange={handleChange}
                  options={PLAN_OPTIONS}
                  placeholder="Pilih plan"
                  error={errors.subscription_plan}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/sekolah')}>
                Batal
              </Button>
              <PermissionGuard permission={sekolahId ? 'sekolah.update' : 'sekolah.create'}>
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

export default SekolahForm
