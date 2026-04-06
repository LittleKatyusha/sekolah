import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { absensiGuruService } from '../services/absensiGuruService'
import { guruService } from '../../guru/services/guruService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'

const normalizeStatusValue = (status, statusOptions = []) => {
  if (status === null || status === undefined || status === '') return 1
  if (typeof status === 'number') return status

  const normalizedStatus = String(status).trim().toLowerCase()
  const matchedOption = statusOptions.find((option) => String(option.label).trim().toLowerCase() === normalizedStatus)

  if (matchedOption) {
    return Number(matchedOption.value)
  }

  const fallbackMap = {
    hadir: 1,
    sakit: 2,
    izin: 3,
    alpha: 4,
    alpa: 4,
  }

  return fallbackMap[normalizedStatus] || 1
}

const toTimeInputValue = (value) => {
  if (!value) return ''
  return String(value).slice(0, 5)
}

const AbsensiGuruForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const { options: statusOptions } = useReferenceOptions('status_absensi')

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [selectedGuruOption, setSelectedGuruOption] = useState(null)

  const [formData, setFormData] = useState({
    mst_guru_id: '',
    tanggal: '',
    status: 1,
    keterangan: '',
    jam_masuk: '',
    jam_keluar: '',
  })

  const [errors, setErrors] = useState({})

  const buildGuruOption = useCallback((guru) => ({
    value: String(guru.id),
    label: `${guru.nip || '-'} - ${guru.nama || `Guru #${guru.id}`}`
  }), [])

  const searchGuruOptions = useCallback(async (keyword = '') => {
    const { data } = await guruService.getAll({
      search: keyword || undefined,
      per_page: 20,
    })

    const list = data?.data || []
    return list.map(buildGuruOption)
  }, [buildGuruOption])

  const hydrateSelectedGuruOption = useCallback(async (guruId) => {
    if (!guruId) {
      setSelectedGuruOption(null)
      return
    }

    const { data } = await guruService.getById(guruId)
    const guru = data?.data

    if (guru) {
      setSelectedGuruOption(buildGuruOption(guru))
    }
  }, [buildGuruOption])

  const fetchAbsensi = useCallback(async () => {
    setFetchingData(true)
    const { data, error } = await absensiGuruService.getById(id)
    if (data) {
      const absensi = data.data
      const guruId = absensi.guru?.id ? String(absensi.guru.id) : (absensi.mst_guru_id ? String(absensi.mst_guru_id) : '')

      setFormData({
        mst_guru_id: guruId,
        tanggal: absensi.tanggal || '',
        status: normalizeStatusValue(absensi.status ?? absensi.status_absensi, statusOptions),
        keterangan: absensi.keterangan || '',
        jam_masuk: toTimeInputValue(absensi.jam_masuk),
        jam_keluar: toTimeInputValue(absensi.jam_keluar),
      })

      if (absensi.guru?.id) {
        setSelectedGuruOption(buildGuruOption(absensi.guru))
      }
    } else {
      showError('Gagal mengambil data absensi')
      navigate('/absensi-guru')
    }
    setFetchingData(false)
  }, [id, navigate, buildGuruOption, statusOptions])

  useEffect(() => {
    if (isEditMode) fetchAbsensi()
  }, [isEditMode, fetchAbsensi])

  useEffect(() => {
    if (formData.mst_guru_id) {
      // Skip the fetch if selectedGuruOption is already set and matches the current ID
      if (selectedGuruOption && selectedGuruOption.value === String(formData.mst_guru_id)) {
        return
      }
      hydrateSelectedGuruOption(formData.mst_guru_id)
    } else {
      setSelectedGuruOption(null)
    }
  }, [formData.mst_guru_id, hydrateSelectedGuruOption, selectedGuruOption])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => {
      if (prev[name]) {
        return { ...prev, [name]: null }
      }
      return prev
    })
  }, [])

  const validate = useCallback(() => {
    const newErrors = {}
    if (!formData.mst_guru_id) newErrors.mst_guru_id = 'Guru wajib dipilih'
    if (!formData.tanggal) newErrors.tanggal = 'Tanggal wajib diisi'
    if (!formData.status) newErrors.status = 'Status wajib dipilih'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const submitData = {
      ...formData,
      status: Number(formData.status),
      keterangan: formData.keterangan || null,
      jam_masuk: formData.jam_masuk || null,
      jam_keluar: formData.jam_keluar || null,
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
  }, [formData, isEditMode, id, navigate, validate])

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
                  options={selectedGuruOption ? [selectedGuruOption] : []}
                  loadOptions={searchGuruOptions}
                  placeholder="Pilih Guru..."
                  searchPlaceholder="Cari guru berdasarkan nama atau NIP..."
                  noOptionsText="Tidak ada guru yang cocok"
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
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.status) ? errors.status[0] : errors.status}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jam Masuk
                </label>
                <Input
                  type="time"
                  name="jam_masuk"
                  value={formData.jam_masuk}
                  onChange={handleChange}
                  error={Array.isArray(errors.jam_masuk) ? errors.jam_masuk[0] : errors.jam_masuk}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jam Keluar
                </label>
                <Input
                  type="time"
                  name="jam_keluar"
                  value={formData.jam_keluar}
                  onChange={handleChange}
                  error={Array.isArray(errors.jam_keluar) ? errors.jam_keluar[0] : errors.jam_keluar}
                />
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