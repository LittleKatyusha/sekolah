import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, BookOpen } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { bukuService } from '../services/perpustakaanService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { usePageTitle } from '../../../hooks/usePageTitle'

const BukuForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  usePageTitle(isEditMode ? 'Edit Buku' : 'Tambah Buku')

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [formData, setFormData] = useState({
  isbn: '',
  judul: '',
  penulis: '',
  penerbit: '',
  tahun: '',
  stok: '',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEditMode) {
      fetchBuku()
    }
  }, [id])

  const fetchBuku = async () => {
    setFetchingData(true)
    const { data, error } = await bukuService.getById(id)
    if (data) {
      const buku = data.data
      setFormData({
      isbn: buku.isbn || '',
      judul: buku.judul || '',
      penulis: buku.penulis || '',
      penerbit: buku.penerbit || '',
      tahun: buku.tahun || '',
      stok: buku.stok || '',
      })
    } else {
      showError('Gagal mengambil data buku')
      navigate('/perpustakaan/buku')
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
    
    // Required field validation
    if (!formData.judul.trim()) {
      newErrors.judul = 'Judul wajib diisi'
    } else if (formData.judul.length > 200) {
      newErrors.judul = 'Judul maksimal 200 karakter'
    }
    
    // ISBN validation (max 20 chars)
    if (formData.isbn && formData.isbn.length > 20) {
      newErrors.isbn = 'ISBN maksimal 20 karakter'
    }
    
    // Penulis validation (max 100 chars)
    if (formData.penulis && formData.penulis.length > 100) {
      newErrors.penulis = 'Penulis maksimal 100 karakter'
    }
    
    // Penerbit validation (max 100 chars)
    if (formData.penerbit && formData.penerbit.length > 100) {
      newErrors.penerbit = 'Penerbit maksimal 100 karakter'
    }
    
    // Tahun validation
    if (formData.tahun) {
    const year = parseInt(formData.tahun)
    const currentYear = new Date().getFullYear()
    if (isNaN(year) || year < 1900 || year > currentYear) {
    newErrors.tahun = `Tahun harus antara 1900 dan ${currentYear}`
    }
    }
   
    // Stok validation
    if (formData.stok) {
    const stok = parseInt(formData.stok)
    if (isNaN(stok) || stok < 0) {
    newErrors.stok = 'Stok minimal 0'
    }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    // Convert numeric fields
    const submitData = {
    ...formData,
    isbn: formData.isbn || null,
    penulis: formData.penulis || null,
    penerbit: formData.penerbit || null,
    tahun: formData.tahun ? parseInt(formData.tahun) : null,
    stok: formData.stok ? parseInt(formData.stok) : null,
    }

    let result
    
    if (isEditMode) {
      result = await bukuService.update(id, submitData)
    } else {
      result = await bukuService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Buku berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/perpustakaan/buku')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} buku`)
      }
    }
    setLoading(false)
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/perpustakaan/buku')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <div className="flex items-center gap-3">
          <BookOpen size={24} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Buku' : 'Tambah Buku Baru'}
          </h1>
        </div>
      </div>

      <Card>
        {fetchingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ISBN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ISBN
                </label>
                <Input
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                  placeholder="Nomor ISBN"
                  error={errors.isbn}
                />
              </div>

              {/* Judul */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Judul <span className="text-red-500">*</span>
                </label>
                <Input
                  name="judul"
                  value={formData.judul}
                  onChange={handleChange}
                  placeholder="Judul Buku"
                  error={errors.judul}
                />
              </div>

              {/* Penulis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Penulis
                </label>
                <Input
                  name="penulis"
                  value={formData.penulis}
                  onChange={handleChange}
                  placeholder="Nama Penulis"
                  error={errors.penulis}
                />
              </div>

              {/* Penerbit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Penerbit
                </label>
                <Input
                  name="penerbit"
                  value={formData.penerbit}
                  onChange={handleChange}
                  placeholder="Nama Penerbit"
                  error={errors.penerbit}
                />
              </div>

              {/* Tahun */}
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tahun
              </label>
              <input
              type="number"
              name="tahun"
              value={formData.tahun}
              onChange={handleChange}
              min="1900"
              max={currentYear}
              placeholder={`1900 - ${currentYear}`}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              {errors.tahun && (
              <p className="mt-1 text-sm text-red-500">{errors.tahun}</p>
              )}
              </div>

              {/* Stok */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stok
                </label>
                <input
                  type="number"
                  name="stok"
                  value={formData.stok}
                  onChange={handleChange}
                  min="0"
                  placeholder="Jumlah stok"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                {errors.stok && (
                  <p className="mt-1 text-sm text-red-500">{errors.stok}</p>
                )}
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/perpustakaan/buku')}>
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

export default BukuForm