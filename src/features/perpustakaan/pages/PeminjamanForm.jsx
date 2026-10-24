import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, BookOpen } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { peminjamanService, bukuService } from '../services/perpustakaanService'
import { siswaService } from '../../siswa/services/siswaService'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { usePageTitle } from '../../../hooks/usePageTitle'
import PermissionGuard from '../../../components/guards/PermissionGuard'

const getDefaultToday = () => new Date().toISOString().split('T')[0]
const getDefaultDueDate = () => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

const PeminjamanForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  usePageTitle(isEditMode ? 'Edit Peminjaman' : 'Sirkulasi Peminjaman Buku')

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [selectedSiswaOption, setSelectedSiswaOption] = useState(null)
  const [selectedBukuOption, setSelectedBukuOption] = useState(null)
  
  const [cartItems, setCartItems] = useState([])
  const [bukuCache, setBukuCache] = useState({})
  const [selectedBukuToAdd, setSelectedBukuToAdd] = useState('')

  const [formData, setFormData] = useState({
    mst_siswa_id: '',
    mst_buku_id: '',
    tanggal_pinjam: getDefaultToday(),
    tanggal_jatuh_tempo: getDefaultDueDate(),
    keterangan: ''
  })

  const [errors, setErrors] = useState({})

  // Fetch peminjaman data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchPeminjaman()
    }
  }, [id])

  const buildSiswaOption = useCallback((siswa) => ({
    value: String(siswa.id),
    label: `${siswa.nama || `Siswa #${siswa.id}`} (${siswa.nis || '-'})`
  }), [])

  const buildBukuOption = useCallback((buku) => ({
    value: String(buku.id),
    label: `${buku.judul || `Buku #${buku.id}`} (ISBN: ${buku.isbn || '-'} | Stok: ${buku.stok ?? 0})`
  }), [])

  const searchSiswaOptions = useCallback(async (keyword = '') => {
    const { data, error } = await siswaService.getAll({
      search: keyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      return data.data.map(buildSiswaOption)
    }

    console.error('Error fetching siswa:', error)
    return []
  }, [buildSiswaOption])

  const searchBukuOptions = useCallback(async (keyword = '') => {
    const { data, error } = await bukuService.getAvailable({
      search: keyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      setBukuCache(prev => {
        const next = { ...prev }
        data.data.forEach(buku => {
          next[String(buku.id)] = buku
        })
        return next
      })
      return data.data.map(buildBukuOption)
    }

    console.error('Error fetching buku:', error)
    return []
  }, [buildBukuOption])

  const hydrateSelectedSiswaOption = useCallback(async (siswaId) => {
    if (!siswaId) {
      setSelectedSiswaOption(null)
      return
    }

    const { data } = await siswaService.getById(siswaId)
    const siswa = data?.data

    if (siswa) {
      setSelectedSiswaOption(buildSiswaOption(siswa))
    }
  }, [buildSiswaOption])

  const hydrateSelectedBukuOption = useCallback(async (bukuId) => {
    if (!bukuId) {
      setSelectedBukuOption(null)
      return
    }

    const { data } = await bukuService.getById(bukuId)
    const buku = data?.data

    if (buku) {
      setSelectedBukuOption(buildBukuOption(buku))
    }
  }, [buildBukuOption])

  const fetchPeminjaman = async () => {
    setFetchingData(true)
    const { data, error } = await peminjamanService.getById(id)
    if (data && data.data) {
      const peminjaman = data.data
      const siswaId = String(peminjaman.mst_siswa_id || peminjaman.siswa?.id || '')
      const bukuId = String(peminjaman.mst_buku_id || peminjaman.buku?.id || '')

      setFormData({
        mst_siswa_id: siswaId,
        mst_buku_id: bukuId,
        tanggal_pinjam: peminjaman.tanggal_pinjam || '',
        tanggal_jatuh_tempo: peminjaman.tanggal_jatuh_tempo || '',
        keterangan: peminjaman.keterangan || ''
      })

      if (peminjaman.siswa?.id) {
        setSelectedSiswaOption(buildSiswaOption(peminjaman.siswa))
      }

      if (peminjaman.buku?.id) {
        setSelectedBukuOption(buildBukuOption(peminjaman.buku))
      }
    } else {
      showError('Gagal mengambil data peminjaman')
      navigate('/perpustakaan/peminjaman')
    }
    setFetchingData(false)
  }

  useEffect(() => {
    if (formData.mst_siswa_id) {
      hydrateSelectedSiswaOption(formData.mst_siswa_id)
    } else {
      setSelectedSiswaOption(null)
    }
  }, [formData.mst_siswa_id, hydrateSelectedSiswaOption])

  useEffect(() => {
    if (isEditMode && formData.mst_buku_id) {
      hydrateSelectedBukuOption(formData.mst_buku_id)
    } else if (isEditMode) {
      setSelectedBukuOption(null)
    }
  }, [isEditMode, formData.mst_buku_id, hydrateSelectedBukuOption])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleAddBookToCart = (e) => {
    const bookId = e.target.value
    if (!bookId) return

    const idStr = String(bookId)
    if (cartItems.some(item => String(item.id) === idStr)) {
      showError('Buku ini sudah ada di dalam keranjang pinjam.')
      setSelectedBukuToAdd('')
      return
    }

    const cachedBook = bukuCache[idStr]
    if (cachedBook) {
      setCartItems(prev => [...prev, cachedBook])
      setSelectedBukuToAdd('')
      if (errors.buku_ids) {
        setErrors(prev => ({ ...prev, buku_ids: null }))
      }
    } else {
      bukuService.getById(bookId).then(({ data }) => {
        if (data?.data) {
          setCartItems(prev => [...prev, data.data])
          setSelectedBukuToAdd('')
          if (errors.buku_ids) {
            setErrors(prev => ({ ...prev, buku_ids: null }))
          }
        }
      })
    }
  }

  const handleRemoveFromCart = (bookId) => {
    setCartItems(prev => prev.filter(item => String(item.id) !== String(bookId)))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.mst_siswa_id) newErrors.mst_siswa_id = 'Siswa wajib dipilih'
    if (isEditMode) {
      if (!formData.mst_buku_id) newErrors.mst_buku_id = 'Buku wajib dipilih'
    } else {
      if (cartItems.length === 0) newErrors.buku_ids = 'Pilih minimal 1 buku untuk dipinjam'
    }
    if (!formData.tanggal_jatuh_tempo) newErrors.tanggal_jatuh_tempo = 'Tanggal jatuh tempo wajib diisi'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    let result

    if (isEditMode) {
      const submitData = {
        mst_siswa_id: parseInt(formData.mst_siswa_id),
        mst_buku_id: parseInt(formData.mst_buku_id),
        tanggal_pinjam: formData.tanggal_pinjam || null,
        tanggal_jatuh_tempo: formData.tanggal_jatuh_tempo,
        keterangan: formData.keterangan || null
      }
      result = await peminjamanService.update(id, submitData)
    } else {
      const submitData = {
        mst_siswa_id: parseInt(formData.mst_siswa_id),
        buku_ids: cartItems.map(item => parseInt(item.id)),
        tanggal_pinjam: formData.tanggal_pinjam || null,
        tanggal_jatuh_tempo: formData.tanggal_jatuh_tempo,
        keterangan: formData.keterangan || null
      }
      result = await peminjamanService.batchPinjam(submitData)
    }

    const { data, error } = result

    if (!error) {
      showSuccess(
        isEditMode
          ? 'Peminjaman berhasil diperbarui!'
          : (data?.message || `Peminjaman ${cartItems.length} buku berhasil dicatat!`)
      )
      navigate('/perpustakaan/peminjaman')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(error.message || `Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} peminjaman`)
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Peminjaman' : 'Sirkulasi Peminjaman Buku'}
          </h1>
          {!isEditMode && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pilih siswa dan tambahkan buku ke keranjang peminjaman.
            </p>
          )}
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
              {/* Siswa Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Siswa Peminjam <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="mst_siswa_id"
                  value={formData.mst_siswa_id}
                  onChange={handleChange}
                  options={selectedSiswaOption ? [selectedSiswaOption] : []}
                  loadOptions={searchSiswaOptions}
                  placeholder="Pilih Siswa"
                  searchPlaceholder="Cari siswa berdasarkan nama atau NIS..."
                  noOptionsText="Tidak ada siswa yang cocok"
                  disabled={isEditMode}
                  error={errors.mst_siswa_id}
                />
                {isEditMode && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Siswa tidak dapat diubah saat edit
                  </p>
                )}
              </div>

              {/* In Edit Mode: Single Book Select */}
              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Buku <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    name="mst_buku_id"
                    value={formData.mst_buku_id}
                    onChange={handleChange}
                    options={selectedBukuOption ? [selectedBukuOption] : []}
                    loadOptions={searchBukuOptions}
                    placeholder="Pilih Buku"
                    searchPlaceholder="Cari buku tersedia berdasarkan judul atau ISBN..."
                    noOptionsText="Tidak ada buku tersedia yang cocok"
                    disabled={isEditMode}
                    error={errors.mst_buku_id}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Buku tidak dapat diubah saat edit
                  </p>
                </div>
              )}

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
              <div className={isEditMode ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
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

            {!isEditMode && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen size={18} className="text-primary-600" />
                    Keranjang Buku ({cartItems.length} dipilih)
                  </h2>
                </div>

                <div className="max-w-md">
                  <SearchableSelect
                    name="buku_picker"
                    value={selectedBukuToAdd}
                    onChange={handleAddBookToCart}
                    options={[]}
                    loadOptions={searchBukuOptions}
                    placeholder="+ Cari buku untuk ditambahkan..."
                    searchPlaceholder="Cari judul buku atau ISBN..."
                    noOptionsText="Buku tidak ditemukan atau stok habis"
                  />
                  {errors.buku_ids && (
                    <p className="mt-1 text-sm text-red-500">
                      {Array.isArray(errors.buku_ids) ? errors.buku_ids[0] : errors.buku_ids}
                    </p>
                  )}
                </div>

                <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 w-10">#</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Judul</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 w-36">ISBN</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">Penulis</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300 w-20">Stok</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300 w-16">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                      {cartItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                            Keranjang kosong. Cari buku di atas untuk menambahkan.
                          </td>
                        </tr>
                      ) : (
                        cartItems.map((buku, idx) => (
                          <tr key={buku.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                            <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{buku.judul}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300 font-mono text-xs">{buku.isbn || '-'}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{buku.penulis || '-'}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                {buku.stok ?? 0}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(buku.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Hapus"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/perpustakaan/peminjaman')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'peminjaman.edit' : 'peminjaman.create'}>
                <Button type="submit" disabled={loading || (!isEditMode && cartItems.length === 0)}>
                  <Save size={18} className="mr-2" />
                  {loading
                    ? 'Menyimpan...'
                    : isEditMode
                      ? 'Simpan'
                      : `Simpan (${cartItems.length} Buku)`
                  }
                </Button>
              </PermissionGuard>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

export default PeminjamanForm