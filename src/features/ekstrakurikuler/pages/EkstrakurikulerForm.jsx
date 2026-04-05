import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { ekstrakurikulerService } from '../services/ekstrakurikulerService'
import { guruService } from '../../guru/services/guruService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const HARI_OPTIONS = [
  { value: 'Senin', label: 'Senin' },
  { value: 'Selasa', label: 'Selasa' },
  { value: 'Rabu', label: 'Rabu' },
  { value: 'Kamis', label: 'Kamis' },
  { value: 'Jumat', label: 'Jumat' },
  { value: 'Sabtu', label: 'Sabtu' },
]

const STATUS_OPTIONS = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
]

const buildGuruOption = (guru) => ({
  value: String(guru.id),
  label: guru.nama || `Guru #${guru.id}`
})

const EkstrakurikulerForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    deskripsi: '',
    pembina_guru_id: '',
    hari: '',
    jam_mulai: '',
    jam_selesai: '',
    lokasi: '',
    status: 'aktif',
  })

  const [errors, setErrors] = useState({})
  const [selectedGuruOption, setSelectedGuruOption] = useState(null)

  // Lazy search for guru options — avoids fetching all 100+ guru upfront
  const searchGuruOptions = useCallback(async (keyword = '') => {
    const { data, error } = await guruService.getAll({
      search: keyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      return data.data.map(buildGuruOption)
    }

    console.error('Failed to fetch guru options:', error)
    return []
  }, [])

  useEffect(() => {
    if (!isEditMode) return

    const fetchData = async () => {
      setFetchingData(true)

      const ekskulResult = await ekstrakurikulerService.getById(id)

      if (ekskulResult.data) {
        const ekskul = ekskulResult.data.data
        setFormData({
          kode: ekskul.kode || '',
          nama: ekskul.nama || '',
          deskripsi: ekskul.deskripsi || '',
          pembina_guru_id: ekskul.pembina_guru_id ? String(ekskul.pembina_guru_id) : (ekskul.pembina_guru?.id ? String(ekskul.pembina_guru.id) : ''),
          hari: ekskul.hari || '',
          jam_mulai: ekskul.jam_mulai || '',
          jam_selesai: ekskul.jam_selesai || '',
          lokasi: ekskul.lokasi || '',
          status: ekskul.status || 'aktif',
        })

        // Pre-populate the selected guru option from the existing data
        if (ekskul.pembina_guru?.id) {
          setSelectedGuruOption(buildGuruOption(ekskul.pembina_guru))
        }
      } else {
        showError('Gagal mengambil data ekstrakurikuler')
        navigate('/ekstrakurikuler')
      }

      setFetchingData(false)
    }

    fetchData()
  }, [id, isEditMode, navigate])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => prev[name] ? { ...prev, [name]: null } : prev)
  }, [])

  const validate = useCallback(() => {
    const newErrors = {}
    if (!formData.kode.trim()) newErrors.kode = 'Kode wajib diisi'
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData.kode, formData.nama])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const submitData = {
      kode: formData.kode,
      nama: formData.nama,
      deskripsi: formData.deskripsi || null,
      pembina_guru_id: formData.pembina_guru_id ? parseInt(formData.pembina_guru_id) : null,
      hari: formData.hari || null,
      jam_mulai: formData.jam_mulai || null,
      jam_selesai: formData.jam_selesai || null,
      lokasi: formData.lokasi || null,
      status: formData.status,
    }

    const result = isEditMode
      ? await ekstrakurikulerService.update(id, submitData)
      : await ekstrakurikulerService.create(submitData)

    const { error } = result

    if (!error) {
      showSuccess(`Ekstrakurikuler berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/ekstrakurikuler')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} ekstrakurikuler`)
      }
    }
    setLoading(false)
  }, [formData, id, isEditMode, navigate, validate])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/ekstrakurikuler')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Ekstrakurikuler' : 'Tambah Ekstrakurikuler Baru'}
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
                  placeholder="Masukkan kode ekskul"
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
                  placeholder="Masukkan nama ekskul"
                  error={errors.nama}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pembina/Guru
                </label>
                <SearchableSelect
                  name="pembina_guru_id"
                  value={formData.pembina_guru_id}
                  onChange={handleChange}
                  options={selectedGuruOption ? [selectedGuruOption] : []}
                  loadOptions={searchGuruOptions}
                  placeholder="Pilih pembina/guru"
                  searchPlaceholder="Cari guru berdasarkan nama..."
                  noOptionsText="Tidak ada guru yang cocok"
                  error={errors.pembina_guru_id}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hari
                </label>
                <SearchableSelect
                  name="hari"
                  value={formData.hari}
                  onChange={handleChange}
                  options={HARI_OPTIONS}
                  placeholder="Pilih hari"
                  error={errors.hari}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jam Mulai
                </label>
                <Input
                  type="time"
                  name="jam_mulai"
                  value={formData.jam_mulai}
                  onChange={handleChange}
                  error={errors.jam_mulai}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jam Selesai
                </label>
                <Input
                  type="time"
                  name="jam_selesai"
                  value={formData.jam_selesai}
                  onChange={handleChange}
                  error={errors.jam_selesai}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lokasi
                </label>
                <Input
                  type="text"
                  name="lokasi"
                  value={formData.lokasi}
                  onChange={handleChange}
                  placeholder="Masukkan lokasi"
                  error={errors.lokasi}
                />
              </div>

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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Deskripsi
                </label>
                <textarea
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleChange}
                  placeholder="Masukkan deskripsi ekskul"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-y"
                />
                {errors.deskripsi && (
                  <p className="mt-1 text-sm text-red-500">{errors.deskripsi}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/ekstrakurikuler')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'ekskul.edit' : 'ekskul.create'}>
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

export default EkstrakurikulerForm
