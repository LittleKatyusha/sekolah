import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { anggotaService, organisasiService, jabatanService } from '../services/organisasiService'
import { siswaService } from '../../siswa/services/siswaService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_OPTIONS = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'nonaktif', label: 'Nonaktif' },
]

const AnggotaForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    organisasi_id: '',
    siswa_id: '',
    jabatan_id: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    status: 'aktif',
  })

  const [errors, setErrors] = useState({})
  const [organisasiOptions, setOrganisasiOptions] = useState([])
  const [jabatanOptions, setJabatanOptions] = useState([])
  const [selectedOrganisasiOption, setSelectedOrganisasiOption] = useState(null)
  const [selectedSiswaOption, setSelectedSiswaOption] = useState(null)
  const [selectedJabatanOption, setSelectedJabatanOption] = useState(null)

  const buildOrganisasiOption = useCallback((organisasi) => ({
    value: String(organisasi.id),
    label: organisasi.nama || `Organisasi #${organisasi.id}`
  }), [])

  const buildSiswaOption = useCallback((siswa) => ({
    value: String(siswa.id),
    label: siswa.nama ? `${siswa.nama}${siswa.nis ? ` (${siswa.nis})` : ''}` : `Siswa #${siswa.id}`
  }), [])

  const buildJabatanOption = useCallback((jabatan) => ({
    value: String(jabatan.id),
    label: jabatan.nama || `Jabatan #${jabatan.id}`
  }), [])

  const searchSiswaOptions = useCallback(async (keyword = '') => {
    const { data, error } = await siswaService.getAll({
      search: keyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      return data.data.map(buildSiswaOption)
    }

    console.error('Failed to fetch siswa options:', error)
    return []
  }, [buildSiswaOption])

  const fetchOptions = useCallback(async () => {
    const [orgResult, jabatanResult] = await Promise.all([
      organisasiService.getAktif(),
      jabatanService.getAllList()
    ])

    if (orgResult.data?.data) {
      setOrganisasiOptions(orgResult.data.data.map(buildOrganisasiOption))
    }

    if (jabatanResult.data?.data) {
      setJabatanOptions(jabatanResult.data.data.map(buildJabatanOption))
    }
  }, [buildJabatanOption, buildOrganisasiOption])

  const fetchAnggota = useCallback(async () => {
    setFetchingData(true)
    const { data, error } = await anggotaService.getById(id)
    if (data) {
      const anggota = data.data
      const organisasiId = anggota.organisasi_id ? String(anggota.organisasi_id) : (anggota.organisasi?.id ? String(anggota.organisasi.id) : '')
      const siswaId = anggota.siswa_id ? String(anggota.siswa_id) : (anggota.siswa?.id ? String(anggota.siswa.id) : '')
      const jabatanId = anggota.jabatan_id ? String(anggota.jabatan_id) : (anggota.jabatan?.id ? String(anggota.jabatan.id) : '')

      setFormData({
        organisasi_id: organisasiId,
        siswa_id: siswaId,
        jabatan_id: jabatanId,
        tanggal_mulai: anggota.tanggal_mulai || '',
        tanggal_selesai: anggota.tanggal_selesai || '',
        status: anggota.status || 'aktif',
      })

      if (anggota.organisasi?.id) {
        setSelectedOrganisasiOption(buildOrganisasiOption(anggota.organisasi))
      } else if (organisasiId) {
        setSelectedOrganisasiOption({
          value: organisasiId,
          label: `Organisasi #${organisasiId}`
        })
      } else {
        setSelectedOrganisasiOption(null)
      }

      if (anggota.siswa?.id) {
        setSelectedSiswaOption(buildSiswaOption(anggota.siswa))
      } else if (siswaId) {
        setSelectedSiswaOption({
          value: siswaId,
          label: `Siswa #${siswaId}`
        })
      } else {
        setSelectedSiswaOption(null)
      }

      if (anggota.jabatan?.id) {
        setSelectedJabatanOption(buildJabatanOption(anggota.jabatan))
      } else if (jabatanId) {
        setSelectedJabatanOption({
          value: jabatanId,
          label: `Jabatan #${jabatanId}`
        })
      } else {
        setSelectedJabatanOption(null)
      }
    } else {
      showError('Gagal mengambil data anggota')
      navigate('/organisasi/anggota')
    }
    setFetchingData(false)
  }, [buildJabatanOption, buildOrganisasiOption, buildSiswaOption, id, navigate])

  useEffect(() => {
    fetchOptions()
    if (isEditMode) {
      fetchAnggota()
    }
  }, [fetchAnggota, fetchOptions, isEditMode])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.organisasi_id) newErrors.organisasi_id = 'Organisasi wajib dipilih'
    if (!formData.siswa_id) newErrors.siswa_id = 'Siswa wajib dipilih'
    if (!formData.jabatan_id) newErrors.jabatan_id = 'Jabatan wajib dipilih'
    if (!formData.tanggal_mulai) newErrors.tanggal_mulai = 'Tanggal mulai wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    let result

    if (isEditMode) {
      const updateData = {
        jabatan_id: parseInt(formData.jabatan_id),
        tanggal_mulai: formData.tanggal_mulai,
        tanggal_selesai: formData.tanggal_selesai || null,
        status: formData.status || 'aktif',
      }
      result = await anggotaService.update(id, updateData)
    } else {
      const submitData = {
        organisasi_id: parseInt(formData.organisasi_id),
        siswa_id: parseInt(formData.siswa_id),
        jabatan_id: parseInt(formData.jabatan_id),
        tanggal_mulai: formData.tanggal_mulai,
        tanggal_selesai: formData.tanggal_selesai || null,
        status: formData.status || 'aktif',
      }
      result = await anggotaService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Anggota berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/organisasi/anggota')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} anggota`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/organisasi/anggota')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Anggota Organisasi' : 'Tambah Anggota Organisasi'}
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
                  Organisasi <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="organisasi_id"
                  value={formData.organisasi_id}
                  onChange={handleChange}
                  options={selectedOrganisasiOption ? [selectedOrganisasiOption, ...organisasiOptions] : organisasiOptions}
                  placeholder="Pilih organisasi"
                  error={errors.organisasi_id}
                  disabled={isEditMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Siswa <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="siswa_id"
                  value={formData.siswa_id}
                  onChange={handleChange}
                  options={selectedSiswaOption ? [selectedSiswaOption] : []}
                  loadOptions={searchSiswaOptions}
                  placeholder="Pilih siswa"
                  searchPlaceholder="Cari siswa berdasarkan nama atau NIS..."
                  noOptionsText="Tidak ada siswa yang cocok"
                  error={errors.siswa_id}
                  disabled={isEditMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jabatan <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="jabatan_id"
                  value={formData.jabatan_id}
                  onChange={handleChange}
                  options={selectedJabatanOption ? [selectedJabatanOption, ...jabatanOptions] : jabatanOptions}
                  placeholder="Pilih jabatan"
                  error={errors.jabatan_id}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Selesai
                </label>
                <Input
                  type="date"
                  name="tanggal_selesai"
                  value={formData.tanggal_selesai}
                  onChange={handleChange}
                  error={errors.tanggal_selesai}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/organisasi/anggota')}>
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

export default AnggotaForm