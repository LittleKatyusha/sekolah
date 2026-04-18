import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  RefreshCw,
  Calendar,
  User2,
  Sparkles,
  ClipboardList,
  BarChart2,
} from 'lucide-react'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { absensiSiswaService } from '../services/absensiSiswaService'
import { siswaService } from '../../siswa/services/siswaService'
import useAuthStore from '../../../store/useAuthStore'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_META = {
  hadir: {
    label: 'Hadir',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    accentClass: 'text-green-600 dark:text-green-400',
    softClass: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/40',
  },
  sakit: {
    label: 'Sakit',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    accentClass: 'text-orange-600 dark:text-orange-400',
    softClass: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/40',
  },
  izin: {
    label: 'Izin',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    accentClass: 'text-yellow-600 dark:text-yellow-400',
    softClass: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/40',
  },
  alpha: {
    label: 'Alpha',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    accentClass: 'text-red-600 dark:text-red-400',
    softClass: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/40',
  },
  alpa: {
    label: 'Alpha',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    accentClass: 'text-red-600 dark:text-red-400',
    softClass: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/40',
  },
  tidak_hadir: {
    label: 'Tidak Hadir',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    accentClass: 'text-red-600 dark:text-red-400',
    softClass: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/40',
  },
  '1': {
    label: 'Hadir',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    accentClass: 'text-green-600 dark:text-green-400',
    softClass: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/40',
  },
  '2': {
    label: 'Sakit',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    accentClass: 'text-orange-600 dark:text-orange-400',
    softClass: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/40',
  },
  '3': {
    label: 'Izin',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    accentClass: 'text-yellow-600 dark:text-yellow-400',
    softClass: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/40',
  },
  '4': {
    label: 'Alpha',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    accentClass: 'text-red-600 dark:text-red-400',
    softClass: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/40',
  },
}

const getStatusMeta = (status) => {
  const key = status === null || status === undefined ? '' : String(status).toLowerCase()
  return STATUS_META[key] || {
    label: status || '-',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
    accentClass: 'text-gray-600 dark:text-gray-400',
    softClass: 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700',
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const formatShortDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const extractRows = (responseData) => {
  const payload = responseData?.data
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const extractSummary = (responseData) => responseData?.data?.data || responseData?.data || null

const resolveSiswaId = (user) => {
  const profile = user?.profile || {}
  const siswaProfile = user?.siswa || {}

  return profile.mst_siswa_id
    || profile.siswa_id
    || siswaProfile.id
    || user?.mst_siswa_id
    || profile.id
    || null
}


const StatusBadge = ({ status }) => {
  const config = getStatusMeta(status)

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

const StudentAbsensiCard = ({ item }) => {
  const status = item?.status_absensi || item?.status
  const meta = getStatusMeta(status)

  return (
    <div className={`rounded-2xl border p-4 transition-colors ${meta.softClass}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar size={16} />
            <span>{formatDate(item?.tanggal)}</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className={`h-10 w-1 rounded-full ${meta.className.split(' ')[0] || 'bg-gray-300'}`} />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{meta.label}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {item?.keterangan || 'Tidak ada keterangan tambahan untuk absensi ini.'}
              </p>
            </div>
          </div>
        </div>

        <div className="sm:pl-4">
          <StatusBadge status={status} />
        </div>
      </div>
    </div>
  )
}

const StudentAbsensiView = () => {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [summaryData, setSummaryData] = useState(null)
  const [filters, setFilters] = useState({
    tanggal_mulai: '',
    tanggal_akhir: '',
  })
  const [visibleCount, setVisibleCount] = useState(12)

  const siswaId = useMemo(() => resolveSiswaId(user), [user])
  const profile = user?.profile || user?.siswa || {}

  const fetchStudentAttendance = useCallback(async () => {
    if (!siswaId) {
      setError('Data siswa tidak ditemukan. Silakan login ulang atau hubungi admin sekolah.')
      setHistory([])
      setSummaryData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const params = {
      per_page: 100,
      sort_by: 'tanggal',
      sort_dir: 'desc',
      ...(filters.tanggal_mulai ? { tanggal_mulai: filters.tanggal_mulai } : {}),
      ...(filters.tanggal_akhir ? { tanggal_akhir: filters.tanggal_akhir } : {}),
    }

    const [historyResult, summaryResult] = await Promise.all([
      absensiSiswaService.getAbsensiBySiswa(siswaId, params),
      absensiSiswaService.getSummaryBySiswa(siswaId),
    ])

    if (historyResult.error) {
      setError('Gagal memuat riwayat absensi. Coba beberapa saat lagi.')
      setHistory([])
      setSummaryData(extractSummary(summaryResult.data))
      setLoading(false)
      return
    }

    setHistory(extractRows(historyResult.data))
    setSummaryData(summaryResult.error ? null : extractSummary(summaryResult.data))
    setVisibleCount(12)
    setLoading(false)
  }, [filters.tanggal_akhir, filters.tanggal_mulai, siswaId])

  useEffect(() => {
    fetchStudentAttendance()
  }, [fetchStudentAttendance])

  const totalRecords = history.length
  const latestRecord = history[0] || null
  const attendanceHighlight = getStatusMeta(latestRecord?.status_absensi || latestRecord?.status)
  const visibleHistory = history.slice(0, visibleCount)
  const remainingCount = Math.max(totalRecords - visibleHistory.length, 0)

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-6 py-6 shadow-sm dark:border-sky-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 md:px-8 md:py-8">
        <div className="absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-700/20" />
        <div className="absolute bottom-0 left-0 h-28 w-28 -translate-x-6 translate-y-8 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-700/20" />

        <div className="relative flex flex-col gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm dark:border-sky-800 dark:bg-slate-900/70 dark:text-sky-300">
              <Sparkles size={14} />
              Absensi pribadi siswa
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Hai, {profile?.nama || 'Siswa'}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-300 md:text-base">
              Kelola dan pantau kehadiranmu dengan mudah di sini.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm dark:bg-slate-900/70">
                <User2 size={16} className="text-sky-600 dark:text-sky-400" />
                <span>NIS: {profile?.nis || '-'}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm dark:bg-slate-900/70">
                <ClipboardList size={16} className={attendanceHighlight.accentClass} />
                <span>Status terbaru: {latestRecord ? attendanceHighlight.label : 'Belum ada data'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="border border-gray-200/80 bg-white/90 dark:border-gray-800 dark:bg-gray-900/70">
          <div className="space-y-4 p-1">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ringkasan cepat</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Informasi penting agar kamu bisa langsung tahu kondisi kehadiranmu.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-gray-50 px-4 py-4 dark:bg-gray-800/70">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Riwayat</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{summaryData?.total || totalRecords || 0}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-4 dark:bg-gray-800/70">
                <p className="text-sm text-gray-500 dark:text-gray-400">Absensi Terakhir</p>
                <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{latestRecord ? formatDate(latestRecord.tanggal) : '-'}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-4 dark:bg-gray-800/70">
                <p className="text-sm text-gray-500 dark:text-gray-400">Keterangan Terakhir</p>
                <p className="mt-2 line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                  {latestRecord?.keterangan || 'Belum ada catatan tambahan.'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border border-gray-200/80 bg-white/90 dark:border-gray-800 dark:bg-gray-900/70">
          <div className="space-y-4 p-1">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filter riwayat</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Pilih rentang tanggal supaya riwayat yang ditampilkan lebih fokus.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Dari tanggal"
                type="date"
                name="tanggal_mulai"
                value={filters.tanggal_mulai}
                onChange={(e) => setFilters((prev) => ({ ...prev, tanggal_mulai: e.target.value }))}
              />
              <Input
                label="Sampai tanggal"
                type="date"
                name="tanggal_akhir"
                value={filters.tanggal_akhir}
                onChange={(e) => setFilters((prev) => ({ ...prev, tanggal_akhir: e.target.value }))}
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={fetchStudentAttendance} className="sm:flex-1">
                  <RefreshCw size={18} className="mr-2" />
                  Muat Ulang
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setFilters({ tanggal_mulai: '', tanggal_akhir: '' })}
                  className="sm:flex-1"
                >
                  Reset Filter
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border border-gray-200/80 bg-white/90 dark:border-gray-800 dark:bg-gray-900/70">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Riwayat absensi</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Riwayat kehadiran disusun dari yang paling baru agar mudah dicek. Jika datanya banyak, halaman tetap ringan karena ditampilkan bertahap.
            </p>
          </div>
          <div className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Menampilkan {Math.min(visibleHistory.length, totalRecords)} dari {totalRecords} data
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-11 w-11 animate-spin rounded-full border-b-2 border-primary-600" />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 px-6 py-14 text-center dark:border-gray-700">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <ClipboardList size={24} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Belum ada riwayat absensi</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Data absensi akan muncul di sini setelah sekolah mencatat kehadiranmu.
              </p>
            </div>
          ) : (
            <>
              {visibleHistory.map((item) => (
                <StudentAbsensiCard key={item.id || `${item.tanggal}-${item.status_absensi || item.status}`} item={item} />
              ))}

              {remainingCount > 0 && (
                <div className="pt-2">
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 p-4 text-center dark:border-gray-700 dark:bg-gray-800/40">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Masih ada {remainingCount} riwayat lain yang belum ditampilkan.
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => setVisibleCount((prev) => prev + 12)}
                      className="mt-3"
                    >
                      Tampilkan Lebih Banyak
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

const AdminAbsensiSiswaList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [filters, setFilters] = useState({
    tanggal_mulai: '',
    tanggal_akhir: '',
  })
  const [showFilter, setShowFilter] = useState(false)

  const [selectedSiswaOption, setSelectedSiswaOption] = useState(null)
  const [selectedSiswaId, setSelectedSiswaId] = useState('')
  const [summaryData, setSummaryData] = useState(null)

  const buildSiswaOption = useCallback((siswa) => ({
    value: String(siswa.id),
    label: `${siswa.nis || '-'} - ${siswa.nama || `Siswa #${siswa.id}`}`,
  }), [])

  const searchSiswaOptions = useCallback(async (keyword = '') => {
    try {
      const { data } = await siswaService.getAll({
        search: keyword || undefined,
        per_page: 20,
      })
      if (data?.data) {
        return data.data.map(buildSiswaOption)
      }
    } catch (error) {
      console.error('Error fetching siswa options:', error)
    }
    return []
  }, [buildSiswaOption])

  useEffect(() => {
    const fetchSummary = async () => {
      if (!selectedSiswaId) {
        setSummaryData(null)
        return
      }

      const { data: summaryRes } = await absensiSiswaService.getSummaryBySiswa(selectedSiswaId)
      if (summaryRes) {
        setSummaryData(summaryRes.data)
      } else {
        setSummaryData(null)
      }
    }

    fetchSummary()
  }, [selectedSiswaId])

  const endpoint = '/akademik/absensi-siswa'

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    mst_siswa_id: selectedSiswaId || undefined,
    tanggal_awal: filters.tanggal_mulai || undefined,
    tanggal_akhir: filters.tanggal_akhir || undefined,
  }), [filters.tanggal_akhir, filters.tanggal_mulai, selectedSiswaId])

  const handleSiswaChange = useCallback((e) => {
    const val = e.target.value
    setSelectedSiswaId(val)
    if (!val) setSelectedSiswaOption(null)
  }, [])

  const handleDetail = useCallback((data) => {
    if (!data?.id) return
    navigate(`/absensi-siswa/${data.id}`)
  }, [navigate])

  const handleEdit = useCallback((data) => {
    if (!data?.id) return
    navigate(`/absensi-siswa/edit/${data.id}`)
  }, [navigate])

  const handleDelete = useCallback(async (data) => {
    if (!data?.id) {
      showError('Data absensi siswa tidak valid')
      return
    }

    const result = await showDeleteConfirm(data.siswa?.nama || 'absensi ini')
    if (result.isConfirmed) {
      const { error } = await absensiSiswaService.deleteAbsensiSiswa(data.id)
      if (!error) {
        showSuccess('Absensi berhasil dihapus!')
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus absensi')
      }
    }
  }, [])

  const handleAdd = useCallback(() => {
    navigate('/absensi-siswa/tambah')
  }, [navigate])

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const applyFilters = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      tanggal_mulai: '',
      tanggal_akhir: '',
    })
  }, [])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
    // Also try to purge cache and reload if available
    if (gridRef.current?.api) {
      gridRef.current.api.refreshInfiniteCache()
    }
  }, [])

  const columnDefs = useMemo(() => [
    {
      field: 'siswa.nama',
      backendField: 'siswa.nama',
      headerName: 'Nama Siswa',
      sortable: false,
      filter: true,
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => params.data?.siswa?.nama || '-',
      cellRenderer: (params) => params.value || '-',
    },
    {
      field: 'siswa.nis',
      backendField: 'siswa.nis',
      headerName: 'NIS',
      sortable: false,
      filter: true,
      width: 160,
      minWidth: 130,
      valueGetter: (params) => params.data?.siswa?.nis || '-',
      cellRenderer: (params) => params.value || '-',
    },
    {
      field: 'tanggal',
      backendField: 'tanggal',
      headerName: 'Tanggal',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => formatShortDate(params.value),
    },
    {
      field: 'status_absensi',
      backendField: 'status',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 130,
      minWidth: 110,
      cellRenderer: (params) => <StatusBadge status={params.value} />,
    },
    {
      field: 'keterangan',
      backendField: 'keterangan',
      headerName: 'Keterangan',
      sortable: true,
      filter: true,
      width: 200,
      minWidth: 150,
      cellRenderer: (params) => params.value || '-',
    },
    {
      headerName: 'Aksi',
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      suppressSizeToFit: true,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const row = params.data
        if (!row) return null

        return (
          <div className="flex h-full items-center justify-center">
            <ActionsMenu
              onDetail={() => handleDetail(row)}
              onEdit={() => handleEdit(row)}
              onDelete={() => handleDelete(row)}
              detailPermission="absensi-siswa.view"
              editPermission="absensi-siswa.edit"
              deletePermission="absensi-siswa.delete"
            />
          </div>
        )
      },
    },
  ], [handleDelete, handleDetail, handleEdit])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Absensi Siswa</h1>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="w-full sm:w-64">
            <SearchableSelect
              name="siswa_id"
              value={selectedSiswaId}
              onChange={handleSiswaChange}
              options={selectedSiswaOption ? [selectedSiswaOption] : []}
              loadOptions={searchSiswaOptions}
              placeholder="Cari Siswa..."
              searchPlaceholder="Cari berdasarkan nama/NIS..."
              noOptionsText="Siswa tidak ditemukan"
            />
          </div>
          <Button
            onClick={() => setShowFilter(!showFilter)}
            variant={showFilter ? 'primary' : 'secondary'}
            title="Filter Tanggal"
          >
            <Calendar size={18} />
          </Button>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <Button variant="secondary" onClick={() => navigate('/absensi-siswa/rekap-bulanan')} title="Rekap Bulanan">
            <BarChart2 size={18} className="mr-2" />
            Rekap Bulanan
          </Button>
          <PermissionGuard permission="absensi-siswa.create">
            <Button onClick={handleAdd}>
              <Plus size={18} className="mr-2" />
              Tambah Absensi
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {selectedSiswaId && summaryData && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <div className="text-center">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-400">Hadir</h3>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">{summaryData.hadir || 0}</p>
            </div>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <div className="text-center">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Izin</h3>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{summaryData.izin || 0}</p>
            </div>
          </Card>
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
            <div className="text-center">
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-400">Sakit</h3>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">{summaryData.sakit || 0}</p>
            </div>
          </Card>
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <div className="text-center">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Alpha</h3>
              <p className="text-2xl font-bold text-red-900 dark:text-red-300">{summaryData.alpha || 0}</p>
            </div>
          </Card>
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="text-center">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400">Total</h3>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{summaryData.total || 0}</p>
            </div>
          </Card>
        </div>
      )}

      {showFilter && (
        <Card className="bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-full sm:w-auto">
              <Input
                label="Tanggal Mulai"
                type="date"
                name="tanggal_mulai"
                value={filters.tanggal_mulai}
                onChange={handleFilterChange}
                className="bg-white dark:bg-gray-800"
              />
            </div>
            <div className="w-full sm:w-auto">
              <Input
                label="Tanggal Akhir"
                type="date"
                name="tanggal_akhir"
                value={filters.tanggal_akhir}
                onChange={handleFilterChange}
                className="bg-white dark:bg-gray-800"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={applyFilters}>Terapkan</Button>
              <Button variant="secondary" onClick={clearFilters}>Reset</Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint={endpoint}
          requestMode="ag-grid"
          staticParams={staticParams}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          cacheBlockSize={20}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          height={600}
        />
      </Card>
    </div>
  )
}

const AbsensiSiswaList = () => {
  const { user } = useAuthStore()
  const isSiswa = user?.role === 'siswa'

  if (isSiswa) {
    return <StudentAbsensiView />
  }

  return <AdminAbsensiSiswaList />
}

export default AbsensiSiswaList
