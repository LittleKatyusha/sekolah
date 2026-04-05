import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'
import { organisasiService } from '../services/organisasiService'
import { guruService } from '../../guru/services/guruService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const OrganisasiForm = () => {
  const { options: statusOptions } = useReferenceOptions('status_organisasi')
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
    periode_mulai: '',
    periode_selesai: '',
    status: 'aktif',
  })

  const [errors, setErrors] = useState({})
  const [guruOptions, setGuruOptions] = useState([])

  useEffect(() => {
    fetchGuruOptions()
    if (isEditMode) {
      fetchOrganisasi()
    }
  }, [id])

  const fetchGuruOptions = async () => {
    const { data } = await guruService.getAll({ per_page: 100 })
    if (data?.data) {
      setGuruOptions(data.data.map(g => ({
        value: String(g.id),
        label: g.nama || `Guru #${g.id}`
      })))
    }
  }

  const fetchOrganisasi = async () => {
    setFetchingData(true)
    const { data, error } = await organisasiService.getById(id)
    if (data) {
      const org = data.data
      setFormData({
        kode: org.kode || '',
        nama: org.nama || '',
        deskripsi: org.deskripsi || '',
        pembina_guru_id: org.pembina_guru_id ? String(org.pembina_guru_id) : (org.pembina?.id ? String(org.pembina.id) : ''),
        periode_mulai: org.periode_mulai ? String(org.periode_mulai) : '',
        periode_selesai: org.periode_selesai ? String(org.periode_selesai) : '',
        status: org.status || 'aktif',
      })
    } else {
      showError('Gagal mengambil data organisasi')
      navigate('/organisasi')
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
    if (!formData.kode.trim()) newErrors.kode = 'Kode wajib diisi'
    if (!formData.nama.trim()) newErrors.nama = 'Nama wajib diisi'
    if (!formData.periode_mulai) newErrors.periode_mulai = 'Periode mulai wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const submitData = {
      kode: formData.kode,
      nama: formData.nama,
      deskripsi: formData.deskripsi || null,
      pembina_guru_id: formData.pembina_guru_id ? parseInt(formData.pembina_guru_id) : null,
      periode_mulai: parseInt(formData.periode_mulai),
      periode_selesai: formData.periode_selesai ? parseInt(formData.periode_selesai) : null,
      status: formData.status || 'aktif',
    }

    let result
    if (isEditMode) {
      result = await organisasiService.update(id, submitData)
    } else {
      result = await organisasiService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Organisasi berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/organisasi')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} organisasi`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/organisasi')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Organisasi' : 'Tambah Organisasi Baru'}
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
                  placeholder="Masukkan kode organisasi"
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
                  placeholder="Masukkan nama organisasi"
                  error={errors.nama}
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
                  placeholder="Masukkan deskripsi organisasi"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-y"
                />
                {errors.deskripsi && (
                  <p className="mt-1 text-sm text-red-500">{errors.deskripsi}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pembina (Guru)
                </label>
                <SearchableSelect
                  name="pembina_guru_id"
                  value={formData.pembina_guru_id}
                  onChange={handleChange}
                  options={guruOptions}
                  placeholder="Pilih guru pembina"
                  error={errors.pembina_guru_id}
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
                  options={statusOptions}
                  placeholder="Pilih status"
                  error={errors.status}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Periode Mulai (Tahun) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="periode_mulai"
                  value={formData.periode_mulai}
                  onChange={handleChange}
                  placeholder="Contoh: 2024"
                  error={errors.periode_mulai}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Periode Selesai (Tahun)
                </label>
                <Input
                  type="number"
                  name="periode_selesai"
                  value={formData.periode_selesai}
                  onChange={handleChange}
                  placeholder="Contoh: 2025"
                  error={errors.periode_selesai}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/organisasi')}>
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

export default OrganisasiForm