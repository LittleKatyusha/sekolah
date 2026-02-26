import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { absensiGuruService } from '../services/absensiGuruService'
import { guruService } from '../../guru/services/guruService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_OPTIONS = [
  { value: 1, label: 'Hadir' },
  { value: 2, label: 'Sakit' },
  { value: 3, label: 'Izin' },
  { value: 4, label: 'Alpha' },
]

const AbsensiGuruForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [guruOptions, setGuruOptions] = useState([])

  const [formData, setFormData] = useState({
    mst_guru_id: '',
    tanggal: '',
    status: 1,
    keterangan: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchGuruOptions()
    if (isEditMode) fetchAbsensi()
  }, [id])

  const fetchGuruOptions = async () => {
    const { data } = await guruService.getAll({ per_page: 1000 })
    if (data?.data) {
      setGuruOptions(data.data.map(g => ({
        value: g.id,
        label: `${g.nip} - ${g.nama}`
      })))
    }
  }

  const fetchAbsensi = async () => {
    setFetchingData(true)
    const { data, error } = await absensiGuruService.getById(id)
    if (data) {
      const absensi = data.data
      setFormData({
        mst_guru_id: absensi.mst_guru_id || '',
        tanggal: absensi.tanggal || '',
        status: absensi.status ?? 1,
        keterangan: absensi.keterangan || ''
      })
    } else {
      showError('Gagal mengambil data absensi')
      navigate('/absensi-guru')
    }
    setFetchingData(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.mst_guru_id) newErrors.mst_guru_id = 'Guru wajib dipilih'
    if (!formData.tanggal) newErrors.tanggal = 'Tanggal wajib diisi'
    if (!formData.status) newErrors.status = 'Status wajib dipilih'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const submitData = {
      ...formData,
      status: Number(formData.status),
      keterangan: formData.keterangan || null
    }

    let result
    if (isEditMode) {
      result = await absensiGuruService.update(id, submitData)
    } else {
      result = await absensiGuruService.create(submitData)
    }

    const { error } = result
    if (!error) {
      showSuccess(`Absensi guru berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/absensi-guru')
    } else {
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} absensi guru`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/absensi-guru')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Absensi Guru' : 'Tambah Absensi Guru'}
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
                  Guru <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="mst_guru_id"
                  value={formData.mst_guru_id}
                  onChange={handleChange}
                  options={guruOptions}
                  placeholder="Pilih Guru..."
                />
                {errors.mst_guru_id && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.mst_guru_id) ? errors.mst_guru_id[0] : errors.mst_guru_id}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  error={errors.tanggal}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.status) ? errors.status[0] : errors.status}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keterangan
                </label>
                <textarea
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Keterangan tambahan (opsional)"
                />
                {errors.keterangan && <p className="mt-1 text-sm text-red-500">{errors.keterangan}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/absensi-guru')}>
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

export default AbsensiGuruForm