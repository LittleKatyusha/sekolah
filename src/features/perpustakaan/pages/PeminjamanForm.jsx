import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { peminjamanService, bukuService } from '../services/perpustakaanService'
import { siswaService } from '../../siswa/services/siswaService'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { usePageTitle } from '../../../hooks/usePageTitle'

const PeminjamanForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  usePageTitle(isEditMode ? 'Edit Peminjaman' : 'Tambah Peminjaman')

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [siswaOptions, setSiswaOptions] = useState([])
  const [bukuOptions, setBukuOptions] = useState([])
  const [fetchingSiswa, setFetchingSiswa] = useState(false)
  const [fetchingBuku, setFetchingBuku] = useState(false)
  
  const [formData, setFormData] = useState({
    mst_siswa_id: '',
    mst_buku_id: '',
    tanggal_pinjam: '',
    tanggal_jatuh_tempo: '',
    keterangan: ''
  })

  const [errors, setErrors] = useState({})

  // Fetch siswa and buku lists on mount
  useEffect(() => {
    fetchSiswaList()
    fetchBukuList()
  }, [])

  // Fetch peminjaman data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchPeminjaman()
    }
  }, [id])

  const fetchSiswaList = async () => {
    setFetchingSiswa(true)
    const { data, error } = await siswaService.getAll({ per_page: 1000 })
    if (data && data.data) {
      const options = data.data.map(siswa => ({
        value: String(siswa.id),
        label: `${siswa.nama} (${siswa.nis})`
      }))
      setSiswaOptions(options)
    } else {
      console.error('Error fetching siswa:', error)
    }
    setFetchingSiswa(false)
  }

  const fetchBukuList = async () => {
    setFetchingBuku(true)
    const { data, error } = await bukuService.getAvailable({ per_page: 1000 })
    if (data && data.data) {
      const options = data.data.map(buku => ({
        value: String(buku.id),
        label: `${buku.judul} (${buku.isbn})`
      }))
      setBukuOptions(options)
    } else {
      console.error('Error fetching buku:', error)
    }
    setFetchingBuku(false)
  }

  const fetchPeminjaman = async () => {
    setFetchingData(true)
    const { data, error } = await peminjamanService.getById(id)
    if (data && data.data) {
      const peminjaman = data.data
      setFormData({
        mst_siswa_id: String(peminjaman.mst_siswa_id || ''),
        mst_buku_id: String(peminjaman.mst_buku_id || ''),
        tanggal_pinjam: peminjaman.tanggal_pinjam || '',
        tanggal_jatuh_tempo: peminjaman.tanggal_jatuh_tempo || '',
        keterangan: peminjaman.keterangan || ''
      })
    } else {
      showError('Gagal mengambil data peminjaman')
      navigate('/perpustakaan/peminjaman')
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
    if (!formData.mst_siswa_id) newErrors.mst_siswa_id = 'Siswa wajib dipilih'
    if (!formData.mst_buku_id) newErrors.mst_buku_id = 'Buku wajib dipilih'
    if (!formData.tanggal_jatuh_tempo) newErrors.tanggal_jatuh_tempo = 'Tanggal jatuh tempo wajib diisi'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    const submitData = {
      ...formData,
      mst_siswa_id: parseInt(formData.mst_siswa_id),
      mst_buku_id: parseInt(formData.mst_buku_id),
      tanggal_pinjam: formData.tanggal_pinjam || null,
      keterangan: formData.keterangan || null
    }

    let result
    
    if (isEditMode) {
      result = await peminjamanService.update(id, submitData)
    } else {
      result = await peminjamanService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Peminjaman berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/perpustakaan/peminjaman')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} peminjaman`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/perpustakaan/peminjaman')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Peminjaman' : 'Tambah Peminjaman Baru'}
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
              {/* Siswa Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Siswa <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="mst_siswa_id"
                  value={formData.mst_siswa_id}
                  onChange={handleChange}
                  options={siswaOptions}
                  placeholder={fetchingSiswa ? 'Memuat data siswa...' : 'Pilih Siswa'}
                  disabled={fetchingSiswa || isEditMode}
                  error={errors.mst_siswa_id}
                />
                {isEditMode && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Siswa tidak dapat diubah saat edit
                  </p>
                )}
              </div>

              {/* Buku Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Buku <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="mst_buku_id"
                  value={formData.mst_buku_id}
                  onChange={handleChange}
                  options={bukuOptions}
                  placeholder={fetchingBuku ? 'Memuat data buku...' : 'Pilih Buku'}
                  disabled={fetchingBuku || isEditMode}
                  error={errors.mst_buku_id}
                />
                {isEditMode && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Buku tidak dapat diubah saat edit
                  </p>
                )}
              </div>

              {/* Tanggal Pinjam */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Pinjam
                </label>
                <input
                  type="date"
                  name="tanggal_pinjam"
                  value={formData.tanggal_pinjam}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                {errors.tanggal_pinjam && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.tanggal_pinjam) ? errors.tanggal_pinjam[0] : errors.tanggal_pinjam}
                  </p>
                )}
              </div>

              {/* Tanggal Jatuh Tempo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Jatuh Tempo <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggal_jatuh_tempo"
                  value={formData.tanggal_jatuh_tempo}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                {errors.tanggal_jatuh_tempo && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.tanggal_jatuh_tempo) ? errors.tanggal_jatuh_tempo[0] : errors.tanggal_jatuh_tempo}
                  </p>
                )}
              </div>

              {/* Keterangan */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keterangan
                </label>
                <textarea
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Keterangan tambahan (opsional)"
                />
                {errors.keterangan && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.keterangan) ? errors.keterangan[0] : errors.keterangan}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/perpustakaan/peminjaman')}>
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

export default PeminjamanForm