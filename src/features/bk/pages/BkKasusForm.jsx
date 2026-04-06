import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { bkKasusService, bkJenisService } from '../services/bkService'
import { siswaService } from '../../siswa/services/siswaService'
import { guruService } from '../../guru/services/guruService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'

const BkKasusForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id
  const submitPermission = isEditMode ? 'bk.edit' : 'bk.create'

  const { options: statusOptions } = useReferenceOptions('status_bk')

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [selectedSiswaOption, setSelectedSiswaOption] = useState(null)
  const [selectedGuruOption, setSelectedGuruOption] = useState(null)
  const [selectedJenisOption, setSelectedJenisOption] = useState(null)

  const [formData, setFormData] = useState({
    siswa_id: '',
    guru_id: '',
    jenis_id: '',
    tanggal: '',
    keterangan: '',
    status: ''
  })

  const [errors, setErrors] = useState({})

  const buildSiswaOption = useCallback((siswa) => ({
    value: String(siswa.id),
    label: `${siswa.nis || '-'} - ${siswa.nama || `Siswa #${siswa.id}`}`
  }), [])

  const buildGuruOption = useCallback((guru) => ({
    value: String(guru.id),
    label: `${guru.nip || '-'} - ${guru.nama || `Guru #${guru.id}`}`
  }), [])

  const buildJenisOption = useCallback((jenis) => ({
    value: String(jenis.id),
    label: jenis.nama || `Jenis BK #${jenis.id}`
  }), [])

  const searchSiswaOptions = useCallback(async (keyword = '') => {
    const { data, error } = await siswaService.getAll({
      search: keyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      return data.data.map(buildSiswaOption)
    }

    console.error('Error fetching siswa options:', error)
    return []
  }, [buildSiswaOption])

  const searchGuruOptions = useCallback(async (keyword = '') => {
    const { data, error } = await guruService.getAll({
      search: keyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      return data.data.map(buildGuruOption)
    }

    console.error('Error fetching guru options:', error)
    return []
  }, [buildGuruOption])

  const searchJenisOptions = useCallback(async (keyword = '') => {
    const { data, error } = await bkJenisService.getAll({
      search: keyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      return data.data.map(buildJenisOption)
    }

    console.error('Error fetching jenis BK options:', error)
    return []
  }, [buildJenisOption])

  // Fetch kasus data for edit mode with AbortController support
  useEffect(() => {
    if (!isEditMode) return

    const controller = new AbortController()

    const fetchKasus = async () => {
      setFetchingData(true)
      try {
        const { data } = await bkKasusService.getById(id)
        if (controller.signal.aborted) return

        if (data) {
          const kasus = data.data
          let statusValue = kasus.status || ''
          // Convert string status to integer for the select
          if (typeof statusValue === 'string' && statusStringToInt[statusValue] !== undefined) {
            statusValue = statusStringToInt[statusValue]
          }

          const siswaId = String(kasus.siswa?.id || kasus.siswa_id || '')
          const guruId = String(kasus.guru?.id || kasus.guru_id || '')
          const jenisId = String(kasus.jenis?.id || kasus.jenis_id || '')

          setFormData({
            siswa_id: siswaId,
            guru_id: guruId,
            jenis_id: jenisId,
            tanggal: kasus.tanggal || '',
            keterangan: kasus.keterangan || '',
            status: statusValue
          })

          // Hydrate selected options directly from the response to avoid extra API calls
          if (kasus.siswa?.id) {
            setSelectedSiswaOption(buildSiswaOption(kasus.siswa))
          }

          if (kasus.guru?.id) {
            setSelectedGuruOption(buildGuruOption(kasus.guru))
          }

          if (kasus.jenis?.id) {
            setSelectedJenisOption(buildJenisOption(kasus.jenis))
          }
        } else {
          showError('Gagal mengambil data kasus BK')
          navigate('/bk/kasus')
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Error fetching kasus:', err)
          showError('Gagal mengambil data kasus BK')
          navigate('/bk/kasus')
        }
      } finally {
        if (!controller.signal.aborted) {
          setFetchingData(false)
        }
      }
    }

    fetchKasus()

    return () => controller.abort()
  }, [id, isEditMode, navigate, buildSiswaOption, buildGuruOption, buildJenisOption])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.siswa_id) newErrors.siswa_id = 'Siswa wajib dipilih'
    if (!formData.guru_id) newErrors.guru_id = 'Guru BK wajib dipilih'
    if (!formData.jenis_id) newErrors.jenis_id = 'Jenis BK wajib dipilih'
    if (!formData.tanggal) newErrors.tanggal = 'Tanggal wajib diisi'
    if (!formData.keterangan) newErrors.keterangan = 'Keterangan wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)

    // Prepare submit data - preserve numeric payload shape for selected relations and status
    const submitData = {
      ...formData,
      siswa_id: parseInt(formData.siswa_id, 10),
      guru_id: parseInt(formData.guru_id, 10),
      jenis_id: parseInt(formData.jenis_id, 10),
    }
    if (submitData.status !== '' && submitData.status !== null && submitData.status !== undefined) {
      submitData.status = parseInt(submitData.status, 10) || submitData.status
    }

    let result

    if (isEditMode) {
      result = await bkKasusService.update(id, submitData)
    } else {
      result = await bkKasusService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Kasus BK berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/bk/kasus')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} kasus BK`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/bk/kasus')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Kasus BK' : 'Tambah Kasus BK'}
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
                  name="siswa_id"
                  options={selectedSiswaOption ? [selectedSiswaOption] : []}
                  value={formData.siswa_id}
                  onChange={handleChange}
                  loadOptions={searchSiswaOptions}
                  placeholder="Pilih Siswa"
                  searchPlaceholder="Cari siswa berdasarkan nama atau NIS..."
                  noOptionsText="Tidak ada siswa yang cocok"
                  error={errors.siswa_id}
                />
              </div>

              {/* Guru BK */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Guru BK <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="guru_id"
                  options={selectedGuruOption ? [selectedGuruOption] : []}
                  value={formData.guru_id}
                  onChange={handleChange}
                  loadOptions={searchGuruOptions}
                  placeholder="Pilih Guru BK"
                  searchPlaceholder="Cari guru BK berdasarkan nama atau NIP..."
                  noOptionsText="Tidak ada guru yang cocok"
                  error={errors.guru_id}
                />
              </div>

              {/* Jenis BK */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jenis BK <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="jenis_id"
                  options={selectedJenisOption ? [selectedJenisOption] : []}
                  value={formData.jenis_id}
                  onChange={handleChange}
                  loadOptions={searchJenisOptions}
                  placeholder="Pilih Jenis BK"
                  searchPlaceholder="Cari jenis BK..."
                  noOptionsText="Tidak ada jenis BK yang cocok"
                  error={errors.jenis_id}
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
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${
                    errors.tanggal ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.tanggal && <p className="mt-1 text-sm text-red-500">{Array.isArray(errors.tanggal) ? errors.tanggal[0] : errors.tanggal}</p>}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Pilih Status</option>
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.status && <p className="mt-1 text-sm text-red-500">{Array.isArray(errors.status) ? errors.status[0] : errors.status}</p>}
              </div>

              {/* Keterangan - full width */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keterangan <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${
                    errors.keterangan ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Keterangan kasus BK"
                />
                {errors.keterangan && <p className="mt-1 text-sm text-red-500">{Array.isArray(errors.keterangan) ? errors.keterangan[0] : errors.keterangan}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/bk/kasus')}>
                Batal
              </Button>
              <PermissionGuard permission={submitPermission}>
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

export default BkKasusForm