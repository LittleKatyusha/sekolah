import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { kalenderAkademikService } from '../services/kalenderAkademikService'
import { semesterService } from '../../semester/services/semesterService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_OPTIONS = [
  { value: '0', label: 'Cancelled' },
  { value: '1', label: 'Active' },
  { value: '2', label: 'Completed' },
]

const KalenderAkademikForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    semester_id: '',
    tipe_id: '',
    judul: '',
    deskripsi: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    waktu_mulai: '',
    waktu_selesai: '',
    is_all_day: true,
    is_recurring: false,
    recurring_rule: '',
    lokasi: '',
    status: '1',
    prioritas: '2',
  })

  const [errors, setErrors] = useState({})
  const [semesterOptions, setSemesterOptions] = useState([])
  const [tipeOptions, setTipeOptions] = useState([])

  useEffect(() => {
    fetchDropdownOptions()
    if (isEditMode) {
      fetchKalender()
    }
  }, [id])

  const fetchDropdownOptions = async () => {
    const [semesterResult, tipeResult] = await Promise.all([
      semesterService.getAll({ per_page: 100 }),
      kalenderAkademikService.getAllTipe({ per_page: 100 }),
    ])

    if (semesterResult.data) {
      const list = semesterResult.data?.data || []
      setSemesterOptions(list.map(item => ({
        value: String(item.id),
        label: item.nama || item.semester || `Semester #${item.id}`
      })))
    }

    if (tipeResult.data) {
      const list = tipeResult.data?.data || []
      setTipeOptions(list.map(item => ({
        value: String(item.id),
        label: item.nama || item.kode || `Tipe #${item.id}`
      })))
    }

  }

  const fetchKalender = async () => {
    setFetchingData(true)
    const { data, error } = await kalenderAkademikService.getById(id)
    if (data) {
      const kalender = data.data
      const formatDateForInput = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toISOString().split('T')[0]
      }

      setFormData({
        semester_id: kalender.semester_id ? String(kalender.semester_id) : '',
        tipe_id: kalender.tipe_id ? String(kalender.tipe_id) : '',
        judul: kalender.judul || '',
        deskripsi: kalender.deskripsi || '',
        tanggal_mulai: formatDateForInput(kalender.tanggal_mulai),
        tanggal_selesai: formatDateForInput(kalender.tanggal_selesai),
        waktu_mulai: kalender.waktu_mulai || '',
        waktu_selesai: kalender.waktu_selesai || '',
        is_all_day: kalender.is_all_day ?? true,
        is_recurring: kalender.is_recurring ?? false,
        recurring_rule: kalender.recurring_rule || '',
        lokasi: kalender.lokasi || '',
        status: String(kalender.status ?? 1),
        prioritas: String(kalender.prioritas ?? 2),
      })
    } else {
      showError('Gagal mengambil data kalender akademik')
      navigate('/admin/kalender-akademik')
    }
    setFetchingData(false)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }


  const validate = () => {
    const newErrors = {}
    if (!formData.judul.trim()) newErrors.judul = 'Judul wajib diisi'
    if (!formData.semester_id) newErrors.semester_id = 'Semester wajib dipilih'
    if (!formData.tipe_id) newErrors.tipe_id = 'Tipe wajib dipilih'
    if (!formData.tanggal_mulai) newErrors.tanggal_mulai = 'Tanggal mulai wajib diisi'
    if (formData.tanggal_mulai && formData.tanggal_selesai && formData.tanggal_selesai < formData.tanggal_mulai) {
      newErrors.tanggal_selesai = 'Tanggal selesai harus setelah tanggal mulai'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)

    const submitData = {
      semester_id: parseInt(formData.semester_id),
      tipe_id: parseInt(formData.tipe_id),
      judul: formData.judul,
      deskripsi: formData.deskripsi || null,
      tanggal_mulai: formData.tanggal_mulai,
      tanggal_selesai: formData.tanggal_selesai || null,
      waktu_mulai: formData.waktu_mulai || null,
      waktu_selesai: formData.waktu_selesai || null,
      is_all_day: formData.is_all_day,
      is_recurring: formData.is_recurring,
      recurring_rule: formData.recurring_rule || null,
      lokasi: formData.lokasi || null,
      status: parseInt(formData.status),
      prioritas: parseInt(formData.prioritas),
    }

    // Include status only on update
    if (isEditMode) {
      submitData.status = parseInt(formData.status)
    }

    let result

    if (isEditMode) {
      result = await kalenderAkademikService.update(id, submitData)
    } else {
      result = await kalenderAkademikService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Kalender akademik berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/admin/kalender-akademik')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} kalender akademik`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/admin/kalender-akademik')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Kalender Akademik' : 'Tambah Event Baru'}
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
              {/* Judul */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Judul <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="judul"
                  value={formData.judul}
                  onChange={handleChange}
                  placeholder="Masukkan judul event"
                  error={errors.judul}
                />
              </div>

              {/* Semester */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Semester <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="semester_id"
                  value={formData.semester_id}
                  onChange={handleChange}
                  options={semesterOptions}
                  placeholder="Pilih semester"
                  error={errors.semester_id}
                />
              </div>

              {/* Tipe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipe <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="tipe_id"
                  value={formData.tipe_id}
                  onChange={handleChange}
                  options={tipeOptions}
                  placeholder="Pilih tipe kalender"
                  error={errors.tipe_id}
                />
              </div>

              {/* Tanggal Mulai */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="tanggal_mulai"
                  value={formData.tanggal_mulai}
                  onChange={handleChange}
                  error={errors.tanggal_mulai}
                />
              </div>

              {/* Tanggal Selesai */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Selesai <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="tanggal_selesai"
                  value={formData.tanggal_selesai}
                  onChange={handleChange}
                  error={errors.tanggal_selesai}
                />
              </div>

              {/* Lokasi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lokasi
                </label>
                <Input
                  type="text"
                  name="lokasi"
                  value={formData.lokasi}
                  onChange={handleChange}
                  placeholder="Lokasi event (opsional)"
                  error={errors.lokasi}
                />
              </div>

              {/* Status (only on edit) */}
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

              {/* Checkboxes */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_all_day"
                    checked={formData.is_all_day}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Sepanjang Hari</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_recurring"
                    checked={formData.is_recurring}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Berulang</span>
                </label>
              </div>

              {/* Recurring Rule (shown only if is_recurring) */}
              {formData.is_recurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Aturan Pengulangan
                  </label>
                  <Input
                    type="text"
                    name="recurring_rule"
                    value={formData.recurring_rule}
                    onChange={handleChange}
                    placeholder="Contoh: FREQ=WEEKLY;BYDAY=MO"
                    error={errors.recurring_rule}
                  />
                </div>
              )}

              {/* Deskripsi */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Deskripsi
                </label>
                <textarea
                  name="deskripsi"
                  value={formData.deskripsi}
                  onChange={handleChange}
                  placeholder="Masukkan deskripsi event"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-y"
                />
                {errors.deskripsi && (
                  <p className="mt-1 text-sm text-red-500">{errors.deskripsi}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/kalender-akademik')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'kalender-akademik.edit' : 'kalender-akademik.create'}>
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

export default KalenderAkademikForm