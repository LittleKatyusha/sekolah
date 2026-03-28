import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BellRing, CheckCircle2, Eye, Filter, RefreshCw, Search, ShieldAlert, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { siswaService } from '../../siswa/services/siswaService'
import { ewsService } from '../services/ewsService'
import { showConfirm, showError, showSuccess } from '../../../utils/sweetalert'
import usePermission from '../../../hooks/usePermission'

const CATEGORY_OPTIONS = [
  { value: '', label: 'Semua kategori' },
  { value: 'absensi', label: 'Absensi' },
  { value: 'nilai', label: 'Nilai' },
  { value: 'perilaku', label: 'Perilaku' },
]

const LEVEL_OPTIONS = [
  { value: '', label: 'Semua level' },
  { value: '1', label: 'Level 1' },
  { value: '2', label: 'Level 2' },
  { value: '3', label: 'Level 3' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Semua status' },
  { value: '0', label: 'Belum ditangani' },
  { value: '1', label: 'Sudah ditangani' },
]

const CATEGORY_META = {
  absensi: {
    label: 'Absensi',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
  nilai: {
    label: 'Nilai',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  perilaku: {
    label: 'Perilaku',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  },
}

const LEVEL_META = {
  1: { label: 'Rendah', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400' },
  2: { label: 'Sedang', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  3: { label: 'Tinggi', badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const formatDateTime = (value) => {
  if (!value) return '-'

  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getCategoryMeta = (kategori) => {
  return CATEGORY_META[kategori] || {
    label: kategori || '-',
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  }
}

const getLevelMeta = (level) => {
  return LEVEL_META[level] || {
    label: `Level ${level || '-'}`,
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  }
}

const getSiswaLabel = (alert) => {
  const siswa = alert.siswa
  if (siswa?.nama) {
    return siswa.nis ? `${siswa.nama} (${siswa.nis})` : siswa.nama
  }

  return alert.mst_siswa_id ? `Siswa ID ${alert.mst_siswa_id}` : '-'
}

const StatsCard = ({ title, value, subtitle, icon: Icon, iconClassName }) => (
  <Card className="p-0">
    <div className="p-6 flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconClassName}`}>
        <Icon size={22} />
      </div>
    </div>
  </Card>
)

const EmptyState = ({ hasFilters }) => (
  <Card>
    <div className="py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 mx-auto flex items-center justify-center mb-4">
        <BellRing size={24} className="text-gray-500 dark:text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Belum ada alert EWS</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
        {hasFilters
          ? 'Tidak ada alert yang cocok dengan filter saat ini. Ubah filter atau refresh data untuk mencoba lagi.'
          : 'Belum ada alert yang tercatat. Gunakan trigger manual untuk memeriksa siswa tertentu dari halaman ini.'}
      </p>
    </div>
  </Card>
)

const EwsList = () => {
  const { can } = usePermission()
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [siswaOptions, setSiswaOptions] = useState([])
  const [filters, setFilters] = useState({
    mst_siswa_id: '',
    kategori: '',
    level: '',
    is_resolved: '',
  })

  const fetchAlerts = useCallback(async (activeFilters = filters) => {
    setLoading(true)

    const params = {}
    if (activeFilters.mst_siswa_id) params.mst_siswa_id = activeFilters.mst_siswa_id
    if (activeFilters.kategori) params.kategori = activeFilters.kategori
    if (activeFilters.level) params.level = activeFilters.level
    if (activeFilters.is_resolved !== '') params.is_resolved = activeFilters.is_resolved

    const { data, error } = await ewsService.getAll(params)

    if (error) {
      showError(error.message || 'Gagal mengambil data EWS')
      setAlerts([])
      setLoading(false)
      return
    }

    const nextAlerts = Array.isArray(data?.data) ? data.data : []
    setAlerts(nextAlerts)
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchAlerts(filters)
  }, [fetchAlerts, filters])

  const loadSiswaOptions = useCallback(async (keyword) => {
    const { data, error } = await siswaService.getAll({
      search: keyword,
      per_page: 20,
    })

    if (error) return []

    const rows = Array.isArray(data?.data) ? data.data : []
    const options = rows.map((siswa) => ({
      value: String(siswa.id),
      label: siswa.nis ? `${siswa.nama} (${siswa.nis})` : siswa.nama,
    }))

    setSiswaOptions((prev) => {
      const seen = new Set(prev.map((option) => String(option.value)))
      const merged = [...prev]

      options.forEach((option) => {
        if (seen.has(String(option.value))) return
        seen.add(String(option.value))
        merged.push(option)
      })

      return merged
    })

    return options
  }, [])

  const handleFilterChange = useCallback((event) => {
    const { name, value } = event.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const handleRefresh = useCallback(() => {
    fetchAlerts(filters)
  }, [fetchAlerts, filters])

  const handleResolve = useCallback(async (alert) => {
    if (alert.is_resolved) return

    const result = await showConfirm(
      `Alert untuk ${getSiswaLabel(alert)} akan ditandai selesai.`,
      'Selesaikan alert?'
    )

    if (!result.isConfirmed) return

    setSubmitting(true)
    const { error } = await ewsService.resolve(alert.id)
    setSubmitting(false)

    if (error) {
      showError(error.message || 'Gagal menyelesaikan alert EWS')
      return
    }

    showSuccess('Alert EWS berhasil ditandai selesai')
    fetchAlerts(filters)
  }, [fetchAlerts, filters])

  const handleTrigger = useCallback(async (siswaId, label = 'siswa terpilih') => {
    if (!siswaId) {
      showError('Pilih siswa terlebih dahulu untuk menjalankan trigger EWS')
      return
    }

    const result = await showConfirm(
      `Semua rule EWS akan dijalankan ulang untuk ${label}.`,
      'Jalankan trigger EWS?'
    )

    if (!result.isConfirmed) return

    setSubmitting(true)
    const { error } = await ewsService.trigger(siswaId)
    setSubmitting(false)

    if (error) {
      showError(error.message || 'Gagal menjalankan trigger EWS')
      return
    }

    showSuccess('Trigger EWS berhasil dijalankan')
    fetchAlerts(filters)
  }, [fetchAlerts, filters])

  const handleTriggerSelected = useCallback(() => {
    const selectedOption = siswaOptions.find((option) => String(option.value) === String(filters.mst_siswa_id))
    handleTrigger(filters.mst_siswa_id, selectedOption?.label || 'siswa terpilih')
  }, [filters.mst_siswa_id, handleTrigger, siswaOptions])

  const filteredAlerts = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase()
    const sortedAlerts = [...alerts].sort((left, right) => {
      const leftDate = left.created_at ? new Date(left.created_at).getTime() : 0
      const rightDate = right.created_at ? new Date(right.created_at).getTime() : 0
      return rightDate - leftDate
    })

    if (!normalizedSearch) return sortedAlerts

    return sortedAlerts.filter((alert) => {
      const candidate = [
        alert.id,
        alert.kategori,
        alert.level,
        alert.pesan,
        alert.mst_siswa_id,
        alert.siswa?.nama,
        alert.siswa?.nis,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return candidate.includes(normalizedSearch)
    })
  }, [alerts, searchText])

  const stats = useMemo(() => {
    const unresolvedCount = alerts.filter((alert) => !alert.is_resolved).length
    const resolvedCount = alerts.filter((alert) => alert.is_resolved).length
    const highLevelCount = alerts.filter((alert) => Number(alert.level) === 3 && !alert.is_resolved).length

    return {
      total: alerts.length,
      unresolved: unresolvedCount,
      resolved: resolvedCount,
      high: highLevelCount,
    }
  }, [alerts])

  const hasFilters = useMemo(() => {
    return Boolean(filters.mst_siswa_id || filters.kategori || filters.level || filters.is_resolved !== '' || searchText.trim())
  }, [filters, searchText])

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Early Warning System</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Pantau alert akademik dan non-akademik siswa, jalankan trigger manual, lalu tandai penanganannya.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="secondary" onClick={handleRefresh} disabled={loading || submitting}>
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
          <Button onClick={handleTriggerSelected} disabled={!filters.mst_siswa_id || submitting} loading={submitting}>
            <Zap size={18} className="mr-2" />
            Trigger Siswa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Alert"
          value={stats.total}
          subtitle="Seluruh alert dari hasil query backend"
          icon={BellRing}
          iconClassName="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatsCard
          title="Belum Ditangani"
          value={stats.unresolved}
          subtitle="Alert aktif yang masih butuh tindak lanjut"
          icon={AlertTriangle}
          iconClassName="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        />
        <StatsCard
          title="Level Tinggi"
          value={stats.high}
          subtitle="Alert level 3 yang belum resolved"
          icon={ShieldAlert}
          iconClassName="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        />
        <StatsCard
          title="Sudah Ditangani"
          value={stats.resolved}
          subtitle="Alert yang sudah diselesaikan"
          icon={CheckCircle2}
          iconClassName="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        />
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filter dan Trigger</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Siswa
            </label>
            <SearchableSelect
              name="mst_siswa_id"
              value={filters.mst_siswa_id}
              onChange={handleFilterChange}
              options={siswaOptions}
              loadOptions={loadSiswaOptions}
              minSearchLength={1}
              placeholder="Pilih atau cari siswa"
              searchPlaceholder="Cari nama atau NIS siswa"
              noOptionsText="Tidak ada siswa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kategori
            </label>
            <SearchableSelect
              name="kategori"
              value={filters.kategori}
              onChange={handleFilterChange}
              options={CATEGORY_OPTIONS}
              placeholder="Pilih kategori"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Level
            </label>
            <SearchableSelect
              name="level"
              value={filters.level}
              onChange={handleFilterChange}
              options={LEVEL_OPTIONS}
              placeholder="Pilih level"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <SearchableSelect
              name="is_resolved"
              value={filters.is_resolved}
              onChange={handleFilterChange}
              options={STATUS_OPTIONS}
              placeholder="Pilih status"
            />
          </div>
        </div>

        <div className="mt-4 max-w-xl relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Cari lokal berdasarkan pesan, kategori, siswa, atau ID"
            className="pl-10"
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <EmptyState hasFilters={hasFilters} />
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const categoryMeta = getCategoryMeta(alert.kategori)
            const levelMeta = getLevelMeta(Number(alert.level))

            return (
              <Card key={alert.id} className="p-0 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                    <div className="space-y-4 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          Alert #{alert.id}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${categoryMeta.badge}`}>
                          {categoryMeta.label}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${levelMeta.badge}`}>
                          {levelMeta.label}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${alert.is_resolved ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                          {alert.is_resolved ? 'Sudah ditangani' : 'Belum ditangani'}
                        </span>
                      </div>

                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white break-words">{alert.pesan || 'Alert tanpa pesan'}</h2>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          {getSiswaLabel(alert)}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                          <p className="text-gray-500 dark:text-gray-400">Siswa ID</p>
                          <p className="mt-1 font-medium text-gray-900 dark:text-white">{alert.mst_siswa_id || '-'}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                          <p className="text-gray-500 dark:text-gray-400">Dibuat</p>
                          <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatDateTime(alert.created_at)}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                          <p className="text-gray-500 dark:text-gray-400">Resolved At</p>
                          <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatDateTime(alert.resolved_at)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="w-full xl:w-auto flex flex-col sm:flex-row xl:flex-col gap-3 xl:min-w-[220px]">
                      <Button variant="secondary" onClick={() => navigate(`/ews/${alert.id}`)}>
                        <Eye size={18} className="mr-2" />
                        Detail
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleTrigger(alert.mst_siswa_id, getSiswaLabel(alert))}
                        disabled={submitting || !alert.mst_siswa_id}
                      >
                        <Zap size={18} className="mr-2" />
                        Trigger Ulang
                      </Button>
                      <Button
                        variant={alert.is_resolved ? 'success' : 'primary'}
                        onClick={() => handleResolve(alert)}
                        disabled={submitting || alert.is_resolved}
                      >
                        <CheckCircle2 size={18} className="mr-2" />
                        {alert.is_resolved ? 'Sudah Resolved' : 'Resolve'}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default EwsList