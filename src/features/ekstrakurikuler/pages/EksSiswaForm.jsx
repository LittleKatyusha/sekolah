import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, RefreshCw, Save, Search, Users, X } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { eksSiswaService, ekstrakurikulerService } from '../services/ekstrakurikulerService'
import { siswaService } from '../../siswa/services/siswaService'
import { kelasService } from '../../kelas/services/kelasService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_OPTIONS = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'keluar', label: 'Keluar' },
]

const getItems = (response) => {
  if (Array.isArray(response?.data?.data)) return response.data.data
  if (Array.isArray(response?.data?.data?.data)) return response.data.data.data
  if (Array.isArray(response?.data)) return response.data
  return []
}

const EksSiswaForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  const [formData, setFormData] = useState({
    ekstrakurikuler_id: '',
    siswa_id: '',
    tanggal_daftar: '',
    status: 'aktif',
  })

  const [errors, setErrors] = useState({})
  const [ekskulOptions, setEkskulOptions] = useState([])
  const [selectedEkskulOption, setSelectedEkskulOption] = useState(null)
  const [selectedSiswaOption, setSelectedSiswaOption] = useState(null)

  // Bulk enrollment state
  const [selectedEkskulId, setSelectedEkskulId] = useState('')
  const [tanggalDaftar, setTanggalDaftar] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState('aktif')
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

  const buildEkskulOption = useCallback((ekskul) => ({
    value: String(ekskul.id),
    label: ekskul.nama || `Ekskul #${ekskul.id}`
  }), [])

  const buildSiswaOption = useCallback((siswa) => ({
    value: String(siswa.id),
    label: siswa.nama ? `${siswa.nama}${siswa.nis ? ` (${siswa.nis})` : ''}` : `Siswa #${siswa.id}`
  }), [])

  const searchSiswaOptions = useCallback(async (keyword = '') => {
    const { data, error } = await siswaService.getAll({
      search: keyword || undefined,
      per_page: 20
    })

    if (data?.data) {
      return data.data.map(buildSiswaOption)
    }

    console.error('Failed to fetch siswa options:', error)
    return []
  }, [buildSiswaOption])

  // Load Initial Options (Ekskul, Kelas, Siswa)
  useEffect(() => {
    let cancelled = false

    const loadInitialData = async () => {
      setLoadingInitial(true)
      try {
        const [ekskulRes, kelasRes, siswaRes] = await Promise.all([
          ekstrakurikulerService.getAll({ per_page: 100 }),
          kelasService.getAll({ per_page: 'all' }),
          siswaService.getAll({ per_page: 'all' }),
        ])

        if (cancelled) return

        const loadedEkskul = getItems(ekskulRes).map(buildEkskulOption)
        const loadedKelas = getItems(kelasRes).map((k) => ({
          value: String(k.id),
          label: k.nama_kelas || `Kelas #${k.id}`,
        }))
        const loadedSiswa = getItems(siswaRes)

        setEkskulOptions(loadedEkskul)
        setKelasOptions(loadedKelas)
        setAllSiswa(loadedSiswa)
      } catch (err) {
        console.error('Failed to load initial data for ekskul pendaftaran:', err)
      } finally {
        if (!cancelled) setLoadingInitial(false)
      }
    }

    loadInitialData()
    return () => { cancelled = true }
  }, [buildEkskulOption])

  // Fetch single registration if in Edit Mode
  useEffect(() => {
    if (!isEditMode) return

    const fetchPendaftaran = async () => {
      setFetchingData(true)
      const { data, error } = await eksSiswaService.getById(id)
      if (data) {
        const pendaftaran = data.data
        const ekskulIdVal = pendaftaran.ekstrakurikuler_id ? String(pendaftaran.ekstrakurikuler_id) : (pendaftaran.ekstrakurikuler?.id ? String(pendaftaran.ekstrakurikuler.id) : '')
        const siswaIdVal = pendaftaran.siswa_id ? String(pendaftaran.siswa_id) : (pendaftaran.siswa?.id ? String(pendaftaran.siswa.id) : '')

        setFormData({
          ekstrakurikuler_id: ekskulIdVal,
          siswa_id: siswaIdVal,
          tanggal_daftar: pendaftaran.tanggal_daftar || '',
          status: pendaftaran.status || 'aktif',
        })

        if (pendaftaran.ekstrakurikuler?.id) {
          setSelectedEkskulOption(buildEkskulOption(pendaftaran.ekstrakurikuler))
        } else if (ekskulIdVal) {
          setSelectedEkskulOption({ value: ekskulIdVal, label: `Ekskul #${ekskulIdVal}` })
        }

        if (pendaftaran.siswa?.id) {
          setSelectedSiswaOption(buildSiswaOption(pendaftaran.siswa))
        } else if (siswaIdVal) {
          setSelectedSiswaOption({ value: siswaIdVal, label: `Siswa #${siswaIdVal}` })
        }
      } else {
        console.error(error)
        showError('Gagal mengambil data pendaftaran')
        navigate('/ekstrakurikuler/pendaftaran')
      }
      setFetchingData(false)
    }

    fetchPendaftaran()
  }, [buildEkskulOption, buildSiswaOption, id, isEditMode, navigate])

  // When selectedEkskulId changes in Bulk Mode, fetch existing registered students
  useEffect(() => {
    if (isEditMode || !selectedEkskulId) {
      setExistingSiswaIds(new Set())
      return
    }

    let cancelled = false
    const fetchExisting = async () => {
      setLoadingExisting(true)
      try {
        const res = await eksSiswaService.getByEkstrakurikuler(selectedEkskulId)
        if (cancelled) return
        const participants = getItems(res)
        const enrolledIds = new Set(participants.map((p) => Number(p.siswa_id || p.siswa?.id)).filter(Boolean))
        setExistingSiswaIds(enrolledIds)

        // Remove any existing students from current selections
        setSelectedSiswaIds((prev) => {
          const next = new Set(prev)
          enrolledIds.forEach((sId) => next.delete(sId))
          return next
        })
      } catch (err) {
        console.error('Failed to fetch existing pendaftaran for ekskul:', err)
      } finally {
        if (!cancelled) setLoadingExisting(false)
      }
    }

    fetchExisting()
    return () => { cancelled = true }
  }, [isEditMode, selectedEkskulId])

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
      setLoading(true)
      const result = await eksSiswaService.updateStatus(id, formData.status)
      setLoading(false)

      if (!result.error) {
        showSuccess('Pendaftaran berhasil diperbarui!')
        navigate('/ekstrakurikuler/pendaftaran')
      } else {
        showError(result.error.message || 'Gagal memperbarui status pendaftaran')
      }
      return
    }

    // Bulk Mode Submission
    const newErrors = {}
    if (!selectedEkskulId) newErrors.ekstrakurikuler_id = 'Pilih ekstrakurikuler terlebih dahulu'
    if (selectedSiswaIds.size === 0) newErrors.siswa_ids = 'Pilih minimal satu siswa dari tabel'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      showError(newErrors.ekstrakurikuler_id || newErrors.siswa_ids)
      return
    }

    setLoading(true)
    setErrors({})

    const payload = {
      ekstrakurikuler_id: Number(selectedEkskulId),
      siswa_ids: Array.from(selectedSiswaIds),
      tanggal_daftar: tanggalDaftar || undefined,
      status: status || 'aktif',
    }

    try {
      const { data, error } = await eksSiswaService.bulkCreate(payload)

      if (error) {
        if (error.errors) setErrors(error.errors)
        showError(error.message || 'Gagal mendaftarkan siswa ke ekstrakurikuler.')
        setLoading(false)
        return
      }

      const createdCount = data?.data?.created_count ?? data?.created_count ?? payload.siswa_ids.length
      const skippedCount = data?.data?.skipped_count ?? data?.skipped_count ?? 0

      let msg = `${createdCount} siswa berhasil didaftarkan ke ekstrakurikuler!`
      if (skippedCount > 0) {
        msg += ` (${skippedCount} siswa dilewati karena sudah terdaftar)`
      }

      showSuccess(msg)
      navigate('/ekstrakurikuler/pendaftaran')
    } catch (err) {
      console.error('Bulk create ekskul siswa error:', err)
      showError('Terjadi kesalahan saat mendaftarkan siswa ke ekstrakurikuler.')
      setLoading(false)
    }
  }

  // Render Edit Mode
  if (isEditMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/ekstrakurikuler/pendaftaran')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Pendaftaran Ekskul
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Siswa
                  </label>
                  <SearchableSelect
                    name="siswa_id"
                    value={formData.siswa_id}
                    onChange={handleEditChange}
                    options={selectedSiswaOption ? [selectedSiswaOption] : []}
                    loadOptions={searchSiswaOptions}
                    placeholder="Pilih siswa"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ekstrakurikuler
                  </label>
                  <SearchableSelect
                    name="ekstrakurikuler_id"
                    value={formData.ekstrakurikuler_id}
                    onChange={handleEditChange}
                    options={selectedEkskulOption ? [selectedEkskulOption] : []}
                    placeholder="Pilih ekstrakurikuler"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tanggal Daftar
                  </label>
                  <Input
                    type="date"
                    name="tanggal_daftar"
                    value={formData.tanggal_daftar}
                    onChange={handleEditChange}
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    name="status"
                    value={formData.status}
                    onChange={handleEditChange}
                    options={STATUS_OPTIONS}
                    placeholder="Pilih status"
                    error={errors.status}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="button" variant="secondary" onClick={() => navigate('/ekstrakurikuler/pendaftaran')}>
                  Batal
                </Button>
                <PermissionGuard permission="ekstrakurikuler.pendaftaran.manage">
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
            onClick={() => navigate('/ekstrakurikuler/pendaftaran')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tambah Pendaftaran Ekskul</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pilih ekstrakurikuler dan centang siswa dari tabel untuk mendaftarkan peserta secara massal.
            </p>
          </div>
        </div>
      </div>

      {/* Card 1: Konfigurasi Ekskul */}
      <Card>
        <div className="p-4 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            1. Konfigurasi Ekstrakurikuler
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ekstrakurikuler <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                name="ekstrakurikuler_id"
                value={selectedEkskulId}
                onChange={(e) => {
                  setSelectedEkskulId(e.target.value)
                  if (errors.ekstrakurikuler_id) setErrors((prev) => ({ ...prev, ekstrakurikuler_id: null }))
                }}
                options={ekskulOptions}
                placeholder="Pilih ekstrakurikuler..."
                error={errors.ekstrakurikuler_id}
                disabled={loadingInitial}
              />
              {loadingExisting && (
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 flex items-center gap-1">
                  <RefreshCw size={12} className="animate-spin" /> Memeriksa anggota terdaftar...
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tanggal Daftar <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                name="tanggal_daftar"
                value={tanggalDaftar}
                onChange={(e) => setTanggalDaftar(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="select-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                id="select-status"
                aria-label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
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
                2. Pilih Siswa Anggota
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
                    <th scope="col" className="py-3 px-4 text-center">Status Keanggotaan</th>
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
              onClick={() => navigate('/ekstrakurikuler/pendaftaran')}
            >
              Batal
            </Button>
            <PermissionGuard permission="ekstrakurikuler.pendaftaran.manage">
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

export default EksSiswaForm
