import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import Input from '../../../components/ui/Input'
import { mapelService } from '../services/mapelService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const MapelForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [formData, setFormData] = useState({
    kode: '',
    nama: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEditMode) {
      fetchMapel()
    }
  }, [id])

  const fetchMapel = async () => {
    setFetchingData(true)
    const { data, error } = await mapelService.getMapelById(id)
    if (data) {
      const mapel = data.data
      setFormData({
        kode: mapel.kode || '',
        nama: mapel.nama || ''
      })
    } else {
      showError('Gagal mengambil data mata pelajaran')
      navigate('/mapel')
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
    if (!formData.kode) newErrors.kode = 'Kode mata pelajaran wajib diisi'
    if (!formData.nama) newErrors.nama = 'Nama mata pelajaran wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    let result
    
    if (isEditMode) {
      result = await mapelService.updateMapel(id, formData)
    } else {
      result = await mapelService.createMapel(formData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Mata pelajaran berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/mapel')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} mata pelajaran`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/mapel')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
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
              {/* Kode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kode <span className="text-red-500">*</span>
                </label>
                <Input
                  name="kode"
                  value={formData.kode}
                  onChange={handleChange}
                  placeholder="Kode Mata Pelajaran (mis: BI)"
                  error={errors.kode}
                />
              </div>

              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Mata Pelajaran <span className="text-red-500">*</span>
                </label>
                <Input
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Nama Mata Pelajaran (mis: Bahasa Indonesia)"
                  error={errors.nama}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/mapel')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'mapel.update' : 'mapel.create'}>
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

export default MapelForm
