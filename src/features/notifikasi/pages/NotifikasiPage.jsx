import { useCallback, useEffect, useState } from 'react'
import { Bell, BellOff, CheckCheck, CheckCircle2 } from 'lucide-react'
import { notifikasiService } from '../services/notifikasiService'
import { showError, showSuccess } from '../../../utils/sweetalert'

const TYPE_LABEL = {
  ews_alert:       'EWS Alert',
  absensi:         'Absensi',
  nilai_anomali:   'Nilai',
  spp_tunggakan:   'SPP',
  ppdb_status:     'PPDB',
  risk_profile:    'Risiko',
}

const URGENCY_CLASS = {
  high:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low:    'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
}

const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function NotifikasiPage() {
  const [items, setItems]             = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('all') // 'all' | 'unread'

  const load = useCallback(async (isReadFilter) => {
    setLoading(true)
    try {
      const params = {}
      if (isReadFilter === 'unread') params.is_read = 0
      const res = await notifikasiService.getAll(params)
      setItems(res.data ?? [])
      setUnreadCount(res.meta?.unread_count ?? 0)
    } catch {
      showError('Gagal memuat notifikasi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(filter)
  }, [filter, load])

  const handleMarkRead = async (id) => {
    try {
      await notifikasiService.markRead(id)
      setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(c => Math.max(0, c - 1))
    } catch {
      showError('Gagal menandai notifikasi')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notifikasiService.markAllRead()
      setItems(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      showSuccess('Semua notifikasi ditandai dibaca')
    } catch {
      showError('Gagal menandai semua notifikasi')
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Notifikasi
        </h1>
        {unreadCount > 0 && (
          <span className="text-sm text-gray-500">
            <strong>{unreadCount}</strong> belum dibaca
          </span>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filter === 'unread'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}
          >
            Belum Dibaca
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-800
              hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <Bell className="w-10 h-10 mx-auto mb-2 animate-pulse" />
          <p>Memuat notifikasi…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BellOff className="w-10 h-10 mx-auto mb-2" />
          <p>Tidak ada notifikasi</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {items.map(item => (
            <li
              key={item.id}
              className={`py-4 px-3 rounded-lg transition-colors
                ${!item.is_read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {!item.is_read && (
                      <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                    )}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {item.judul}
                    </span>
                    {item.type && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${URGENCY_CLASS[item.urgency] ?? URGENCY_CLASS.low}`}>
                        {TYPE_LABEL[item.type] ?? item.type}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{item.pesan}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(item.created_at)}</p>
                </div>

                {!item.is_read && (
                  <button
                    onClick={() => handleMarkRead(item.id)}
                    className="flex-shrink-0 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800
                      hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
                    title="Tandai dibaca"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Tandai Dibaca
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
