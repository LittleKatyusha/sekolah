import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { absensiSiswaService } from '../services/absensiSiswaService'
import { siswaService } from '../../siswa/services/siswaService'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'
import { showSuccess, showError } from '../../../utils/sweetalert'

const AbsensiSiswaForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [fetchingSiswas, setFetchingSiswas] = useState(true)
  const [siswas, setSiswas] = useState([])

  const { options: statusOptions, loading: fetchingStatus } = useReferenceOptions('status_presensi', [
    { value: '1', label: 'Hadir' },
    { value: '2', label: 'Sakit' },
    { value: '3', label: 'Izin' },
    { value: '4', label: 'Alpha' },
  ])
  
  const [formData, setFormData] = useState({
    mst_siswa_id: '',
    tanggal: '',
    status: '',
    keterangan: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchSiswas()
    if (isEditMode) {
      fetchAbsensiSiswa()
    }
  }, [id])

  const fetchSiswas = async () => {
    setFetchingSiswas(true)
    const { data, error } = await siswaService.getAll({ per_page: 1000 })
    if (data && !error) {
      setSiswas(data.data || [])
    } else {
      console.error('Error fetching siswas:', error)
      showError('Gagal mengambil data siswa')
    }
    setFetchingSiswas(false)
  }

  const mapStatus = (raw) => {
    const statusMap = {
      'hadir': '1', 'sakit': '2', 'izin': '3', 'alpha': '4', 'alpa': '4',
      '1': '1', '2': '2', '3': '3', '4': '4'
    }
    const mapped = statusMap[String(raw).toLowerCase()]
    if (mapped) return mapped
    if (!isNaN(parseInt(raw))) return String(parseInt(raw))
    return ''
  }

  const fetchAbsensiSiswa = async () => {
    setFetchingData(true)
    const { data, error } = await absensiSiswaService.getAbsensiSiswaById(id)
    if (data) {
      const absensi = data.data
      const rawStatus = absensi.status_absensi || absensi.status || ''
      setFormData({
        mst_siswa_id: absensi.siswa?.id || absensi.mst_siswa_id || '',
        tanggal: absensi.tanggal || '',
        status: mapStatus(rawStatus),
        keterangan: absensi.keterangan || ''
      })
    } else {
      showError('Gagal mengambil data absensi siswa')
      navigate('/absensi-siswa')
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
      mst_siswa_id: parseInt(formData.mst_siswa_id),
      tanggal: formData.tanggal,
      status: parseInt(formData.status),
      keterangan: formData.keterangan ? String(formData.keterangan) : null
    }

    let result
    
    if (isEditMode) {
      result = await absensiSiswaService.updateAbsensiSiswa(id, submitData)
    } else {
      result = await absensiSiswaService.createAbsensiSiswa(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Absensi siswa berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/absensi-siswa')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} absensi siswa`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/absensi-siswa')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Absensi Siswa' : 'Tambah Absensi Siswa Baru'}
        </h1>
      </div>

      <Card>
        {fetchingData || fetchingSiswas || fetchingStatus ? (
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
                  disabled={isEditMode}
                  placeholder="Cari dan pilih siswa..."
                  options={siswas.map(siswa => ({
                    value: siswa.id,
                    label: `${siswa.nama} (${siswa.nis})`
                  }))}
                  error={errors.mst_siswa_id ? (Array.isArray(errors.mst_siswa_id) ? errors.mst_siswa_id[0] : errors.mst_siswa_id) : null}
                />
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  onClick={(e) => e.target.showPicker?.()}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                {errors.tanggal && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.tanggal) ? errors.tanggal[0] : errors.tanggal}
                  </p>
                )}
              </div>

              {/* Status */}
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
                  <option value="">Pilih Status</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.status) ? errors.status[0] : errors.status}
                  </p>
                )}
              </div>


              {/* Keterangan */}
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
                  placeholder="Keterangan opsional"
                />
                {errors.keterangan && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.keterangan) ? errors.keterangan[0] : errors.keterangan}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/absensi-siswa')}>
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

export default AbsensiSiswaForm