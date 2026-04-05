import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { gelombangService } from '../services/ppdbService'
import { tahunAjaranService } from '../../tahun-ajaran/services/tahunAjaranService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_OPTIONS = [
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' },
]

const GelombangForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState([])

  const [formData, setFormData] = useState({
    mst_sekolah_id: '',
    nama_gelombang: '',
    tahun_ajaran_id: '',
    tgl_mulai: '',
    tgl_selesai: '',
    biaya_pendaftaran: '',
    is_active: '1',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchTahunAjaranOptions()
    if (isEditMode) {
      fetchGelombang()
    }
  }, [id])

  const fetchTahunAjaranOptions = async () => {
    const { data } = await tahunAjaranService.getAll({ per_page: 100 })
    if (data?.data) {
      setTahunAjaranOptions(data.data.map(ta => ({
        value: String(ta.id),
        label: ta.nama || `${ta.tahun_mulai}/${ta.tahun_selesai}`
      })))
    }
  }

  const fetchGelombang = async () => {
    setFetchingData(true)
    const { data, error } = await gelombangService.getById(id)
    if (data) {
      const g = data.data
      setFormData({
        mst_sekolah_id: g.mst_sekolah_id ? String(g.mst_sekolah_id) : '',
        nama_gelombang: g.nama_gelombang || '',
        tahun_ajaran_id: g.tahun_ajaran_id ? String(g.tahun_ajaran_id) : '',
        tgl_mulai: g.tgl_mulai || '',
        tgl_selesai: g.tgl_selesai || '',
        biaya_pendaftaran: g.biaya_pendaftaran !== null && g.biaya_pendaftaran !== undefined ? String(g.biaya_pendaftaran) : '',
        is_active: g.is_active !== null && g.is_active !== undefined ? String(Number(g.is_active)) : '1',
      })
    } else {
      showError('Gagal mengambil data gelombang')
      navigate('/ppdb/gelombang')
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
    if (!formData.nama_gelombang.trim()) newErrors.nama_gelombang = 'Nama gelombang wajib diisi'
    if (!formData.tahun_ajaran_id) newErrors.tahun_ajaran_id = 'Tahun ajaran wajib dipilih'
    if (!formData.tgl_mulai) newErrors.tgl_mulai = 'Tanggal mulai wajib diisi'
    if (!formData.tgl_selesai) newErrors.tgl_selesai = 'Tanggal selesai wajib diisi'
    if (!isEditMode && !formData.mst_sekolah_id) newErrors.mst_sekolah_id = 'Sekolah ID wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const submitData = {
      mst_sekolah_id: parseInt(formData.mst_sekolah_id),
      nama_gelombang: formData.nama_gelombang,
      tahun_ajaran_id: parseInt(formData.tahun_ajaran_id),
      tgl_mulai: formData.tgl_mulai,
      tgl_selesai: formData.tgl_selesai,
      biaya_pendaftaran: formData.biaya_pendaftaran ? parseFloat(formData.biaya_pendaftaran) : null,
      is_active: formData.is_active !== '' ? parseInt(formData.is_active) : null,
    }

    let result
    if (isEditMode) {
      result = await gelombangService.update(id, submitData)
    } else {
      result = await gelombangService.create(submitData)
    }

    const { error } = result
    if (!error) {
      showSuccess(`Gelombang berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/ppdb/gelombang')
    } else {
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} gelombang`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/ppdb/gelombang')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Gelombang' : 'Tambah Gelombang Baru'}
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Gelombang <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="nama_gelombang"
                  value={formData.nama_gelombang}
                  onChange={handleChange}
                  placeholder="Masukkan nama gelombang"
                  error={errors.nama_gelombang}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sekolah ID <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="mst_sekolah_id"
                  value={formData.mst_sekolah_id}
                  onChange={handleChange}
                  placeholder="ID Sekolah"
                  error={errors.mst_sekolah_id}
                />
              </div>

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
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="tgl_mulai"
                  value={formData.tgl_mulai}
                  onChange={handleChange}
                  error={errors.tgl_mulai}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Selesai <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="tgl_selesai"
                  value={formData.tgl_selesai}
                  onChange={handleChange}
                  error={errors.tgl_selesai}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Biaya Pendaftaran
                </label>
                <Input
                  type="number"
                  name="biaya_pendaftaran"
                  value={formData.biaya_pendaftaran}
                  onChange={handleChange}
                  placeholder="0"
                  error={errors.biaya_pendaftaran}
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
              <Button type="button" variant="secondary" onClick={() => navigate('/ppdb/gelombang')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'ppdb.gelombang.edit' : 'ppdb.gelombang.create'}>
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

export default GelombangForm