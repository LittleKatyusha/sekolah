import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { kriteriaService } from '../services/spkService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const TIPE_OPTIONS = [
  { value: 'benefit', label: 'Benefit' },
  { value: 'cost', label: 'Cost' },
]

const KriteriaForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    kode_kriteria: '',
    nama_kriteria: '',
    bobot: '',
    tipe: 'benefit',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEditMode) {
      fetchKriteria()
    }
  }, [id])

  const fetchKriteria = async () => {
    setFetchingData(true)
    const { data, error } = await kriteriaService.getById(id)
    if (data) {
      const kriteria = data.data
      setFormData({
        kode_kriteria: kriteria.kode_kriteria || '',
        nama_kriteria: kriteria.nama_kriteria || '',
        bobot: kriteria.bobot != null ? String(kriteria.bobot) : '',
        tipe: kriteria.tipe || 'benefit',
      })
    } else {
      showError('Gagal mengambil data kriteria')
      navigate('/spk/kriteria')
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
    if (!formData.kode_kriteria.trim()) newErrors.kode_kriteria = 'Kode kriteria wajib diisi'
    if (!formData.nama_kriteria.trim()) newErrors.nama_kriteria = 'Nama kriteria wajib diisi'
    if (!formData.bobot) newErrors.bobot = 'Bobot wajib diisi'
    if (!formData.tipe) newErrors.tipe = 'Tipe wajib dipilih'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const submitData = {
      kode_kriteria: formData.kode_kriteria,
      nama_kriteria: formData.nama_kriteria,
      bobot: parseFloat(formData.bobot),
      tipe: formData.tipe,
    }

    let result
    if (isEditMode) {
      result = await kriteriaService.update(id, submitData)
    } else {
      result = await kriteriaService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Kriteria berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/spk/kriteria')
    } else {
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} kriteria`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/spk/kriteria')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Kriteria' : 'Tambah Kriteria Baru'}
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
                  Kode Kriteria <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="kode_kriteria"
                  value={formData.kode_kriteria}
                  onChange={handleChange}
                  placeholder="Masukkan kode kriteria (cth: C1)"
                  error={errors.kode_kriteria}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Kriteria <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="nama_kriteria"
                  value={formData.nama_kriteria}
                  onChange={handleChange}
                  placeholder="Masukkan nama kriteria"
                  error={errors.nama_kriteria}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bobot <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="bobot"
                  value={formData.bobot}
                  onChange={handleChange}
                  placeholder="Masukkan bobot (cth: 0.25)"
                  step="0.01"
                  error={errors.bobot}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipe <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="tipe"
                  value={formData.tipe}
                  onChange={handleChange}
                  options={TIPE_OPTIONS}
                  placeholder="Pilih tipe kriteria"
                  error={errors.tipe}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/spk/kriteria')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'spk.edit' : 'spk.create'}>
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

export default KriteriaForm