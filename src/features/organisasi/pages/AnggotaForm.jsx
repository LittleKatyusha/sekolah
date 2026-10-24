import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, RefreshCw, Save, Search, Users, X } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { anggotaService, organisasiService, jabatanService } from '../services/organisasiService'
import { siswaService } from '../../siswa/services/siswaService'
import { kelasService } from '../../kelas/services/kelasService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { extractGridRows } from '../../../components/ui/agGridQuery'

const STATUS_OPTIONS = [
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Tidak Aktif' },
  { value: '2', label: 'Alumni' },
]

const getItems = (response) => {
  if (Array.isArray(response?.data?.data)) return response.data.data
  if (Array.isArray(response?.data?.data?.data)) return response.data.data.data
  if (Array.isArray(response?.data)) return response.data
  return []
}

const AnggotaForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)

  // Edit Mode state
  const [formData, setFormData] = useState({
    organisasi_id: '',
    siswa_id: '',
    jabatan_id: '',
    tanggal_masuk: '',
    tanggal_keluar: '',
    status: '1',
  })

  const [errors, setErrors] = useState({})
  const [organisasiOptions, setOrganisasiOptions] = useState([])
  const [jabatanOptions, setJabatanOptions] = useState([])
  const [selectedOrganisasiOption, setSelectedOrganisasiOption] = useState(null)
  const [selectedSiswaOption, setSelectedSiswaOption] = useState(null)
  const [selectedJabatanOption, setSelectedJabatanOption] = useState(null)

  // Bulk Mode state
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [selectedJabatanId, setSelectedJabatanId] = useState('')
  const [periode, setPeriode] = useState('')
  const [tanggalMasuk, setTanggalMasuk] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState('1')
  const [kelasOptions, setKelasOptions] = useState([])
  const [siswaRows, setSiswaRows] = useState([])
  const [totalFiltered, setTotalFiltered] = useState(0)
  const [loadingSiswa, setLoadingSiswa] = useState(true)
  const [existingSiswaIds, setExistingSiswaIds] = useState(new Set())
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [selectedSiswaIds, setSelectedSiswaIds] = useState(new Set())
  const [filterKelasId, setFilterKelasId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [loadingInitial, setLoadingInitial] = useState(true)

  const buildOrganisasiOption = useCallback((org) => ({
    value: String(org.id),
    label: org.nama || `Organisasi #${org.id}`,
  }), [])

  const buildJabatanOption = useCallback((jab) => ({
    value: String(jab.id),
    label: jab.nama || `Jabatan #${jab.id}`,
  }), [])

  const buildSiswaOption = useCallback((siswa) => ({
    value: String(siswa.id),
    label: siswa.nama ? `${siswa.nama}${siswa.nis ? ` (${siswa.nis})` : ''}` : `Siswa #${siswa.id}`,
  }), [])

  const searchSiswaOptions = useCallback(async (keyword = '') => {
    const { data, error } = await siswaService.getAll({
      search: keyword || undefined,
      per_page: 20,
    })

    if (data?.data) {
      return data.data.map(buildSiswaOption)
    }

    console.error('Failed to fetch siswa options:', error)
    return []
  }, [buildSiswaOption])

  // Load initial options (Organisasi, Jabatan, Kelas)
  useEffect(() => {
    let cancelled = false

    const loadInitialData = async () => {
      setLoadingInitial(true)
      try {
        const [orgRes, jabatanRes, kelasRes] = await Promise.all([
          organisasiService.getAktif(),
          jabatanService.getAllList(),
          kelasService.getAll({ per_page: 'all' }),
        ])

        if (cancelled) return

        const loadedOrg = getItems(orgRes).map(buildOrganisasiOption)
        const loadedJabatan = getItems(jabatanRes).map(buildJabatanOption)
        const loadedKelas = getItems(kelasRes).map((k) => ({
          value: String(k.id),
          label: k.nama_kelas || `Kelas #${k.id}`,
        }))

        setOrganisasiOptions(loadedOrg)
        setJabatanOptions(loadedJabatan)
        setKelasOptions(loadedKelas)

        // Pre-select default jabatan if available (e.g. Anggota)
        if (loadedJabatan.length > 0) {
          const defaultJab = loadedJabatan.find((j) => /anggota/i.test(j.label)) || loadedJabatan[0]
          setSelectedJabatanId(defaultJab.value)
        }
      } catch (err) {
        console.error('Failed to load initial data for organisasi anggota:', err)
      } finally {
        if (!cancelled) setLoadingInitial(false)
      }
    }

    loadInitialData()
    return () => { cancelled = true }
  }, [buildJabatanOption, buildOrganisasiOption])

  // Fetch single membership if in Edit Mode
  useEffect(() => {
    if (!isEditMode) return

    const fetchAnggota = async () => {
      setFetchingData(true)
      const { data, error } = await anggotaService.getById(id)
      if (data) {
        const anggota = data.data
        const orgIdVal = anggota.organisasi_id ? String(anggota.organisasi_id) : (anggota.organisasi?.id ? String(anggota.organisasi.id) : '')
        const siswaIdVal = anggota.siswa_id ? String(anggota.siswa_id) : (anggota.siswa?.id ? String(anggota.siswa.id) : '')
        const jabatanIdVal = anggota.jabatan_id ? String(anggota.jabatan_id) : (anggota.jabatan?.id ? String(anggota.jabatan.id) : '')

        setFormData({
          organisasi_id: orgIdVal,
          siswa_id: siswaIdVal,
          jabatan_id: jabatanIdVal,
          tanggal_masuk: anggota.tanggal_masuk || '',
          tanggal_keluar: anggota.tanggal_keluar || '',
          status: anggota.status != null ? String(anggota.status) : '1',
        })

        if (anggota.organisasi?.id) {
          setSelectedOrganisasiOption(buildOrganisasiOption(anggota.organisasi))
        } else if (orgIdVal) {
          setSelectedOrganisasiOption({ value: orgIdVal, label: `Organisasi #${orgIdVal}` })
        }

        if (anggota.siswa?.id) {
          setSelectedSiswaOption(buildSiswaOption(anggota.siswa))
        } else if (siswaIdVal) {
          setSelectedSiswaOption({ value: siswaIdVal, label: `Siswa #${siswaIdVal}` })
        }

        if (anggota.jabatan?.id) {
          setSelectedJabatanOption(buildJabatanOption(anggota.jabatan))
        } else if (jabatanIdVal) {
          setSelectedJabatanOption({ value: jabatanIdVal, label: `Jabatan #${jabatanIdVal}` })
        }
      } else {
        console.error(error)
        showError('Gagal mengambil data anggota')
        navigate('/organisasi/anggota')
      }
      setFetchingData(false)
    }

    fetchAnggota()
  }, [buildJabatanOption, buildOrganisasiOption, buildSiswaOption, id, isEditMode, navigate])

  // When selectedOrgId changes in Bulk Mode, fetch existing members of that organization
  useEffect(() => {
    if (isEditMode || !selectedOrgId) {
      setExistingSiswaIds(new Set())
      return
    }

    let cancelled = false
    const fetchExisting = async () => {
      setLoadingExisting(true)
      try {
        const res = await anggotaService.getByOrganisasi(selectedOrgId)
        if (cancelled) return
        const members = getItems(res)
        const enrolledIds = new Set(members.map((m) => Number(m.siswa_id || m.siswa?.id)).filter(Boolean))
        setExistingSiswaIds(enrolledIds)

        // Remove any existing members from current selections
        setSelectedSiswaIds((prev) => {
          const next = new Set(prev)
          enrolledIds.forEach((sId) => next.delete(sId))
          return next
        })
      } catch (err) {
        console.error('Failed to fetch existing anggota for organisasi:', err)
      } finally {
        if (!cancelled) setLoadingExisting(false)
      }
    }

    fetchExisting()
    return () => { cancelled = true }
  }, [isEditMode, selectedOrgId])

  // Server-side page of students (search/kelas filter + startRow/endRow)
  useEffect(() => {
    if (isEditMode) return
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoadingSiswa(true)
      const startRow = (currentPage - 1) * pageSize
      const { data, error } = await siswaService.getAll({
        startRow,
        endRow: startRow + pageSize,
        search: searchQuery.trim() || undefined,
        kelas_id: filterKelasId || undefined,
      })
      if (cancelled) return
      if (error) {
        console.error('Failed to fetch siswa page:', error)
        setSiswaRows([])
        setTotalFiltered(0)
      } else {
        const { rows, totalCount } = extractGridRows(data)
        setSiswaRows(rows)
        setTotalFiltered(totalCount)
      }
      setLoadingSiswa(false)
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [isEditMode, currentPage, pageSize, searchQuery, filterKelasId])

  // Selectable students in current filtered view (excluding already enrolled)
  const selectableFilteredSiswa = useMemo(() => {
    return siswaRows.filter((s) => !existingSiswaIds.has(Number(s.id)))
  }, [siswaRows, existingSiswaIds])

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

  const totalPages = Math.ceil(totalFiltered / pageSize) || 1
  const paginatedSiswa = siswaRows

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
      const updateData = {
        jabatan_id: parseInt(formData.jabatan_id),
        tanggal_masuk: formData.tanggal_masuk,
        tanggal_keluar: formData.tanggal_keluar || null,
        status: Number(formData.status),
      }
      setLoading(true)
      const result = await anggotaService.update(id, updateData)
      setLoading(false)

      if (!result.error) {
        showSuccess('Anggota berhasil diperbarui!')
        navigate('/organisasi/anggota')
      } else {
        showError(result.error.message || 'Gagal memperbarui anggota')
      }
      return
    }

    // Bulk Mode Submission
    const newErrors = {}
    if (!selectedOrgId) newErrors.organisasi_id = 'Pilih organisasi terlebih dahulu'
    if (!selectedJabatanId) newErrors.jabatan_id = 'Pilih jabatan terlebih dahulu'
    if (selectedSiswaIds.size === 0) newErrors.siswa_ids = 'Pilih minimal satu siswa dari tabel'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      showError(newErrors.organisasi_id || newErrors.jabatan_id || newErrors.siswa_ids)
      return
    }

    setLoading(true)
    setErrors({})

    const payload = {
      organisasi_id: Number(selectedOrgId),
      siswa_ids: Array.from(selectedSiswaIds),
      jabatan_id: Number(selectedJabatanId),
      tanggal_masuk: tanggalMasuk || undefined,
      status: Number(status),
      periode: periode.trim() || undefined,
    }

    try {
      const { data, error } = await anggotaService.bulkCreate(payload)

      if (error) {
        if (error.errors) setErrors(error.errors)
        showError(error.message || 'Gagal mendaftarkan anggota ke organisasi.')
        setLoading(false)
        return
      }

      const createdCount = data?.data?.created_count ?? data?.created_count ?? payload.siswa_ids.length
      const skippedCount = data?.data?.skipped_count ?? data?.skipped_count ?? 0

      let msg = `${createdCount} siswa berhasil didaftarkan ke organisasi!`
      if (skippedCount > 0) {
        msg += ` (${skippedCount} siswa dilewati karena sudah terdaftar)`
      }

      showSuccess(msg)
      navigate('/organisasi/anggota')
    } catch (err) {
      console.error('Bulk create organisasi anggota error:', err)
      showError('Terjadi kesalahan saat mendaftarkan anggota ke organisasi.')
      setLoading(false)
    }
  }

  // Render Edit Mode
  if (isEditMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/organisasi/anggota')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Anggota Organisasi
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
                    Organisasi
                  </label>
                  <SearchableSelect
                    name="organisasi_id"
                    value={formData.organisasi_id}
                    onChange={handleEditChange}
                    options={selectedOrganisasiOption ? [selectedOrganisasiOption] : []}
                    placeholder="Pilih organisasi"
                    disabled
                  />
                </div>

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
                    Jabatan <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    name="jabatan_id"
                    value={formData.jabatan_id}
                    onChange={handleEditChange}
                    options={jabatanOptions}
                    placeholder="Pilih jabatan"
                    error={errors.jabatan_id}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tanggal Masuk <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    name="tanggal_masuk"
                    value={formData.tanggal_masuk}
                    onChange={handleEditChange}
                    error={errors.tanggal_masuk}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tanggal Keluar
                  </label>
                  <Input
                    type="date"
                    name="tanggal_keluar"
                    value={formData.tanggal_keluar}
                    onChange={handleEditChange}
                    error={errors.tanggal_keluar}
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
                <Button type="button" variant="secondary" onClick={() => navigate('/organisasi/anggota')}>
                  Batal
                </Button>
                <PermissionGuard permission="organisasi.anggota.manage">
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
            onClick={() => navigate('/organisasi/anggota')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tambah Anggota Organisasi</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pilih organisasi dan centang siswa dari tabel untuk mendaftarkan anggota secara massal.
            </p>
          </div>
        </div>
      </div>

      {/* Card 1: Konfigurasi Organisasi & Jabatan */}
      <Card>
        <div className="p-4 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
            1. Konfigurasi Organisasi & Jabatan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Organisasi <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                name="organisasi_id"
                value={selectedOrgId}
                onChange={(e) => {
                  setSelectedOrgId(e.target.value)
                  if (errors.organisasi_id) setErrors((prev) => ({ ...prev, organisasi_id: null }))
                }}
                options={organisasiOptions}
                placeholder="Pilih organisasi"
                error={errors.organisasi_id}
              />
              {loadingExisting && (
                <span className="text-xs text-primary-500 mt-1 inline-block">Memeriksa anggota terdaftar...</span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Jabatan Default <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                name="jabatan_id"
                value={selectedJabatanId}
                onChange={(e) => {
                  setSelectedJabatanId(e.target.value)
                  if (errors.jabatan_id) setErrors((prev) => ({ ...prev, jabatan_id: null }))
                }}
                options={jabatanOptions}
                placeholder="Pilih jabatan"
                error={errors.jabatan_id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Periode
              </label>
              <Input
                type="text"
                name="periode"
                placeholder="misal: 2026/2027"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tanggal Masuk <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                name="tanggal_masuk"
                value={tanggalMasuk}
                onChange={(e) => setTanggalMasuk(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
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
                  {loadingInitial || loadingSiswa ? (
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
                      const isEnrolled = existingSiswaIds.has(idNum)
                      const isSelected = selectedSiswaIds.has(idNum)
                      const kelasLabel = siswa.kelas?.nama_kelas || siswa.nama_kelas || (siswa.mst_kelas_id ? `Kelas #${siswa.mst_kelas_id}` : '-')

                      return (
                        <tr
                          key={siswa.id}
                          onClick={() => handleToggleStudent(siswa.id)}
                          className={`transition-colors cursor-pointer ${
                            isEnrolled
                              ? 'bg-gray-100/60 dark:bg-gray-800/40 opacity-75 cursor-not-allowed'
                              : isSelected
                                ? 'bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100/70 dark:hover:bg-primary-950/60'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                          }`}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected || isEnrolled}
                              disabled={isEnrolled}
                              onChange={() => handleToggleStudent(siswa.id)}
                              aria-label={`Pilih ${siswa.nama}`}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                            {siswa.nis || '-'}
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                            {siswa.nama}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                            {kelasLabel}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                            {siswa.jenis_kelamin === 'L' ? 'Laki-laki' : siswa.jenis_kelamin === 'P' ? 'Perempuan' : (siswa.jenis_kelamin || '-')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEnrolled ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                Sudah Terdaftar
                              </span>
                            ) : isSelected ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                <Check size={12} className="mr-1" />
                                Dipilih
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
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
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="py-1 px-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>
              </div>

              {totalPages > 1 && (
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
              onClick={() => navigate('/organisasi/anggota')}
            >
              Batal
            </Button>
            <PermissionGuard permission="organisasi.anggota.manage">
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

export default AnggotaForm
