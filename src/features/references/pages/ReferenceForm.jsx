import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import Input from '../../../components/ui/Input'
import { referenceAdminService } from '../services/referenceAdminService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const ReferenceForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [formData, setFormData] = useState({
    kategori: '',
    kode: '',
    nama: '',
    urutan: 0,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEditMode) fetchReference()
  }, [id])

  const fetchReference = async () => {
    setFetchingData(true)
    const { data, error } = await referenceAdminService.getById(id)
    if (data) {
      const ref = data.data
      setFormData({
        kategori: ref.kategori || '',
        kode: ref.kode || '',
        nama: ref.nama || '',
        urutan: ref.urutan || 0,
      })
    } else {
      showError('Gagal mengambil data referensi')
      navigate('/admin/references')
    }
    setFetchingData(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === 'urutan' ? parseInt(value) || 0 : value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.kategori) newErrors.kategori = 'Kategori wajib diisi'
    if (!formData.kode) newErrors.kode = 'Kode wajib diisi'
    if (!formData.nama) newErrors.nama = 'Nama wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    const result = isEditMode
      ? await referenceAdminService.update(id, formData)
      : await referenceAdminService.create(formData)

    const { error } = result
    if (!error) {
      showSuccess(`Referensi berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/admin/references')
    } else {
      if (error.errors) setErrors(error.errors)
      else showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} referensi`)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/admin/references')}>
          <ArrowLeft size={18} className="mr-2" /> Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Referensi' : 'Tambah Referensi Baru'}
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
                  Kategori <span className="text-red-500">*</span>
                </label>
                <Input name="kategori" value={formData.kategori} onChange={handleChange} placeholder="Contoh: jenis_kelamin" error={errors.kategori} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kode <span className="text-red-500">*</span>
                </label>
                <Input name="kode" value={formData.kode} onChange={handleChange} placeholder="Contoh: L" error={errors.kode} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama <span className="text-red-500">*</span>
                </label>
                <Input name="nama" value={formData.nama} onChange={handleChange} placeholder="Contoh: Laki-Laki" error={errors.nama} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Urutan</label>
                <Input type="number" name="urutan" value={formData.urutan} onChange={handleChange} placeholder="0" error={errors.urutan} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/references')}>Batal</Button>
              <PermissionGuard permission="sys-reference.manage">
                <Button type="submit" disabled={loading}>
                  <Save size={18} className="mr-2" /> {loading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </PermissionGuard>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

export default ReferenceForm
