import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { guruService } from '../services/guruService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'
import { normalizeReferenceCode, safeParseInt } from '../../../utils/referenceUtils'

const GuruForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const { options: jenisKelaminOptions, loading: loadingJK } = useReferenceOptions('jenis_kelamin')

  const { options: pendidikanOptions, loading: loadingPendidikan } = useReferenceOptions('pendidikan_terakhir')

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [formData, setFormData] = useState({
    nip: '',
    nuptk: '',
    nama: '',
    jenis_kelamin: '1',
    tanggal_lahir: '',
    alamat: '',
    no_hp: '',
    email: '',
    pendidikan_terakhir: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isEditMode) {
      fetchGuru()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode])

  const fetchGuru = async () => {
    setFetchingData(true)
    const { data } = await guruService.getById(id)
    if (data) {
      const guru = data.data
      setFormData({
        nip: guru.nip || '',
        nuptk: guru.nuptk || '',
        nama: guru.nama || '',
        // API kadang mengembalikan label ("Laki-Laki") bukan kode ("1").
        jenis_kelamin: normalizeReferenceCode(guru.jenis_kelamin, jenisKelaminOptions),
        tanggal_lahir: guru.tanggal_lahir || '',
        alamat: guru.alamat || '',
        no_hp: guru.no_hp || '',
        email: guru.email || '',
        pendidikan_terakhir: normalizeReferenceCode(guru.pendidikan_terakhir, pendidikanOptions),
      })
    } else {
      showError('Gagal mengambil data guru')
      navigate('/guru')
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
    if (!formData.nip) newErrors.nip = 'NIP wajib diisi'
    if (!formData.nama) newErrors.nama = 'Nama wajib diisi'
    if (!formData.jenis_kelamin) newErrors.jenis_kelamin = 'Jenis kelamin wajib dipilih'
    if (!formData.tanggal_lahir) newErrors.tanggal_lahir = 'Tanggal lahir wajib diisi'
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    const pendidikanTerakhir = formData.pendidikan_terakhir ? safeParseInt(formData.pendidikan_terakhir) : null
    
    const submitData = {
      ...formData,
      // Simpan sebagai kode numerik agar konsisten dengan sys_references.
      jenis_kelamin: safeParseInt(formData.jenis_kelamin),
      pendidikan_terakhir: pendidikanTerakhir,
    }

    let result
    
    if (isEditMode) {
      result = await guruService.update(id, submitData)
    } else {
      result = await guruService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Guru berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/guru')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} guru`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/guru')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Guru' : 'Tambah Guru Baru'}
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
              {/* NIP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  NIP <span className="text-red-500">*</span>
                </label>
                <Input
                  name="nip"
                  value={formData.nip}
                  onChange={handleChange}
                  placeholder="Nomor Induk Pegawai"
                  error={errors.nip}
                />
              </div>

              {/* NUPTK */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  NUPTK
                </label>
                <Input
                  name="nuptk"
                  value={formData.nuptk}
                  onChange={handleChange}
                  placeholder="Nomor Unik Pendidik dan Tenaga Kependidikan"
                  error={errors.nuptk}
                />
              </div>

              {/* Nama */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <Input
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Nama Lengkap Guru"
                  error={errors.nama}
                />
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <select
                  name="jenis_kelamin"
                  value={formData.jenis_kelamin}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  {jenisKelaminOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.jenis_kelamin && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.jenis_kelamin) ? errors.jenis_kelamin[0] : errors.jenis_kelamin}
                  </p>
                )}
              </div>

              {/* Tanggal Lahir */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Lahir <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="tanggal_lahir"
                  value={formData.tanggal_lahir}
                  onChange={handleChange}
                  error={errors.tanggal_lahir}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contoh@email.com"
                  error={errors.email}
                />
              </div>

              {/* No HP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  No. HP
                </label>
                <Input
                  name="no_hp"
                  value={formData.no_hp}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  error={errors.no_hp}
                />
              </div>

              {/* Pendidikan Terakhir */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Pendidikan Terakhir
                </label>
                <select
                  name="pendidikan_terakhir"
                  value={formData.pendidikan_terakhir}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Pilih Pendidikan</option>
                  {pendidikanOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.pendidikan_terakhir && <p className="mt-1 text-sm text-red-500">{errors.pendidikan_terakhir}</p>}
              </div>

              {/* Alamat */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alamat
                </label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Alamat Lengkap"
                />
                {errors.alamat && <p className="mt-1 text-sm text-red-500">{errors.alamat}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/guru')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'guru.edit' : 'guru.create'}>
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

export default GuruForm