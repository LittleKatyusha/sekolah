import { useState, useEffect, useCallback, useRef } from 'react'
import {
  RefreshCw,
  Loader2,
  Search,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  History,
  Layers,
} from 'lucide-react'
import { profileService } from '../../../services/profileService'
import ActionBadge from '../../activity-logs/components/ActionBadge'
import ProfileLogDetailModal from './ProfileLogDetailModal'

const formatDateTime = (val) => (!val ? '-' : new Date(val).toLocaleString('id-ID', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
}))

const formatModuleName = (logName, subjectType) => {
  if (logName && logName !== 'default') {
    return logName.charAt(0).toUpperCase() + logName.slice(1)
  }
  if (subjectType) {
    const parts = subjectType.split('\\')
    const last = parts[parts.length - 1]
    return last.replace(/^Mst|^Sys|^Trx/, '') || last
  }
  return 'Sistem'
}

export default function ProfileLogsTab() {
  const [logs, setLogs] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [selectedLog, setSelectedLog] = useState(null)
  const isMountedRef = useRef(true)

  const fetchLogs = useCallback(
    async (currentPage = page, currentPerPage = perPage, currentSearch = search, currentEvent = eventFilter) => {
      setLoading(true)
      try {
        const params = {
          page: currentPage,
          per_page: currentPerPage,
        }
        if (currentSearch.trim()) params.search = currentSearch.trim()
        if (currentEvent) params.event = currentEvent

        const res = await profileService.getActivityLogs(params)
        if (!isMountedRef.current) return

        const items = Array.isArray(res) ? res : res?.data || []
        const paginationMeta = res?.meta || null
        setLogs(items)
        setMeta(paginationMeta)
      } catch (err) {
        console.error('Failed to load activity logs', err)
      } finally {
        if (isMountedRef.current) {
          setLoading(false)
        }
      }
    },
    [page, perPage, search, eventFilter]
  )

  useEffect(() => {
    isMountedRef.current = true
    fetchLogs(page, perPage, search, eventFilter)
    return () => {
      isMountedRef.current = false
    }
  }, [fetchLogs, page, perPage, search, eventFilter])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const handleEventChange = (e) => {
    setEventFilter(e.target.value)
    setPage(1)
  }

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value))
    setPage(1)
  }

  const total = meta?.total ?? logs.length
  const lastPage = meta?.last_page ?? Math.max(1, Math.ceil(total / perPage))
  const fromRecord = total === 0 ? 0 : (page - 1) * perPage + 1
  const toRecord = total === 0 ? 0 : Math.min(page * perPage, total)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xs border border-gray-100 dark:border-gray-700 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Riwayat Aktivitas</h2>
            <span className="px-2 py-0.5 text-xs rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 font-medium">
              {total} Total
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Catatan audit terperinci aktivitas akun Anda beserta alamat IP dan perangkat.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(page, perPage, search, eventFilter)}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Segarkan Riwayat"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari deskripsi, modul, atau alamat IP..."
            className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-800 transition"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={14} />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={eventFilter}
            onChange={handleEventChange}
            aria-label="Filter jenis aksi"
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Semua Aksi</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>

          <select
            value={perPage}
            onChange={handlePerPageChange}
            aria-label="Jumlah baris per halaman"
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          >
            <option value="10">10 baris</option>
            <option value="25">25 baris</option>
            <option value="50">50 baris</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 dark:bg-gray-900/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 min-w-[150px]">Waktu</th>
                <th className="px-4 py-3 min-w-[100px]">Aksi</th>
                <th className="px-4 py-3 min-w-[120px]">Modul</th>
                <th className="px-4 py-3 min-w-[240px]">Deskripsi Aktivitas</th>
                <th className="px-4 py-3 min-w-[130px]">IP Address</th>
                <th className="px-4 py-3 text-center w-[80px]">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-750">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 size={24} className="animate-spin text-primary-500" />
                      <span className="text-sm">Memuat data riwayat...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <History size={36} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">Tidak ada catatan aktivitas</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {search || eventFilter
                        ? 'Coba sesuaikan kata kunci pencarian atau filter yang dipilih.'
                        : 'Belum ada catatan aktivitas untuk akun ini.'}
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-gray-750/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {formatDateTime(item.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ActionBadge action={item.event || item.log_name} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        <Layers size={11} className="opacity-60" />
                        {formatModuleName(item.log_name, item.subject_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                      <p className="font-medium line-clamp-2">{item.description || '-'}</p>
                      {item.subject_id && (
                        <span className="text-[11px] text-gray-400">ID Target: {item.subject_id}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {item.ip_address || '-'}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(item)}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                        title="Lihat Detail Aktivitas"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700 gap-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Menampilkan <span className="font-medium text-gray-800 dark:text-gray-200">{fromRecord}</span> -{' '}
            <span className="font-medium text-gray-800 dark:text-gray-200">{toRecord}</span> dari{' '}
            <span className="font-medium text-gray-800 dark:text-gray-200">{total}</span> aktivitas
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman Pertama"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
              Halaman {page} dari {lastPage}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage || loading}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman Selanjutnya"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => setPage(lastPage)}
              disabled={page >= lastPage || loading}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Halaman Terakhir"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <ProfileLogDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
        formatModuleName={formatModuleName}
      />
    </div>
  )
}
