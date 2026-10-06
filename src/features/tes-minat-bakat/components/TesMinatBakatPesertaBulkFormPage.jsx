import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  RefreshCw,
  Save,
  Search,
  Users,
  X,
} from 'lucide-react'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import tesMinatBakatService from '../services/tesMinatBakatService'
import { siswaService } from '../../siswa/services/siswaService'
import { kelasService } from '../../kelas/services/kelasService'
import { showError, showSuccess } from '../../../utils/sweetalert'
import { STATUS_PESERTA_OPTIONS } from '../config.jsx'

const getItems = (response) => {
  if (Array.isArray(response?.data?.data)) return response.data.data
  if (Array.isArray(response?.data?.data?.data)) return response.data.data.data
  if (Array.isArray(response?.data)) return response.data
  return []
}

const TesMinatBakatPesertaBulkFormPage = () => {
  const navigate = useNavigate()

  // Form State
  const [selectedTesId, setSelectedTesId] = useState('')
  const [selectedStatus, setSelectedStatus] = useState(0)
  const [tesOptions, setTesOptions] = useState([])
  const [kelasOptions, setKelasOptions] = useState([])
  const [allSiswa, setAllSiswa] = useState([])

  // Existing Participants for selected test
  const [existingSiswaIds, setExistingSiswaIds] = useState(new Set())
  const [loadingExisting, setLoadingExisting] = useState(false)

  // Selection & Filter State
  const [selectedSiswaIds, setSelectedSiswaIds] = useState(new Set())
  const [filterKelasId, setFilterKelasId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Status flags
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Load Initial Data (Tes, Kelas, Siswa)
  useEffect(() => {
    let cancelled = false

    const loadInitialData = async () => {
      setLoadingInitial(true)
      try {
        const [tesRes, kelasRes, siswaRes] = await Promise.all([
          tesMinatBakatService.tes.getAll({ per_page: 'all', sort_by: 'nama_tes', sort_dir: 'asc' }),
          kelasService.getAll({ per_page: 'all' }),
          siswaService.getAll({ per_page: 'all' }),
        ])

        if (cancelled) return

        const loadedTests = getItems(tesRes).map((t) => ({
          value: t.id,
          label: t.nama_tes || `Tes #${t.id}`,
        }))

        const loadedKelas = getItems(kelasRes).map((k) => ({
          value: k.id,
          label: k.nama_kelas || `Kelas #${k.id}`,
        }))

        const loadedSiswa = getItems(siswaRes)

        setTesOptions(loadedTests)
        setKelasOptions(loadedKelas)
        setAllSiswa(loadedSiswa)
      } catch (err) {
        console.error('Failed to load initial data for peserta bulk create:', err)
        showError('Gagal memuat data pendukung peserta tes.')
      } finally {
        if (!cancelled) setLoadingInitial(false)
      }
    }

    loadInitialData()
    return () => { cancelled = true }
  }, [])

  // When selectedTesId changes, fetch existing participants for that test
  useEffect(() => {
    if (!selectedTesId) {
      setExistingSiswaIds(new Set())
      return
    }

    let cancelled = false
    const fetchExisting = async () => {
      setLoadingExisting(true)
      try {
        const res = await tesMinatBakatService.peserta.getByTes(selectedTesId)
        if (cancelled) return
        const participants = getItems(res)
        const enrolledIds = new Set(participants.map((p) => Number(p.siswa_id)).filter(Boolean))
        setExistingSiswaIds(enrolledIds)

        // Unselect any students that are already registered
        setSelectedSiswaIds((prev) => {
          const next = new Set(prev)
          enrolledIds.forEach((id) => next.delete(id))
          return next
        })
      } catch (err) {
        console.error('Failed to fetch existing participants for test:', err)
      } finally {
        if (!cancelled) setLoadingExisting(false)
      }
    }

    fetchExisting()
    return () => { cancelled = true }
  }, [selectedTesId])

  // Filtered students list
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

  // Selectable students in current filtered view (excluding already registered)
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

  // Toggle all selectable filtered students
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

  // Toggle single student
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

  // Clear all selections
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

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterKelasId, searchQuery, pageSize])

  // Form submission
  const handleSubmit = async (e) => {
    e?.preventDefault?.()

    const newErrors = {}
    if (!selectedTesId) {
      newErrors.tes_id = 'Pilih tes terlebih dahulu'
    }

    if (selectedSiswaIds.size === 0) {
      newErrors.siswa_ids = 'Pilih minimal satu siswa dari tabel'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      showError(newErrors.tes_id || newErrors.siswa_ids)
      return
    }

    setSubmitting(true)
    setErrors({})

    const payload = {
      tes_id: Number(selectedTesId),
      siswa_ids: Array.from(selectedSiswaIds),
      status: Number(selectedStatus),
    }

    try {
      const { data, error } = await tesMinatBakatService.peserta.bulkCreate(payload)

      if (error) {
        if (error.errors) {
          setErrors(error.errors)
        }
        showError(error.message || 'Gagal mendaftarkan peserta tes.')
        setSubmitting(false)
        return
      }

      const createdCount = data?.data?.created_count ?? data?.created_count ?? payload.siswa_ids.length
      const skippedCount = data?.data?.skipped_count ?? data?.skipped_count ?? 0

      let msg = `${createdCount} peserta berhasil didaftarkan!`
      if (skippedCount > 0) {
        msg += ` (${skippedCount} siswa dilewati karena sudah terdaftar)`
      }

      showSuccess(msg)
      navigate('/akademik/tes-minat-bakat/peserta')
    } catch (err) {
      console.error('Bulk create peserta error:', err)
      showError('Terjadi kesalahan saat mendaftarkan peserta.')
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/akademik/tes-minat-bakat/peserta')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tambah Peserta</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pilih tes dan centang siswa dari tabel untuk mendaftarkan peserta secara massal.
            </p>
          </div>
        </div>
      </div>

      {/* Card 1: Pengaturan Tes & Status */}
      <Card>
        <div className="p-4 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            1. Konfigurasi Tes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tes <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                name="tes_id"
                value={selectedTesId}
                onChange={(e) => {
                  setSelectedTesId(e.target.value)
                  if (errors.tes_id) setErrors((prev) => ({ ...prev, tes_id: null }))
                }}
                options={tesOptions}
                placeholder="Pilih tes..."
                error={errors.tes_id}
                disabled={loadingInitial}
              />
              {loadingExisting && (
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 flex items-center gap-1">
                  <RefreshCw size={12} className="animate-spin" /> Memeriksa peserta terdaftar...
                </p>
              )}
            </div>

            <div>
              <label htmlFor="select-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                id="select-status"
                aria-label="Status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                {STATUS_PESERTA_OPTIONS.map((opt) => (
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
                2. Pilih Siswa Peserta Tes
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gunakan filter kelas atau pencarian untuk mempermudah pemilihan siswa.
              </p>
            </div>

            {/* Selected Count & Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                selectedSiswaIds.size > 0
                  ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
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
                    <th scope="col" className="py-3 px-4 text-center">Status Tes</th>
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
                <span>
                  Menampilkan {paginatedSiswa.length} dari {totalFiltered} siswa
                </span>
                <span className="text-gray-400 dark:text-gray-600">•</span>
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {selectedSiswaIds.size} dipilih
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none"
                >
                  <option value={25}>25 / halaman</option>
                  <option value={50}>50 / halaman</option>
                  <option value={100}>100 / halaman</option>
                  <option value="all">Semua</option>
                </select>

                {pageSize !== 'all' && totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      &lt;
                    </button>
                    <span className="px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      &gt;
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedSiswaIds.size > 0 ? (
                <span>
                  Siap mendaftarkan <strong className="text-gray-900 dark:text-white">{selectedSiswaIds.size} siswa</strong> ke tes terpilih.
                </span>
              ) : (
                <span>Centang siswa di atas untuk mendaftarkan peserta.</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/akademik/tes-minat-bakat/peserta')}
                disabled={submitting}
              >
                Batal
              </Button>
              <PermissionGuard permission="tes-minat-bakat-peserta.create">
                <Button
                  type="button"
                  variant="primary"
                  loading={submitting}
                  disabled={submitting || selectedSiswaIds.size === 0 || !selectedTesId}
                  onClick={handleSubmit}
                  className="flex items-center gap-2"
                >
                  <Save size={18} />
                  Simpan ({selectedSiswaIds.size} Siswa)
                </Button>
              </PermissionGuard>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default TesMinatBakatPesertaBulkFormPage
