import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { bkJenisService } from '../services/bkService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const BkJenisForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    keterangan: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isEditMode) return

    const controller = new AbortController()

    const fetchJenis = async () => {
      setFetchingData(true)
      try {
        const { data } = await bkJenisService.getById(id)
        if (controller.signal.aborted) return

        if (data) {
          const jenis = data.data
          setFormData({
            kode: jenis.kode || '',
            nama: jenis.nama || '',
            keterangan: jenis.keterangan || ''
          })
        } else {
          showError('Gagal mengambil data jenis BK')
          navigate('/bk/jenis')
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Error fetching jenis:', err)
          showError('Gagal mengambil data jenis BK')
          navigate('/bk/jenis')
        }
      } finally {
        if (!controller.signal.aborted) {
          setFetchingData(false)
        }
      }
    }

    fetchJenis()

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
    if (!formData.kode) newErrors.kode = 'Kode wajib diisi'
    if (!formData.nama) newErrors.nama = 'Nama jenis wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    let result
    
    if (isEditMode) {
      result = await bkJenisService.update(id, formData)
    } else {
      result = await bkJenisService.create(formData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Jenis BK berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/bk/jenis')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} jenis BK`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/bk/jenis')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Jenis BK' : 'Tambah Jenis BK'}
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
              {/* Kode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kode <span className="text-red-500">*</span>
                </label>
                <Input
                  name="kode"
                  value={formData.kode}
                  onChange={handleChange}
                  placeholder="Kode jenis BK"
                  maxLength={50}
                  error={errors.kode}
                />
              </div>

              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Jenis <span className="text-red-500">*</span>
                </label>
                <Input
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Nama jenis BK"
                  maxLength={100}
                  error={errors.nama}
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keterangan
                </label>
                <textarea
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Keterangan (opsional)"
                />
                {errors.keterangan && <p className="mt-1 text-sm text-red-500">{errors.keterangan}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/bk/jenis')}>
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

export default BkJenisForm