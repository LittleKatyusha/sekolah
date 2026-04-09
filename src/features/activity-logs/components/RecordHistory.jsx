import { useState, useEffect, useCallback, useRef } from 'react'
import { History, ChevronLeft, ChevronRight, User, Clock } from 'lucide-react'
import { activityLogsService } from '../services/activityLogsService'
import ActionBadge from './ActionBadge'

const formatDateTime = (val) => {
  if (!val) return '-'
  return new Date(val).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Reusable component that shows audit trail history for any record.
 * @param {string} table - DB table name (e.g. 'mst_siswa')
 * @param {number|string} recordId - The ID of the record
 */
const RecordHistory = ({ table, recordId }) => {
  const [logs, setLogs] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const isMountedRef = useRef(true)
  const PER_PAGE = 10

  const fetchHistory = useCallback(async (currentPage) => {
    if (!table || !recordId) return
    setLoading(true)
    const { data } = await activityLogsService.getByRecord(table, recordId, {
      per_page: PER_PAGE,
      page: currentPage,
    })
    if (!isMountedRef.current) return
    if (data) {
      setLogs(data.data ?? [])
      setMeta(data.meta ?? null)
    }
    setLoading(false)
  }, [table, recordId])

  useEffect(() => {
    isMountedRef.current = true
    fetchHistory(page)
    return () => { isMountedRef.current = false }
  }, [fetchHistory, page])

  const handlePrev = () => setPage(p => Math.max(1, p - 1))
  const handleNext = () => setPage(p => p + 1)

  const lastPage = meta ? Math.ceil(meta.total / PER_PAGE) : 1

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <History size={18} className="text-gray-500" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {meta ? `${meta.total} entri perubahan` : 'Memuat...'}
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <History size={40} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Belum ada riwayat perubahan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-600 mt-0.5">
                <User size={14} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <ActionBadge action={log.action} size="sm" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {log.user?.name || log.user?.email || 'System'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{log.description}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 dark:text-gray-500">
                  <Clock size={11} />
                  <span>{formatDateTime(log.created_at)}</span>
                  {log.ip_address && (
                    <span className="ml-2 opacity-70">· {log.ip_address}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.total > PER_PAGE && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Halaman {page} dari {lastPage}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={page === 1}
              className="p-1.5 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              disabled={page >= lastPage}
              className="p-1.5 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecordHistory
