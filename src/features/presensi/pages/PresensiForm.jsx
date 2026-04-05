import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { presensiService } from '../services/presensiService'
import { siswaService } from '../../siswa/services/siswaService'
import { referenceService } from '../../../services/referenceService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { usePageTitle } from '../../../hooks/usePageTitle'

const PresensiForm = () => {
  usePageTitle()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [selectedSiswaOption, setSelectedSiswaOption] = useState(null)
  const [statusOptions, setStatusOptions] = useState([])
  const [fetchingStatus, setFetchingStatus] = useState(true)
  const [rawPresensiStatus, setRawPresensiStatus] = useState(null)
  
  const [formData, setFormData] = useState({
    mst_siswa_id: '',
    mst_guru_mapel_id: '',
    tanggal: '',
    jam_masuk: '',
    status: '',
    keterangan: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchStatusOptions()
    if (isEditMode) {
      fetchPresensi()
    }
  }, [id])

  useEffect(() => {
    if (rawPresensiStatus !== null && statusOptions.length > 0) {
      const matched = statusOptions.find(
        opt => String(opt.value) === String(rawPresensiStatus)
      )
      if (matched) {
        setFormData(prev => ({ ...prev, status: matched.value }))
      }
      setRawPresensiStatus(null)
    }
  }, [rawPresensiStatus, statusOptions])

  const fetchStatusOptions = async () => {
    setFetchingStatus(true)
    const { data, error } = await referenceService.getReferencesByCategory('status_presensi')
    if (data && !error) {
      const options = (data.data || []).map(item => ({
        value: item.kode,
        label: item.nama.charAt(0).toUpperCase() + item.nama.slice(1)
      }))
      setStatusOptions(options)
    } else {
      console.error('Error fetching status options:', error)
      showError('Gagal mengambil data status presensi')
    }
    setFetchingStatus(false)
  }

  const buildSiswaOption = useCallback((siswa) => ({
    value: String(siswa.id),
    label: `${siswa.nis || '-'} - ${siswa.nama || `Siswa #${siswa.id}`}`
  }), [])

  const searchSiswaOptions = useCallback(async (keyword = '') => {
    const { data, error } = await siswaService.getAll({
      search: keyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      return data.data.map(buildSiswaOption)
    }

    console.error('Error fetching siswa:', error)
    return []
  }, [buildSiswaOption])

  const hydrateSelectedSiswaOption = useCallback(async (siswaId) => {
    if (!siswaId) {
      setSelectedSiswaOption(null)
      return
    }

    const { data } = await siswaService.getById(siswaId)
    const siswa = data?.data

    if (siswa) {
      setSelectedSiswaOption(buildSiswaOption(siswa))
    }
  }, [buildSiswaOption])

  const fetchPresensi = async () => {
    setFetchingData(true)
    const { data, error } = await presensiService.getPresensiById(id)
    if (data) {
      const presensi = data.data
      const siswaId = String(presensi.mst_siswa_id || presensi.siswa?.id || '')

      setFormData({
        mst_siswa_id: siswaId,
        mst_guru_mapel_id: presensi.mst_guru_mapel_id || presensi.guru_mapel?.id || '',
        tanggal: presensi.tanggal || '',
        jam_masuk: presensi.jam_masuk || '',
        status: '',
        keterangan: presensi.keterangan || ''
      })
      setRawPresensiStatus(presensi.status)

      if (presensi.siswa?.id) {
        setSelectedSiswaOption(buildSiswaOption(presensi.siswa))
      }
    } else {
      showError('Gagal mengambil data presensi')
      navigate('/akademik/presensi')
    }
    setFetchingData(false)
  }

  useEffect(() => {
    if (formData.mst_siswa_id) {
      hydrateSelectedSiswaOption(formData.mst_siswa_id)
    } else {
      setSelectedSiswaOption(null)
    }
  }, [formData.mst_siswa_id, hydrateSelectedSiswaOption])

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
    if (!formData.mst_guru_mapel_id) newErrors.mst_guru_mapel_id = 'Guru Mapel ID wajib diisi'
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
      mst_guru_mapel_id: parseInt(formData.mst_guru_mapel_id),
      tanggal: formData.tanggal,
      jam_masuk: formData.jam_masuk || null,
      status: formData.status,
      keterangan: formData.keterangan || null
    }

    let result
    
    if (isEditMode) {
      result = await presensiService.updatePresensi(id, submitData)
    } else {
      result = await presensiService.createPresensi(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Presensi berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/akademik/presensi')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} presensi`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/presensi')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Presensi' : 'Tambah Presensi Baru'}
        </h1>
      </div>

      <Card>
        {fetchingData || fetchingStatus ? (
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
                  options={selectedSiswaOption ? [selectedSiswaOption] : []}
                  loadOptions={searchSiswaOptions}
                  searchPlaceholder="Cari siswa berdasarkan nama atau NIS..."
                  noOptionsText="Tidak ada siswa yang cocok"
                  error={errors.mst_siswa_id ? (Array.isArray(errors.mst_siswa_id) ? errors.mst_siswa_id[0] : errors.mst_siswa_id) : null}
                />
              </div>

              {/* Guru Mapel ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Guru Mapel ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="mst_guru_mapel_id"
                  value={formData.mst_guru_mapel_id}
                  onChange={handleChange}
                  placeholder="Masukkan ID Guru Mapel"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                {errors.mst_guru_mapel_id && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.mst_guru_mapel_id) ? errors.mst_guru_mapel_id[0] : errors.mst_guru_mapel_id}
                  </p>
                )}
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
              <Button type="button" variant="secondary" onClick={() => navigate('/akademik/presensi')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'presensi.edit' : 'presensi.create'}>
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

export default PresensiForm