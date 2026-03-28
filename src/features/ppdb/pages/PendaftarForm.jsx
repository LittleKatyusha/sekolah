import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { pendaftarService, gelombangService } from '../services/ppdbService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'terverifikasi', label: 'Terverifikasi' },
  { value: 'seleksi', label: 'Seleksi' },
  { value: 'diterima', label: 'Diterima' },
  { value: 'cadangan', label: 'Cadangan' },
  { value: 'ditolak', label: 'Ditolak' },
]

const PendaftarForm = () => {
  const { options: jenisKelaminOptions } = useReferenceOptions('jenis_kelamin', [
    { value: 'L', label: 'Laki-laki' },
    { value: 'P', label: 'Perempuan' },
  ])
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [gelombangOptions, setGelombangOptions] = useState([])

  const [formData, setFormData] = useState({
    mst_sekolah_id: '',
    ppdb_gelombang_id: '',
    nama_lengkap: '',
    email: '',
    password: '',
    nisn: '',
    jenis_kelamin: '',
    telp_hp: '',
    asal_sekolah: '',
    pilihan_jurusan_id: '',
    status_pendaftaran: 'draft',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchGelombangOptions()
    if (isEditMode) {
      fetchPendaftar()
    }
  }, [id])

  const fetchGelombangOptions = async () => {
    const { data } = await gelombangService.getAll({ per_page: 100 })
    if (data?.data) {
      setGelombangOptions(data.data.map(g => ({
        value: String(g.id),
        label: g.nama_gelombang || `Gelombang #${g.id}`
      })))
    }
  }

  const fetchPendaftar = async () => {
    setFetchingData(true)
    const { data, error } = await pendaftarService.getById(id)
    if (data) {
      const p = data.data
      setFormData({
        mst_sekolah_id: p.mst_sekolah_id ? String(p.mst_sekolah_id) : '',
        ppdb_gelombang_id: p.ppdb_gelombang_id ? String(p.ppdb_gelombang_id) : '',
        nama_lengkap: p.nama_lengkap || '',
        email: p.email || '',
        password: '',
        nisn: p.nisn || '',
        jenis_kelamin: p.jenis_kelamin || '',
        telp_hp: p.telp_hp || '',
        asal_sekolah: p.asal_sekolah || '',
        pilihan_jurusan_id: p.pilihan_jurusan_id ? String(p.pilihan_jurusan_id) : '',
        status_pendaftaran: p.status_pendaftaran || 'draft',
      })
    } else {
      showError('Gagal mengambil data pendaftar')
      navigate('/ppdb/pendaftaran')
    }
    setFetchingData(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.nama_lengkap.trim()) newErrors.nama_lengkap = 'Nama lengkap wajib diisi'
    if (!formData.email.trim()) newErrors.email = 'Email wajib diisi'
    if (!formData.jenis_kelamin) newErrors.jenis_kelamin = 'Jenis kelamin wajib dipilih'
    if (!isEditMode) {
      if (!formData.ppdb_gelombang_id) newErrors.ppdb_gelombang_id = 'Gelombang wajib dipilih'
      if (!formData.mst_sekolah_id) newErrors.mst_sekolah_id = 'Sekolah ID wajib diisi'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const submitData = {
      nama_lengkap: formData.nama_lengkap,
      email: formData.email,
      jenis_kelamin: formData.jenis_kelamin,
      nisn: formData.nisn || null,
      telp_hp: formData.telp_hp || null,
      asal_sekolah: formData.asal_sekolah || null,
      pilihan_jurusan_id: formData.pilihan_jurusan_id ? parseInt(formData.pilihan_jurusan_id) : null,
    }

    if (!isEditMode) {
      submitData.mst_sekolah_id = parseInt(formData.mst_sekolah_id)
      submitData.ppdb_gelombang_id = parseInt(formData.ppdb_gelombang_id)
      if (formData.password) submitData.password = formData.password
    } else {
      if (formData.status_pendaftaran) submitData.status_pendaftaran = formData.status_pendaftaran
      if (formData.password) submitData.password = formData.password
    }

    let result
    if (isEditMode) {
      result = await pendaftarService.update(id, submitData)
    } else {
      result = await pendaftarService.create(submitData)
    }

    const { error } = result
    if (!error) {
      showSuccess(`Pendaftar berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/ppdb/pendaftaran')
    } else {
      if (error.errors) setErrors(error.errors)
      else showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} pendaftar`)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/ppdb/pendaftaran')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Pendaftar' : 'Tambah Pendaftar Baru'}
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <Input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} placeholder="Masukkan nama lengkap" error={errors.nama_lengkap} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" error={errors.email} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password {!isEditMode && <span className="text-gray-400">(opsional)</span>}
                </label>
                <Input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isEditMode ? 'Kosongkan jika tidak diubah' : 'Password'} error={errors.password} />
              </div>

              {!isEditMode && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sekolah ID <span className="text-red-500">*</span>
                    </label>
                    <Input type="number" name="mst_sekolah_id" value={formData.mst_sekolah_id} onChange={handleChange} placeholder="ID Sekolah" error={errors.mst_sekolah_id} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gelombang PPDB <span className="text-red-500">*</span>
                    </label>
                    <SearchableSelect name="ppdb_gelombang_id" value={formData.ppdb_gelombang_id} onChange={handleChange} options={gelombangOptions} placeholder="Pilih gelombang" error={errors.ppdb_gelombang_id} />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <SearchableSelect name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} options={jenisKelaminOptions} placeholder="Pilih jenis kelamin" error={errors.jenis_kelamin} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NISN</label>
                <Input type="text" name="nisn" value={formData.nisn} onChange={handleChange} placeholder="NISN (opsional)" error={errors.nisn} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Telp/HP</label>
                <Input type="text" name="telp_hp" value={formData.telp_hp} onChange={handleChange} placeholder="No. telepon (opsional)" error={errors.telp_hp} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asal Sekolah</label>
                <Input type="text" name="asal_sekolah" value={formData.asal_sekolah} onChange={handleChange} placeholder="Asal sekolah (opsional)" error={errors.asal_sekolah} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pilihan Jurusan ID</label>
                <Input type="number" name="pilihan_jurusan_id" value={formData.pilihan_jurusan_id} onChange={handleChange} placeholder="ID Jurusan (opsional)" error={errors.pilihan_jurusan_id} />
              </div>

              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status Pendaftaran</label>
                  <SearchableSelect name="status_pendaftaran" value={formData.status_pendaftaran} onChange={handleChange} options={STATUS_OPTIONS} placeholder="Pilih status" error={errors.status_pendaftaran} />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/ppdb/pendaftaran')}>Batal</Button>
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

export default PendaftarForm