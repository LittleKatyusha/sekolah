import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import FileUpload from '../../../components/ui/FileUpload'
import { siswaService } from '../services/siswaService'
import { kelasService } from '../../kelas/services/kelasService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'

const GOLONGAN_DARAH_OPTIONS = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'AB', label: 'AB' },
  { value: 'O', label: 'O' }
]

const STATUS_OPTIONS = [
  { value: 'Aktif', label: 'Aktif' },
  { value: 'Lulus', label: 'Lulus' },
  { value: 'Keluar', label: 'Keluar' },
  { value: 'Pindah', label: 'Pindah' }
]

const SiswaForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const { options: jenisKelaminOptions } = useReferenceOptions('jenis_kelamin', [
    { value: '1', label: 'Laki-Laki' },
    { value: '2', label: 'Perempuan' },
  ])
  const { options: agamaOptions } = useReferenceOptions('agama', [
    { value: '1', label: 'Islam' },
    { value: '2', label: 'Kristen' },
    { value: '3', label: 'Katholik' },
    { value: '4', label: 'Hindu' },
    { value: '5', label: 'Budha' },
    { value: '6', label: 'Konghucu' },
    { value: '7', label: 'Kepercayaan' },
  ])

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [kelasOptions, setKelasOptions] = useState([])
  
  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    nik: '',
    nama: '',
    jenis_kelamin: 'Laki-Laki',
    tempat_lahir: '',
    tanggal_lahir: '',
    agama: '',
    alamat: '',
    email: '',
    no_hp: '',
    golongan_darah: '',
    tinggi_badan: '',
    berat_badan: '',
    tanggal_masuk: '',
    asal_sekolah: '',
    anak_ke: '',
    mst_kelas_id: '',
    status: 'Aktif',
    foto: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchKelasOptions()
    if (isEditMode) {
      fetchSiswa()
    }
  }, [id])

  const fetchKelasOptions = async () => {
    const { data } = await kelasService.getAll()
    if (data) {
      setKelasOptions(data.data || [])
    }
  }

  const fetchSiswa = async () => {
    setFetchingData(true)
    const { data, error } = await siswaService.getById(id)
    if (data) {
      const siswa = data.data
      setFormData({
        nis: siswa.nis || '',
        nisn: siswa.nisn || '',
        nik: siswa.nik || '',
        nama: siswa.nama || '',
        jenis_kelamin: siswa.jenis_kelamin || 'Laki-Laki',
        tempat_lahir: siswa.tempat_lahir || '',
        tanggal_lahir: siswa.tanggal_lahir || '',
        agama: siswa.agama || '',
        alamat: siswa.alamat || '',
        email: siswa.email || '',
        no_hp: siswa.no_hp || '',
        golongan_darah: siswa.golongan_darah || '',
        tinggi_badan: siswa.tinggi_badan || '',
        berat_badan: siswa.berat_badan || '',
        tanggal_masuk: siswa.tanggal_masuk || '',
        asal_sekolah: siswa.asal_sekolah || '',
        anak_ke: siswa.anak_ke || '',
        mst_kelas_id: siswa.kelas?.id || '',
        status: siswa.status || 'Aktif',
        foto: siswa.foto || ''
      })
    } else {
      showError('Gagal mengambil data siswa')
      navigate('/siswa')
    }
    setFetchingData(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.nis) newErrors.nis = 'NIS wajib diisi'
    if (!formData.nama) newErrors.nama = 'Nama wajib diisi'
    if (!formData.mst_kelas_id) newErrors.mst_kelas_id = 'Kelas wajib dipilih'
    if (!formData.jenis_kelamin) newErrors.jenis_kelamin = 'Jenis kelamin wajib dipilih'
    
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

    // Build submit data, converting empty strings to null for optional fields
    const submitData = {
      ...formData,
      nisn: formData.nisn || null,
      nik: formData.nik || null,
      tempat_lahir: formData.tempat_lahir || null,
      agama: formData.agama || null,
      alamat: formData.alamat || null,
      email: formData.email || null,
      no_hp: formData.no_hp || null,
      golongan_darah: formData.golongan_darah || null,
      tinggi_badan: formData.tinggi_badan ? Number(formData.tinggi_badan) : null,
      berat_badan: formData.berat_badan ? Number(formData.berat_badan) : null,
      tanggal_masuk: formData.tanggal_masuk || null,
      asal_sekolah: formData.asal_sekolah || null,
      anak_ke: formData.anak_ke ? Number(formData.anak_ke) : null,
    }

    // Remove foto if empty
    if (!submitData.foto) {
      delete submitData.foto
    }

    let result
    
    if (isEditMode) {
      result = await siswaService.update(id, submitData)
    } else {
      result = await siswaService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Siswa berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/siswa')
    } else {
      console.error(error)
      // Handle server-side validation errors
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} siswa`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/siswa')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Siswa' : 'Tambah Siswa Baru'}
        </h1>
      </div>

      <Card>
        {fetchingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Foto Profil */}
            <div>
              <FileUpload
                label="Foto Profil"
                onUpload={(path) => setFormData(prev => ({ ...prev, foto: path }))}
                accept="image/*"
                previewUrl={formData.foto}
              />
            </div>

            {/* Identitas */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Identitas Siswa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* NIS */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    NIS <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="nis"
                    value={formData.nis}
                    onChange={handleChange}
                    placeholder="Nomor Induk Siswa"
                    error={errors.nis}
                  />
                </div>

                {/* NISN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    NISN
                  </label>
                  <Input
                    name="nisn"
                    value={formData.nisn}
                    onChange={handleChange}
                    placeholder="Nomor Induk Siswa Nasional"
                    error={errors.nisn}
                  />
                </div>

                {/* NIK */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    NIK
                  </label>
                  <Input
                    name="nik"
                    value={formData.nik}
                    onChange={handleChange}
                    placeholder="Nomor Induk Kependudukan"
                    error={errors.nik}
                  />
                </div>
              </div>
            </div>

            {/* Data Pribadi */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Data Pribadi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nama */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    placeholder="Nama Lengkap Siswa"
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

                {/* Agama */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Agama
                  </label>
                  <select
                    name="agama"
                    value={formData.agama}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Pilih Agama</option>
                    {agamaOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.agama && <p className="mt-1 text-sm text-red-500">{errors.agama}</p>}
                </div>

                {/* Tempat Lahir */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tempat Lahir
                  </label>
                  <Input
                    name="tempat_lahir"
                    value={formData.tempat_lahir}
                    onChange={handleChange}
                    placeholder="Kota Kelahiran"
                    error={errors.tempat_lahir}
                  />
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tanggal Lahir
                  </label>
                  <Input
                    type="date"
                    name="tanggal_lahir"
                    value={formData.tanggal_lahir}
                    onChange={handleChange}
                    error={errors.tanggal_lahir}
                  />
                </div>

                {/* Anak Ke */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Anak Ke
                  </label>
                  <Input
                    type="number"
                    name="anak_ke"
                    value={formData.anak_ke}
                    onChange={handleChange}
                    placeholder="Contoh: 1"
                    min="1"
                    error={errors.anak_ke}
                  />
                </div>
              </div>
            </div>

            {/* Kontak */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Informasi Kontak
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>

            {/* Informasi Kesehatan */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Informasi Kesehatan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Golongan Darah */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Golongan Darah
                  </label>
                  <select
                    name="golongan_darah"
                    value={formData.golongan_darah}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Pilih Golongan Darah</option>
                    {GOLONGAN_DARAH_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.golongan_darah && <p className="mt-1 text-sm text-red-500">{errors.golongan_darah}</p>}
                </div>

                {/* Tinggi Badan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tinggi Badan (cm)
                  </label>
                  <Input
                    type="number"
                    name="tinggi_badan"
                    value={formData.tinggi_badan}
                    onChange={handleChange}
                    placeholder="Contoh: 165"
                    min="0"
                    error={errors.tinggi_badan}
                  />
                </div>

                {/* Berat Badan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Berat Badan (kg)
                  </label>
                  <Input
                    type="number"
                    name="berat_badan"
                    value={formData.berat_badan}
                    onChange={handleChange}
                    placeholder="Contoh: 55"
                    min="0"
                    error={errors.berat_badan}
                  />
                </div>
              </div>
            </div>

            {/* Informasi Sekolah */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                Informasi Sekolah
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kelas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="mst_kelas_id"
                    value={formData.mst_kelas_id}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Pilih Kelas</option>
                    {kelasOptions.map(kelas => (
                      <option key={kelas.id} value={kelas.id}>
                        {kelas.nama_kelas} - {kelas.tahun_ajaran}
                      </option>
                    ))}
                  </select>
                  {errors.mst_kelas_id && (
                    <p className="mt-1 text-sm text-red-500">
                      {Array.isArray(errors.mst_kelas_id) ? errors.mst_kelas_id[0] : errors.mst_kelas_id}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status Siswa
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tanggal Masuk */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tanggal Masuk
                  </label>
                  <Input
                    type="date"
                    name="tanggal_masuk"
                    value={formData.tanggal_masuk}
                    onChange={handleChange}
                    error={errors.tanggal_masuk}
                  />
                </div>

                {/* Asal Sekolah */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Asal Sekolah
                  </label>
                  <Input
                    name="asal_sekolah"
                    value={formData.asal_sekolah}
                    onChange={handleChange}
                    placeholder="Nama Sekolah Asal"
                    error={errors.asal_sekolah}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/siswa')}>
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

export default SiswaForm