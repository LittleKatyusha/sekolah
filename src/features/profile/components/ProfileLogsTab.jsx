import { useState, useEffect } from 'react'
import { RefreshCw, Loader2, History } from 'lucide-react'
import { profileService } from '../../../services/profileService'

export default function ProfileLogsTab() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await profileService.getActivityLogs({ limit: 30 })
      setLogs(Array.isArray(res) ? res : [])
    } catch (err) {
      console.error('Failed to load logs', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xs border border-gray-100 dark:border-gray-700 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Riwayat Aktivitas
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Catatan aktivitas penting akun Anda untuk keperluan keamanan dan audit.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="Segarkan Riwayat"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Memuat riwayat aktivitas...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">
          Belum ada catatan aktivitas untuk akun ini.
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {logs.map((item) => (
            <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase">
                    {item.event || item.log_name || 'log'}
                  </span>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {item.description}
                  </p>
                </div>
                {item.ip_address && (
                  <p className="text-[11px] text-gray-400">
                    IP: {item.ip_address}
                  </p>
                )}
              </div>
              <div className="text-right sm:shrink-0 text-xs text-gray-400">
                {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
