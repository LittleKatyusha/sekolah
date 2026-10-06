import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, RefreshCw, Save, Search, Users, X } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { ujianUserService } from '../services/ujianUserService'
import { ujianService } from '../../ujian/services/ujianService'
import { siswaService } from '../../siswa/services/siswaService'
import { kelasService } from '../../kelas/services/kelasService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const getItems = (response) => {
  if (Array.isArray(response?.data?.data)) return response.data.data
  if (Array.isArray(response?.data?.data?.data)) return response.data.data.data
  if (Array.isArray(response?.data)) return response.data
  return []
}

const UjianUserForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [selectedUjianOption, setSelectedUjianOption] = useState(null)
  const [selectedSiswaOption, setSelectedSiswaOption] = useState(null)
  
  const [formData, setFormData] = useState({
    trx_ujian_id: '',
    mst_siswa_id: ''
  })

  const [errors, setErrors] = useState({})

  // Bulk enrollment state
  const [selectedUjianId, setSelectedUjianId] = useState('')
  const [durasiMenit, setDurasiMenit] = useState(60)
  const [ujianOptions, setUjianOptions] = useState([])
  const [kelasOptions, setKelasOptions] = useState([])
  const [allSiswa, setAllSiswa] = useState([])
  const [existingSiswaIds, setExistingSiswaIds] = useState(new Set())
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [selectedSiswaIds, setSelectedSiswaIds] = useState(new Set())
  const [filterKelasId, setFilterKelasId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [loadingInitial, setLoadingInitial] = useState(true)

  const buildUjianOption = useCallback((ujian) => ({
    value: String(ujian.id),
    label: ujian.nama || `Ujian #${ujian.id} - ${ujian.mapel?.nama || 'Unknown'}`
  }), [])

  const buildSiswaOption = useCallback((siswa) => ({
    value: String(siswa.id),
    label: `${siswa.nama || `Siswa #${siswa.id}`} (${siswa.nis || '-'}) - ${siswa.kelas?.nama_kelas || 'No Class'}`
  }), [])

  const searchUjianOptions = useCallback(async (keyword = '') => {
    const { data, error } = await ujianService.getAll({
      search: keyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      return data.data.map(buildUjianOption)
    }

    console.error('Error fetching ujian:', error)
    return []
  }, [buildUjianOption])

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

  // Load Initial Options (Ujian, Kelas, Siswa)
  useEffect(() => {
    let cancelled = false

    const loadInitialData = async () => {
      setLoadingInitial(true)
      try {
        const [ujianRes, kelasRes, siswaRes] = await Promise.all([
          ujianService.getAll({ per_page: 100 }),
          kelasService.getAll({ per_page: 'all' }),
          siswaService.getAll({ per_page: 'all' }),
        ])

        if (cancelled) return

        const loadedUjian = getItems(ujianRes).map(buildUjianOption)
        const loadedKelas = getItems(kelasRes).map((k) => ({
          value: String(k.id),
          label: k.nama_kelas || `Kelas #${k.id}`,
        }))
        const loadedSiswa = getItems(siswaRes)

        setUjianOptions(loadedUjian)
        setKelasOptions(loadedKelas)
        setAllSiswa(loadedSiswa)
      } catch (err) {
        console.error('Failed to load initial data for ujian user:', err)
      } finally {
        if (!cancelled) setLoadingInitial(false)
      }
    }

    loadInitialData()
    return () => { cancelled = true }
  }, [buildUjianOption])

  // When selectedUjianId changes in Bulk Mode, fetch existing registered students
  useEffect(() => {
    if (isEditMode || !selectedUjianId) {
      setExistingSiswaIds(new Set())
      return
    }

    let cancelled = false
    const fetchExisting = async () => {
      setLoadingExisting(true)
      try {
        const res = await ujianUserService.getAll({ trx_ujian_id: selectedUjianId, per_page: 1000 })
        if (cancelled) return
        const participants = getItems(res)
        const enrolledIds = new Set(participants.map((p) => Number(p.mst_siswa_id || p.siswa?.id)).filter(Boolean))
        setExistingSiswaIds(enrolledIds)

        // Remove any existing students from current selections
        setSelectedSiswaIds((prev) => {
          const next = new Set(prev)
          enrolledIds.forEach((sId) => next.delete(sId))
          return next
        })
      } catch (err) {
        console.error('Failed to fetch existing participants for ujian:', err)
      } finally {
        if (!cancelled) setLoadingExisting(false)
      }
    }

    fetchExisting()
    return () => { cancelled = true }
  }, [isEditMode, selectedUjianId])

  // Filtered students list for Bulk Mode
  const filteredSiswa = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return allSiswa.filter((siswa) => {
      if (filterKelasId) {
        const studentKelasId = siswa.mst_kelas_id ?? siswa.kelas?.id
        if (String(studentKelasId) !== String(filterKelasId)) return false
      }

      if (q) {
        const nameMatch = (siswa.nama || '').toLowerCase().includes(q)
        const nisMatch = (siswa.nis || '').toLowerCase().includes(q)
        const kelasMatch = (siswa.kelas?.nama_kelas || '').toLowerCase().includes(q)
        if (!nameMatch && !nisMatch && !kelasMatch) return false
      }

      return true
    })
  }, [allSiswa, filterKelasId, searchQuery])

  // Selectable students in current filtered view (excluding already enrolled)
  const selectableFilteredSiswa = useMemo(() => {
    return filteredSiswa.filter((s) => !existingSiswaIds.has(Number(s.id)))
  }, [filteredSiswa, existingSiswaIds])

  // Master checkbox status
  const isAllFilteredSelected = useMemo(() => {
    if (selectableFilteredSiswa.length === 0) return false
    return selectableFilteredSiswa.every((s) => selectedSiswaIds.has(Number(s.id)))
  }, [selectableFilteredSiswa, selectedSiswaIds])

  const isSomeFilteredSelected = useMemo(() => {
    if (isAllFilteredSelected) return false
    return selectableFilteredSiswa.some((s) => selectedSiswaIds.has(Number(s.id)))
  }, [isAllFilteredSelected, selectableFilteredSiswa, selectedSiswaIds])

  const handleToggleSelectAllFiltered = () => {
    setSelectedSiswaIds((prev) => {
      const next = new Set(prev)
      if (isAllFilteredSelected) {
        selectableFilteredSiswa.forEach((s) => next.delete(Number(s.id)))
      } else {
        selectableFilteredSiswa.forEach((s) => next.add(Number(s.id)))
      }
      return next
    })
  }

  const handleToggleStudent = (siswaId) => {
    const idNum = Number(siswaId)
    if (existingSiswaIds.has(idNum)) return

    setSelectedSiswaIds((prev) => {
      const next = new Set(prev)
      if (next.has(idNum)) {
        next.delete(idNum)
      } else {
        next.add(idNum)
      }
      return next
    })
  }

  const handleClearSelections = () => {
    setSelectedSiswaIds(new Set())
  }

  // Pagination calculation
  const totalFiltered = filteredSiswa.length
  const totalPages = pageSize === 'all' ? 1 : Math.ceil(totalFiltered / pageSize) || 1
  const paginatedSiswa = useMemo(() => {
    if (pageSize === 'all') return filteredSiswa
    const start = (currentPage - 1) * pageSize
    return filteredSiswa.slice(start, start + pageSize)
  }, [filteredSiswa, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [filterKelasId, searchQuery, pageSize])

  // Fetch existing data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchUjianUser()
    }
  }, [id])

  const fetchUjianUser = async () => {
    setFetchingData(true)
    const { data, error } = await ujianUserService.getById(id)
    if (data) {
      const ujianUser = data.data
      const ujianId = ujianUser.trx_ujian_id?.toString() || ujianUser.ujian?.id?.toString() || ''
      const siswaId = ujianUser.mst_siswa_id?.toString() || ujianUser.siswa?.id?.toString() || ''

      setFormData({
        trx_ujian_id: ujianId,
        mst_siswa_id: siswaId
      })

      if (ujianUser.ujian?.id) {
        setSelectedUjianOption(buildUjianOption(ujianUser.ujian))
      }

      if (ujianUser.siswa?.id) {
        setSelectedSiswaOption(buildSiswaOption(ujianUser.siswa))
      }
    } else {
      showError('Gagal mengambil data ujian user')
      navigate('/akademik/ujian-user')
    }
    setFetchingData(false)
  }

  const hydrateSelectedUjianOption = useCallback(async (ujianId) => {
    if (!ujianId) {
      setSelectedUjianOption(null)
      return
    }

    const { data } = await ujianService.getById(ujianId)
    const ujian = data?.data

    if (ujian) {
      setSelectedUjianOption(buildUjianOption(ujian))
      return
    }

    setSelectedUjianOption({
      value: String(ujianId),
      label: `Ujian #${ujianId}`
    })
  }, [buildUjianOption])

  const hydrateSelectedSiswaOption = useCallback(async (siswaId) => {
    if (!siswaId) {
      setSelectedSiswaOption(null)
      return
    }

    const { data } = await siswaService.getById(siswaId)
    const siswa = data?.data

    if (siswa) {
      setSelectedSiswaOption(buildSiswaOption(siswa))
      return
    }

    setSelectedSiswaOption({
      value: String(siswaId),
      label: `Siswa #${siswaId}`
    })
  }, [buildSiswaOption])

  useEffect(() => {
    if (formData.trx_ujian_id) {
      hydrateSelectedUjianOption(formData.trx_ujian_id)
    } else {
      setSelectedUjianOption(null)
    }
  }, [formData.trx_ujian_id, hydrateSelectedUjianOption])

  useEffect(() => {
    if (formData.mst_siswa_id) {
      hydrateSelectedSiswaOption(formData.mst_siswa_id)
    } else {
      setSelectedSiswaOption(null)
    }
  }, [formData.mst_siswa_id, hydrateSelectedSiswaOption])

  const handleEditChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isEditMode) {
      if (!formData.trx_ujian_id || !formData.mst_siswa_id) {
        showError('Ujian dan Siswa wajib dipilih')
        return
      }

      setLoading(true)
      const submitData = {
        trx_ujian_id: parseInt(formData.trx_ujian_id),
        mst_siswa_id: parseInt(formData.mst_siswa_id),
      }

      const result = await ujianUserService.update(id, submitData)
      setLoading(false)

      if (!result.error) {
        showSuccess('Ujian user berhasil diperbarui!')
        navigate('/akademik/ujian-user')
      } else {
        showError(result.error?.message || 'Gagal memperbarui ujian user')
      }
      return
    }

    // Bulk Mode Submission
    const newErrors = {}
    if (!selectedUjianId) newErrors.trx_ujian_id = 'Pilih ujian terlebih dahulu'
    if (selectedSiswaIds.size === 0) newErrors.siswa_ids = 'Pilih minimal satu siswa dari tabel'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      showError(newErrors.trx_ujian_id || newErrors.siswa_ids)
      return
    }

    setLoading(true)
    setErrors({})

    const durationSeconds = Math.max(60, (Number(durasiMenit) || 60) * 60)
    const payload = {
      trx_ujian_id: Number(selectedUjianId),
      siswa_ids: Array.from(selectedSiswaIds),
      sisa_waktu: durationSeconds,
    }

    try {
      const { data, error } = await ujianUserService.bulkCreate(payload)

      if (error) {
        if (error.errors) setErrors(error.errors)
        showError(error.message || 'Gagal mendaftarkan peserta ujian.')
        setLoading(false)
        return
      }

      const createdCount = data?.data?.created_count ?? data?.created_count ?? payload.siswa_ids.length
      const skippedCount = data?.data?.skipped_count ?? data?.skipped_count ?? 0

      let msg = `${createdCount} peserta ujian berhasil didaftarkan!`
      if (skippedCount > 0) {
        msg += ` (${skippedCount} siswa dilewati karena sudah terdaftar)`
      }

      showSuccess(msg)
      navigate('/akademik/ujian-user')
    } catch (err) {
      console.error('Bulk create ujian user error:', err)
      showError('Terjadi kesalahan saat mendaftarkan peserta ujian.')
      setLoading(false)
    }
  }

  // Render Edit Mode (Single Registration Update)
  if (isEditMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/akademik/ujian-user')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Ujian User
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
                {/* Ujian Select */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ujian <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    name="trx_ujian_id"
                    value={formData.trx_ujian_id}
                    onChange={handleEditChange}
                    options={selectedUjianOption ? [selectedUjianOption] : []}
                    loadOptions={searchUjianOptions}
                    placeholder="Pilih Ujian"
                    searchPlaceholder="Cari ujian berdasarkan nama..."
                    noOptionsText="Tidak ada ujian yang cocok"
                    error={errors.trx_ujian_id}
                  />
                  {errors.trx_ujian_id && (
                    <p className="mt-1 text-sm text-red-500">
                      {Array.isArray(errors.trx_ujian_id) ? errors.trx_ujian_id[0] : errors.trx_ujian_id}
                    </p>
                  )}
                </div>

                {/* Siswa Select */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Siswa <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    name="mst_siswa_id"
                    value={formData.mst_siswa_id}
                    onChange={handleEditChange}
                    options={selectedSiswaOption ? [selectedSiswaOption] : []}
                    loadOptions={searchSiswaOptions}
                    placeholder="Pilih Siswa"
                    searchPlaceholder="Cari siswa berdasarkan nama atau NIS..."
                    noOptionsText="Tidak ada siswa yang cocok"
                    error={errors.mst_siswa_id}
                  />
                  {errors.mst_siswa_id && (
                    <p className="mt-1 text-sm text-red-500">
                      {Array.isArray(errors.mst_siswa_id) ? errors.mst_siswa_id[0] : errors.mst_siswa_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">Informasi</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>Pastikan ujian dan siswa sudah benar sebelum menyimpan</li>
                  <li>Setelah disimpan, status ujian user akan menjadi "Belum Mulai"</li>
                  <li>Siswa dapat memulai ujian setelah data ini dibuat</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="button" variant="secondary" onClick={() => navigate('/akademik/ujian-user')}>
                  Batal
                </Button>
                <PermissionGuard permission="ujian-user.update">
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
  // Render Create Mode (Bulk Enrollment by Class)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/akademik/ujian-user')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tambah Peserta Ujian</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pilih ujian dan centang siswa dari tabel untuk mendaftarkan peserta secara massal.
            </p>
          </div>
        </div>
      </div>

      {/* Card 1: Konfigurasi Ujian */}
      <Card>
        <div className="p-4 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            1. Konfigurasi Ujian
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ujian <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                name="trx_ujian_id"
                value={selectedUjianId}
                onChange={(e) => {
                  setSelectedUjianId(e.target.value)
                  if (errors.trx_ujian_id) setErrors((prev) => ({ ...prev, trx_ujian_id: null }))
                }}
                options={ujianOptions}
                placeholder="Pilih ujian..."
                error={errors.trx_ujian_id}
                disabled={loadingInitial}
              />
              {loadingExisting && (
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 flex items-center gap-1">
                  <RefreshCw size={12} className="animate-spin" /> Memeriksa peserta terdaftar...
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Durasi Ujian (Menit) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                name="durasi_menit"
                min="1"
                value={durasiMenit}
                onChange={(e) => setDurasiMenit(e.target.value)}
                placeholder="Durasi dalam menit (contoh: 60)"
              />
            </div>
          </div>
        </div>
      </Card>
      {/* Card 2: Tabel Pemilihan Siswa */}
      <Card>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                2. Pilih Siswa Peserta Ujian
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gunakan filter kelas atau pencarian untuk mempermudah pemilihan siswa.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">
                <Users size={14} className="mr-1.5" />
                {selectedSiswaIds.size} Siswa Dipilih
              </span>
              {selectedSiswaIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelections}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline px-2 py-1"
                >
                  Batal Pilih
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau NIS..."
                className="w-full pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div>
              <select
                aria-label="Filter Kelas"
                value={filterKelasId}
                onChange={(e) => setFilterKelasId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                <option value="">Semua Kelas</option>
                {kelasOptions.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleSelectAllFiltered}
                disabled={selectableFilteredSiswa.length === 0}
                className="text-xs"
              >
                {isAllFilteredSelected ? 'Batal Pilih Semua' : `Pilih Semua (${selectableFilteredSiswa.length})`}
              </Button>
            </div>
          </div>

          {errors.siswa_ids && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {errors.siswa_ids}
            </div>
          )}

          {/* Table Container */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th scope="col" className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeFilteredSelected
                        }}
                        onChange={handleToggleSelectAllFiltered}
                        disabled={selectableFilteredSiswa.length === 0}
                        aria-label="Pilih semua siswa di tabel"
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                    </th>
                    <th scope="col" className="py-3 px-4">NIS</th>
                    <th scope="col" className="py-3 px-4">Nama Siswa</th>
                    <th scope="col" className="py-3 px-4">Kelas</th>
                    <th scope="col" className="py-3 px-4">Jenis Kelamin</th>
                    <th scope="col" className="py-3 px-4 text-center">Status Ujian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {loadingInitial ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500 dark:text-gray-400">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-primary-500" />
                        Memuat daftar siswa...
                      </td>
                    </tr>
                  ) : paginatedSiswa.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500 dark:text-gray-400">
                        <Users size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                        Tidak ada siswa yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedSiswa.map((siswa) => {
                      const idNum = Number(siswa.id)
                      const isAlreadyEnrolled = existingSiswaIds.has(idNum)
                      const isSelected = selectedSiswaIds.has(idNum)

                      return (
                        <tr
                          key={siswa.id}
                          onClick={() => handleToggleStudent(idNum)}
                          className={`transition-colors ${
                            isAlreadyEnrolled
                              ? 'bg-gray-50/70 dark:bg-gray-800/40 opacity-75 cursor-not-allowed'
                              : isSelected
                              ? 'bg-primary-50/80 dark:bg-primary-950/30 hover:bg-primary-100/70 dark:hover:bg-primary-950/50 cursor-pointer'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
                          }`}
                        >
                          <td
                            className="p-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isAlreadyEnrolled}
                              onChange={() => handleToggleStudent(idNum)}
                              aria-label={`Pilih ${siswa.nama}`}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">
                            {siswa.nis || '-'}
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                            {siswa.nama}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                            {siswa.kelas?.nama_kelas || '-'}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                            {siswa.jenis_kelamin || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isAlreadyEnrolled ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                Sudah Terdaftar
                              </span>
                            ) : isSelected ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                <Check size={12} className="mr-1" /> Terpilih
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                Belum Terdaftar
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>

              </table>
            </div>
            {/* Pagination & Summary Bar */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span>Menampilkan {paginatedSiswa.length} dari {totalFiltered} siswa</span>
                <span className="text-gray-400 dark:text-gray-600">|</span>
                <label className="flex items-center gap-1.5">
                  <span>Baris per halaman:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="py-1 px-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value="all">Semua</option>
                  </select>
                </label>
              </div>

              {pageSize !== 'all' && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2 py-1 text-xs"
                  >
                    Sebelumnya
                  </Button>
                  <span className="px-2 font-medium text-gray-900 dark:text-white">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2 py-1 text-xs"
                  >
                    Berikutnya
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/akademik/ujian-user')}
            >
              Batal
            </Button>
            <PermissionGuard permission="ujian-user.create">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || selectedSiswaIds.size === 0}
              >
                <Save size={18} className="mr-2" />
                {loading ? 'Mendaftarkan...' : `Daftarkan (${selectedSiswaIds.size} Siswa)`}
              </Button>
            </PermissionGuard>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default UjianUserForm