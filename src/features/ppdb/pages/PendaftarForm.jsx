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
import PermissionGuard from '../../../components/guards/PermissionGuard'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'terverifikasi', label: 'Terverifikasi' },
  { value: 'seleksi', label: 'Seleksi' },
  { value: 'diterima', label: 'Diterima' },
  { value: 'cadangan', label: 'Cadangan' },
  { value: 'ditolak', label: 'Ditolak' },
]

const PRESTASI_OPTIONS = [
  { value: 'none', label: 'Tidak Ada' },
  { value: 'sekolah', label: 'Tingkat Sekolah' },
  { value: 'kabupaten', label: 'Tingkat Kabupaten/Kota' },
  { value: 'provinsi', label: 'Tingkat Provinsi' },
  { value: 'nasional', label: 'Tingkat Nasional' },
  { value: 'internasional', label: 'Tingkat Internasional' },
]

const PendaftarForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [gelombangOptions, setGelombangOptions] = useState([])
  const [activeSection, setActiveSection] = useState('identitas') // 'identitas' | 'akademik'

  const [formData, setFormData] = useState({
    // Identitas
    mst_sekolah_id: '',
    ppdb_gelombang_id: '',
    nama_lengkap: '',
    email: '',
    password: '',
    nisn: '',
    jenis_kelamin: '',
    telp_hp: '',
    asal_sekolah: '',
    tanggal_lahir: '',
    pilihan_jurusan_id: '',
    status_pendaftaran: 'draft',
    // Akademik
    jumlah_prestasi: '0',
    tingkat_prestasi_tertinggi: 'none',
    poin_pelanggaran: '0',
    is_hafidz: '0',
    juz_hafalan: '0',
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
        // Identitas
        mst_sekolah_id: p.mst_sekolah_id ? String(p.mst_sekolah_id) : '',
        ppdb_gelombang_id: p.ppdb_gelombang_id ? String(p.ppdb_gelombang_id) : '',
        nama_lengkap: p.nama_lengkap || '',
        email: p.email || '',
        password: '',
        nisn: p.nisn || '',
        jenis_kelamin: p.jenis_kelamin != null ? String(p.jenis_kelamin) : '',
        telp_hp: p.telp_hp || '',
        asal_sekolah: p.asal_sekolah || '',
        tanggal_lahir: p.tanggal_lahir || '',
        pilihan_jurusan_id: p.pilihan_jurusan_id ? String(p.pilihan_jurusan_id) : '',
        status_pendaftaran: p.status_pendaftaran || 'draft',
        // Akademik
        jumlah_prestasi: p.jumlah_prestasi != null ? String(p.jumlah_prestasi) : '0',
        tingkat_prestasi_tertinggi: p.tingkat_prestasi_tertinggi || 'none',
        poin_pelanggaran: p.poin_pelanggaran != null ? String(p.poin_pelanggaran) : '0',
        is_hafidz: p.is_hafidz ? '1' : '0',
        juz_hafalan: p.juz_hafalan != null ? String(p.juz_hafalan) : '0',
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
      jenis_kelamin: formData.jenis_kelamin ? parseInt(formData.jenis_kelamin) : null,
      nisn: formData.nisn || null,
      telp_hp: formData.telp_hp || null,
      asal_sekolah: formData.asal_sekolah || null,
      tanggal_lahir: formData.tanggal_lahir || null,
      pilihan_jurusan_id: formData.pilihan_jurusan_id ? parseInt(formData.pilihan_jurusan_id) : null,
      // Akademik
      jumlah_prestasi: parseInt(formData.jumlah_prestasi) || 0,
      tingkat_prestasi_tertinggi: formData.tingkat_prestasi_tertinggi || 'none',
      poin_pelanggaran: parseInt(formData.poin_pelanggaran) || 0,
      is_hafidz: formData.is_hafidz === '1',
      juz_hafalan: parseInt(formData.juz_hafalan) || 0,
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

  const LabelField = ({ children, required }) => (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  )

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

      {/* Section tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {[
            { id: 'identitas', label: 'Data Identitas' },
            { id: 'akademik', label: 'Data Akademik & Seleksi' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeSection === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <Card>
        {fetchingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {/* ── Section: Identitas ── */}
            {activeSection === 'identitas' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <LabelField required>Nama Lengkap</LabelField>
                  <Input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} placeholder="Masukkan nama lengkap" error={errors.nama_lengkap} />
                </div>

                <div>
                  <LabelField required>Email</LabelField>
                  <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" error={errors.email} />
                </div>

                <div>
                  <LabelField>Password {!isEditMode && <span className="text-gray-400 font-normal">(opsional)</span>}</LabelField>
                  <Input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isEditMode ? 'Kosongkan jika tidak diubah' : 'Password'} error={errors.password} />
                </div>

                {!isEditMode && (
                  <>
                    <div>
                      <LabelField required>Sekolah ID</LabelField>
                      <Input type="number" name="mst_sekolah_id" value={formData.mst_sekolah_id} onChange={handleChange} placeholder="ID Sekolah" error={errors.mst_sekolah_id} />
                    </div>
                    <div>
                      <LabelField required>Gelombang PPDB</LabelField>
                      <SearchableSelect name="ppdb_gelombang_id" value={formData.ppdb_gelombang_id} onChange={handleChange} options={gelombangOptions} placeholder="Pilih gelombang" error={errors.ppdb_gelombang_id} />
                    </div>
                  </>
                )}

                <div>
                  <LabelField required>Jenis Kelamin</LabelField>
                  <SearchableSelect name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} options={[
                    { value: '1', label: 'Laki-laki' },
                    { value: '2', label: 'Perempuan' },
                  ]} placeholder="Pilih jenis kelamin" error={errors.jenis_kelamin} />
                </div>

                <div>
                  <LabelField>Tanggal Lahir</LabelField>
                  <Input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleChange} error={errors.tanggal_lahir} />
                </div>

                <div>
                  <LabelField>NISN</LabelField>
                  <Input type="text" name="nisn" value={formData.nisn} onChange={handleChange} placeholder="NISN (opsional)" error={errors.nisn} />
                </div>

                <div>
                  <LabelField>No. Telp/HP</LabelField>
                  <Input type="text" name="telp_hp" value={formData.telp_hp} onChange={handleChange} placeholder="No. telepon (opsional)" error={errors.telp_hp} />
                </div>

                <div>
                  <LabelField>Asal Sekolah</LabelField>
                  <Input type="text" name="asal_sekolah" value={formData.asal_sekolah} onChange={handleChange} placeholder="Asal sekolah (opsional)" error={errors.asal_sekolah} />
                </div>

                <div>
                  <LabelField>Pilihan Jurusan ID</LabelField>
                  <Input type="number" name="pilihan_jurusan_id" value={formData.pilihan_jurusan_id} onChange={handleChange} placeholder="ID Jurusan (opsional)" error={errors.pilihan_jurusan_id} />
                </div>

                {isEditMode && (
                  <div>
                    <LabelField>Status Pendaftaran</LabelField>
                    <SearchableSelect name="status_pendaftaran" value={formData.status_pendaftaran} onChange={handleChange} options={STATUS_OPTIONS} placeholder="Pilih status" error={errors.status_pendaftaran} />
                  </div>
                )}
              </div>
            )}

            {/* ── Section: Akademik ── */}
            {activeSection === 'akademik' && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Nilai rapor dikelola melalui halaman <strong>Nilai Rapor</strong> setelah pendaftar tersimpan.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                    Prestasi & Perilaku
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <LabelField>Jumlah Prestasi</LabelField>
                      <Input
                        type="number"
                        name="jumlah_prestasi"
                        value={formData.jumlah_prestasi}
                        onChange={handleChange}
                        placeholder="0"
                        min="0"
                        error={errors.jumlah_prestasi}
                      />
                    </div>

                    <div>
                      <LabelField>Tingkat Prestasi Tertinggi</LabelField>
                      <SearchableSelect
                        name="tingkat_prestasi_tertinggi"
                        value={formData.tingkat_prestasi_tertinggi}
                        onChange={handleChange}
                        options={PRESTASI_OPTIONS}
                        placeholder="Pilih tingkat"
                        error={errors.tingkat_prestasi_tertinggi}
                      />
                    </div>

                    <div>
                      <LabelField>Poin Pelanggaran</LabelField>
                      <Input
                        type="number"
                        name="poin_pelanggaran"
                        value={formData.poin_pelanggaran}
                        onChange={handleChange}
                        placeholder="0–100"
                        min="0"
                        max="100"
                        error={errors.poin_pelanggaran}
                      />
                      <p className="mt-1 text-xs text-gray-400">0 = sempurna, 100 = banyak pelanggaran</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                    Hafalan Qur'an
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <LabelField>Hafidz Qur'an</LabelField>
                      <SearchableSelect
                        name="is_hafidz"
                        value={formData.is_hafidz}
                        onChange={handleChange}
                        options={[{ value: '1', label: 'Ya' }, { value: '0', label: 'Tidak' }]}
                        placeholder="Pilih"
                        error={errors.is_hafidz}
                      />
                    </div>

                    {formData.is_hafidz === '1' && (
                      <div>
                        <LabelField>Jumlah Juz Hafalan</LabelField>
                        <Input
                          type="number"
                          name="juz_hafalan"
                          value={formData.juz_hafalan}
                          onChange={handleChange}
                          placeholder="0–30"
                          min="0"
                          max="30"
                          error={errors.juz_hafalan}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                {activeSection === 'akademik' && (
                  <Button type="button" variant="secondary" onClick={() => setActiveSection('identitas')}>
                    ← Identitas
                  </Button>
                )}
                {activeSection === 'identitas' && (
                  <Button type="button" variant="secondary" onClick={() => setActiveSection('akademik')}>
                    Akademik →
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={() => navigate('/ppdb/pendaftaran')}>Batal</Button>
                <PermissionGuard permission={isEditMode ? 'ppdb.pendaftar.edit' : 'ppdb.pendaftar.create'}>
                  <Button type="submit" disabled={loading}>
                    <Save size={18} className="mr-2" />
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

export default PendaftarForm