import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import FileUpload from '../../../components/ui/FileUpload'
import { siswaService } from '../services/siswaService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { apiService } from '../../../utils/api'

const SiswaForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [kelasOptions, setKelasOptions] = useState([])
  
  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    nama: '',
    jenis_kelamin: 'L',
    tempat_lahir: '',
    tanggal_lahir: '',
    alamat: '',
    kelas_id: '',
    status_siswa: 'aktif',
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
    // Assuming there is an endpoint to get all kelas
    // If not, we might need to create a service for kelas
    const { data } = await apiService.get('/v1/master/kelas') 
    if (data) {
        // Adjust based on actual response structure
       setKelasOptions(data.data || [])
    }
  }

  const fetchSiswa = async () => {
    setLoading(true)
    const { data, error } = await siswaService.getById(id)
    if (data) {
      const siswa = data.data
      setFormData({
        nis: siswa.nis,
        nisn: siswa.nisn,
        nama: siswa.nama,
        jenis_kelamin: siswa.jenis_kelamin,
        tempat_lahir: siswa.tempat_lahir,
        tanggal_lahir: siswa.tanggal_lahir,
        alamat: siswa.alamat,
        kelas_id: siswa.kelas_id,
        status_siswa: siswa.status_siswa,
        foto: siswa.foto || ''
      })
    } else {
      showError('Gagal mengambil data siswa')
      navigate('/siswa')
    }
    setLoading(false)
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
    if (!formData.kelas_id) newErrors.kelas_id = 'Kelas wajib dipilih'
    if (!formData.jenis_kelamin) newErrors.jenis_kelamin = 'Jenis kelamin wajib dipilih'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    let result
    
    if (isEditMode) {
      result = await siswaService.update(id, formData)
    } else {
      result = await siswaService.create(formData)
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Foto Profil */}
            <div className="md:col-span-2">
              <FileUpload
                label="Foto Profil"
                onUpload={(path) => setFormData(prev => ({ ...prev, foto: path }))}
                accept="image/*"
                previewUrl={formData.foto}
              />
            </div>

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
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
              {errors.jenis_kelamin && <p className="mt-1 text-sm text-red-500">{errors.jenis_kelamin}</p>}
            </div>

            {/* Kelas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kelas <span className="text-red-500">*</span>
              </label>
              <select
                name="kelas_id"
                value={formData.kelas_id}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Pilih Kelas</option>
                {kelasOptions.map(kelas => (
                  <option key={kelas.id} value={kelas.id}>
                    {kelas.nama_kelas}
                  </option>
                ))}
              </select>
              {errors.kelas_id && <p className="mt-1 text-sm text-red-500">{errors.kelas_id}</p>}
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

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status Siswa
              </label>
              <select
                name="status_siswa"
                value={formData.status_siswa}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="aktif">Aktif</option>
                <option value="lulus">Lulus</option>
                <option value="keluar">Keluar</option>
                <option value="pindah">Pindah</option>
              </select>
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
            <Button type="button" variant="secondary" onClick={() => navigate('/siswa')}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              <Save size={18} className="mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default SiswaForm