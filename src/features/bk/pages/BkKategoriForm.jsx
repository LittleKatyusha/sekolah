import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { bkKategoriService } from '../services/bkService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const BkKategoriForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id
  const submitPermission = isEditMode ? 'bk.edit' : 'bk.create'

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [formData, setFormData] = useState({
    nama: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isEditMode) return

    const controller = new AbortController()

    const fetchKategori = async () => {
      setFetchingData(true)
      try {
        const { data } = await bkKategoriService.getById(id)
        if (controller.signal.aborted) return

        if (data) {
          const kategori = data.data
          setFormData({
            nama: kategori.nama || ''
          })
        } else {
          showError('Gagal mengambil data kategori BK')
          navigate('/bk/kategori')
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Error fetching kategori:', err)
          showError('Gagal mengambil data kategori BK')
          navigate('/bk/kategori')
        }
      } finally {
        if (!controller.signal.aborted) {
          setFetchingData(false)
        }
      }
    }

    fetchKategori()

    return () => controller.abort()
  }, [id, isEditMode, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.nama) newErrors.nama = 'Nama kategori wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    let result
    
    if (isEditMode) {
      result = await bkKategoriService.update(id, formData)
    } else {
      result = await bkKategoriService.create(formData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Kategori BK berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/bk/kategori')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} kategori BK`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/bk/kategori')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Kategori BK' : 'Tambah Kategori BK'}
        </h1>
      </div>

      <Card>
        {fetchingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <Input
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Nama kategori BK"
                  maxLength={100}
                  error={errors.nama}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/bk/kategori')}>
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

export default BkKategoriForm