import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { kalenderAkademikService } from '../services/kalenderAkademikService'
import { tahunAjaranService } from '../../tahun-ajaran/services/tahunAjaranService'
import { semesterService } from '../../semester/services/semesterService'
import { roleService } from '../../roles/services/rolesService'
import { kelasService } from '../../kelas/services/kelasService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const VISIBILITY_OPTIONS = [
  { value: 'GLOBAL', label: 'Global' },
  { value: 'ROLE', label: 'Role' },
  { value: 'KELAS', label: 'Kelas' },
  { value: 'JURUSAN', label: 'Jurusan' },
  { value: 'CUSTOM', label: 'Custom' },
]

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
]

const KalenderAkademikForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    tahun_ajaran_id: '',
    semester_id: '',
    tipe_id: '',
    judul: '',
    deskripsi: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    is_all_day: true,
    is_recurring: false,
    recurring_rule: '',
    lokasi: '',
    visibility: 'GLOBAL',
    status: 'DRAFT',
    roles: [],
    kelas: [],
  })

  const [errors, setErrors] = useState({})
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState([])
  const [semesterOptions, setSemesterOptions] = useState([])
  const [tipeOptions, setTipeOptions] = useState([])
  const [roleOptions, setRoleOptions] = useState([])
  const [kelasOptions, setKelasOptions] = useState([])

  useEffect(() => {
    fetchDropdownOptions()
    if (isEditMode) {
      fetchKalender()
    }
  }, [id])

  const fetchDropdownOptions = async () => {
    const [tahunResult, semesterResult, tipeResult, rolesResult, kelasResult] = await Promise.all([
      tahunAjaranService.getAll({ per_page: 100 }),
      semesterService.getAll({ per_page: 100 }),
      kalenderAkademikService.getAllTipe({ per_page: 100 }),
      roleService.getAll({ per_page: 200 }),
      kelasService.getAll({ per_page: 200 }),
    ])

    if (tahunResult.data) {
      const list = tahunResult.data?.data || []
      setTahunAjaranOptions(list.map(item => ({
        value: String(item.id),
        label: item.nama || item.tahun_ajaran || `Tahun Ajaran #${item.id}`
      })))
    }

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

    if (rolesResult.data) {
      const list = rolesResult.data?.data || rolesResult.data?.data?.data || []
      setRoleOptions(Array.isArray(list) ? list : [])
    }

    if (kelasResult.data) {
      const list = kelasResult.data?.data || kelasResult.data?.data?.data || []
      setKelasOptions(Array.isArray(list) ? list : [])
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
        tahun_ajaran_id: kalender.tahun_ajaran_id ? String(kalender.tahun_ajaran_id) : '',
        semester_id: kalender.semester_id ? String(kalender.semester_id) : '',
        tipe_id: kalender.tipe_id ? String(kalender.tipe_id) : '',
        judul: kalender.judul || '',
        deskripsi: kalender.deskripsi || '',
        tanggal_mulai: formatDateForInput(kalender.tanggal_mulai),
        tanggal_selesai: formatDateForInput(kalender.tanggal_selesai),
        is_all_day: kalender.is_all_day ?? true,
        is_recurring: kalender.is_recurring ?? false,
        recurring_rule: kalender.recurring_rule || '',
        lokasi: kalender.lokasi || '',
        visibility: kalender.visibility || 'GLOBAL',
        status: kalender.status || 'DRAFT',
        roles: Array.isArray(kalender.roles) ? kalender.roles.map(r => r.role_id ?? r.id) : [],
        kelas: Array.isArray(kalender.kelas) ? kalender.kelas.map(k => k.kelas_id ?? k.id) : [],
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

  const handleAudienceToggle = (field, id) => {
    setFormData(prev => {
      const current = prev[field] || []
      const numId = Number(id)
      return {
        ...prev,
        [field]: current.includes(numId)
          ? current.filter(i => i !== numId)
          : [...current, numId],
      }
    })
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.judul.trim()) newErrors.judul = 'Judul wajib diisi'
    if (!formData.tahun_ajaran_id) newErrors.tahun_ajaran_id = 'Tahun Ajaran wajib dipilih'
    if (!formData.tipe_id) newErrors.tipe_id = 'Tipe wajib dipilih'
    if (!formData.tanggal_mulai) newErrors.tanggal_mulai = 'Tanggal mulai wajib diisi'
    if (!formData.tanggal_selesai) newErrors.tanggal_selesai = 'Tanggal selesai wajib diisi'
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
      tahun_ajaran_id: parseInt(formData.tahun_ajaran_id),
      semester_id: formData.semester_id ? parseInt(formData.semester_id) : null,
      tipe_id: parseInt(formData.tipe_id),
      judul: formData.judul,
      deskripsi: formData.deskripsi || null,
      tanggal_mulai: formData.tanggal_mulai,
      tanggal_selesai: formData.tanggal_selesai,
      is_all_day: formData.is_all_day,
      is_recurring: formData.is_recurring,
      recurring_rule: formData.recurring_rule || null,
      lokasi: formData.lokasi || null,
      visibility: formData.visibility,
    }

    // Audience fields
    if (['ROLE', 'CUSTOM'].includes(formData.visibility)) {
      submitData.roles = formData.roles
    }
    if (['KELAS', 'CUSTOM'].includes(formData.visibility)) {
      submitData.kelas = formData.kelas
    }

    // Include status only on update
    if (isEditMode) {
      submitData.status = formData.status
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

              {/* Tahun Ajaran */}
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

              {/* Semester */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Semester
                </label>
                <SearchableSelect
                  name="semester_id"
                  value={formData.semester_id}
                  onChange={handleChange}
                  options={semesterOptions}
                  placeholder="Pilih semester (opsional)"
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

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Visibility
                </label>
                <SearchableSelect
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleChange}
                  options={VISIBILITY_OPTIONS}
                  placeholder="Pilih visibility"
                  error={errors.visibility}
                />
              </div>

              {/* Audience: Role (visible when visibility=ROLE or CUSTOM) */}
              {['ROLE', 'CUSTOM'].includes(formData.visibility) && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Role <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                    {roleOptions.map(role => {
                      const id = role.id
                      const checked = formData.roles.includes(Number(id))
                      return (
                        <label key={id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleAudienceToggle('roles', id)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {role.name || role.nama || `Role #${id}`}
                          </span>
                        </label>
                      )
                    })}
                    {roleOptions.length === 0 && (
                      <span className="text-sm text-gray-400 col-span-full">Tidak ada data role</span>
                    )}
                  </div>
                  {formData.roles.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formData.roles.length} role dipilih
                    </p>
                  )}
                </div>
              )}

              {/* Audience: Kelas (visible when visibility=KELAS or CUSTOM) */}
              {['KELAS', 'CUSTOM'].includes(formData.visibility) && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Kelas <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                    {kelasOptions.map(kelas => {
                      const id = kelas.id
                      const checked = formData.kelas.includes(Number(id))
                      return (
                        <label key={id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleAudienceToggle('kelas', id)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {kelas.nama_kelas || kelas.nama || `Kelas #${id}`}
                          </span>
                        </label>
                      )
                    })}
                    {kelasOptions.length === 0 && (
                      <span className="text-sm text-gray-400 col-span-full">Tidak ada data kelas</span>
                    )}
                  </div>
                  {formData.kelas.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formData.kelas.length} kelas dipilih
                    </p>
                  )}
                </div>
              )}

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