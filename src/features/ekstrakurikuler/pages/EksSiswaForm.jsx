import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { eksSiswaService, ekstrakurikulerService } from '../services/ekstrakurikulerService'
import { siswaService } from '../../siswa/services/siswaService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_OPTIONS = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'keluar', label: 'Keluar' },
]

const EksSiswaForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    ekstrakurikuler_id: '',
    siswa_id: '',
    tanggal_daftar: '',
    status: 'aktif',
  })

  const [errors, setErrors] = useState({})
  const [ekskulOptions, setEkskulOptions] = useState([])
  const [siswaOptions, setSiswaOptions] = useState([])

  useEffect(() => {
    fetchOptions()
    if (isEditMode) {
      fetchPendaftaran()
    }
  }, [id])

  const fetchOptions = async () => {
    const [ekskulResult, siswaResult] = await Promise.all([
      ekstrakurikulerService.getAll({ per_page: 100 }),
      siswaService.getAll({ per_page: 100 })
    ])

    if (ekskulResult.data?.data) {
      setEkskulOptions(ekskulResult.data.data.map(e => ({
        value: String(e.id),
        label: e.nama || `Ekskul #${e.id}`
      })))
    }

    if (siswaResult.data?.data) {
      setSiswaOptions(siswaResult.data.data.map(s => ({
        value: String(s.id),
        label: s.nama ? `${s.nama}${s.nis ? ` (${s.nis})` : ''}` : `Siswa #${s.id}`
      })))
    }
  }

  const fetchPendaftaran = async () => {
    setFetchingData(true)
    const { data, error } = await eksSiswaService.getById(id)
    if (data) {
      const pendaftaran = data.data
      setFormData({
        ekstrakurikuler_id: pendaftaran.ekstrakurikuler_id ? String(pendaftaran.ekstrakurikuler_id) : (pendaftaran.ekstrakurikuler?.id ? String(pendaftaran.ekstrakurikuler.id) : ''),
        siswa_id: pendaftaran.siswa_id ? String(pendaftaran.siswa_id) : (pendaftaran.siswa?.id ? String(pendaftaran.siswa.id) : ''),
        tanggal_daftar: pendaftaran.tanggal_daftar || '',
        status: pendaftaran.status || 'aktif',
      })
    } else {
      showError('Gagal mengambil data pendaftaran')
      navigate('/ekstrakurikuler/siswa')
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
    if (!formData.ekstrakurikuler_id) newErrors.ekstrakurikuler_id = 'Ekstrakurikuler wajib dipilih'
    if (!formData.siswa_id) newErrors.siswa_id = 'Siswa wajib dipilih'
    if (!formData.tanggal_daftar) newErrors.tanggal_daftar = 'Tanggal daftar wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    let result

    if (isEditMode) {
      // Edit mode: update status
      result = await eksSiswaService.updateStatus(id, formData.status)
    } else {
      // Create mode: register student
      const submitData = {
        ekstrakurikuler_id: parseInt(formData.ekstrakurikuler_id),
        siswa_id: parseInt(formData.siswa_id),
        tanggal_daftar: formData.tanggal_daftar,
      }
      result = await eksSiswaService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Pendaftaran berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/ekstrakurikuler/siswa')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} pendaftaran`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/ekstrakurikuler/siswa')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Pendaftaran Ekskul' : 'Tambah Pendaftaran Ekskul'}
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
                  Siswa <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="siswa_id"
                  value={formData.siswa_id}
                  onChange={handleChange}
                  options={siswaOptions}
                  placeholder="Pilih siswa"
                  error={errors.siswa_id}
                  disabled={isEditMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ekstrakurikuler <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="ekstrakurikuler_id"
                  value={formData.ekstrakurikuler_id}
                  onChange={handleChange}
                  options={ekskulOptions}
                  placeholder="Pilih ekstrakurikuler"
                  error={errors.ekstrakurikuler_id}
                  disabled={isEditMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Daftar <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="tanggal_daftar"
                  value={formData.tanggal_daftar}
                  onChange={handleChange}
                  error={errors.tanggal_daftar}
                  disabled={isEditMode}
                />
              </div>

              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <SearchableSelect
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={STATUS_OPTIONS}
                    placeholder="Pilih status"
                    error={errors.status}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/ekstrakurikuler/siswa')}>
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

export default EksSiswaForm