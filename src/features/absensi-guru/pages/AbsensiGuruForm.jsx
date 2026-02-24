import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { absensiGuruService } from '../services/absensiGuruService'
import { guruService } from '../../guru/services/guruService'
import { referenceService } from '../../../services/referenceService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const AbsensiGuruForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [fetchingGurus, setFetchingGurus] = useState(true)
  const [gurus, setGurus] = useState([])
  const [statusOptions, setStatusOptions] = useState([])
  const [fetchingStatus, setFetchingStatus] = useState(true)
  const [rawAbsensiStatus, setRawAbsensiStatus] = useState(null)
  
  const [formData, setFormData] = useState({
    guru_id: '',
    tanggal: '',
    status: '',
    jam_masuk: '',
    jam_keluar: '',
    keterangan: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchGurus()
    fetchStatusOptions()
    if (isEditMode) {
      fetchAbsensiGuru()
    }
  }, [id])

  useEffect(() => {
    if (rawAbsensiStatus && statusOptions.length > 0) {
      const matched = statusOptions.find(
        opt => opt.label.toLowerCase() === rawAbsensiStatus.toLowerCase()
      )
      if (matched) {
        setFormData(prev => ({ ...prev, status: matched.value }))
      }
      // Clear it so we don't re-run this unnecessarily
      setRawAbsensiStatus(null)
    }
  }, [rawAbsensiStatus, statusOptions])

  const fetchStatusOptions = async () => {
    setFetchingStatus(true)
    const { data, error } = await referenceService.getReferencesByCategory('status_absensi')
    if (data && !error) {
      const options = (data.data || []).map(item => ({
        value: item.kode,
        label: item.nama.charAt(0).toUpperCase() + item.nama.slice(1)
      }))
      setStatusOptions(options)
    } else {
      console.error('Error fetching status options:', error)
      showError('Gagal mengambil data status absensi')
    }
    setFetchingStatus(false)
  }

  const fetchGurus = async () => {
    setFetchingGurus(true)
    const { data, error } = await guruService.getAll({ per_page: 100 })
    if (data && !error) {
      setGurus(data.data || [])
    } else {
      console.error('Error fetching gurus:', error)
      showError('Gagal mengambil data guru')
    }
    setFetchingGurus(false)
  }

  const fetchAbsensiGuru = async () => {
    setFetchingData(true)
    const { data, error } = await absensiGuruService.getAbsensiGuruById(id)
    if (data) {
      const absensi = data.data
      setFormData({
        guru_id: absensi.guru?.id || '',
        tanggal: absensi.tanggal || '',
        status: '',
        jam_masuk: absensi.jam_masuk || '',
        jam_keluar: absensi.jam_keluar || '',
        keterangan: absensi.keterangan || ''
      })
      setRawAbsensiStatus(absensi.status_absensi || null)
    } else {
      showError('Gagal mengambil data absensi guru')
      navigate('/absensi-guru')
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
    if (!formData.guru_id) newErrors.guru_id = 'Guru wajib dipilih'
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
      guru_id: parseInt(formData.guru_id),
      tanggal: formData.tanggal,
      status: formData.status,
      jam_masuk: formData.jam_masuk || null,
      jam_keluar: formData.jam_keluar || null,
      keterangan: formData.keterangan || null
    }

    let result
    
    if (isEditMode) {
      result = await absensiGuruService.updateAbsensiGuru(id, submitData)
    } else {
      result = await absensiGuruService.createAbsensiGuru(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Absensi guru berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/absensi-guru')
    } else {
      console.error(error)
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
          {isEditMode ? 'Edit Absensi Guru' : 'Tambah Absensi Guru Baru'}
        </h1>
      </div>

      <Card>
        {fetchingData || fetchingGurus || fetchingStatus ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Guru */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Guru <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="guru_id"
                  value={formData.guru_id}
                  onChange={handleChange}
                  disabled={isEditMode}
                  placeholder="Cari dan pilih guru..."
                  options={gurus.map(guru => ({
                    value: guru.id,
                    label: `${guru.nama} (${guru.nip})`
                  }))}
                  error={errors.guru_id ? (Array.isArray(errors.guru_id) ? errors.guru_id[0] : errors.guru_id) : null}
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

              {/* Jam Masuk */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jam Masuk
                </label>
                <input
                  type="time"
                  name="jam_masuk"
                  value={formData.jam_masuk}
                  onChange={handleChange}
                  onClick={(e) => e.target.showPicker?.()}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                {errors.jam_masuk && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.jam_masuk) ? errors.jam_masuk[0] : errors.jam_masuk}
                  </p>
                )}
              </div>

              {/* Jam Keluar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jam Keluar
                </label>
                <input
                  type="time"
                  name="jam_keluar"
                  value={formData.jam_keluar}
                  onChange={handleChange}
                  onClick={(e) => e.target.showPicker?.()}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                {errors.jam_keluar && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.jam_keluar) ? errors.jam_keluar[0] : errors.jam_keluar}
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