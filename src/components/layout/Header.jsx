import { Menu, Moon, Sun, Bell, Wifi, WifiOff, CheckCheck, Trash2 } from 'lucide-react'
import useThemeStore from '../../store/useThemeStore'
import { usePageTitle } from '../../hooks/usePageTitle'
import { memo, useState, useRef, useEffect, useCallback } from 'react'
import useNotificationStore from '../../store/useNotificationStore'
import useAuthStore from '../../store/useAuthStore'
import { getTheme } from '../../constants/roleThemes'

// ── Notification type colour map ──────────────────────────────────────────────
const TYPE_DOT = {
  forum:   'bg-blue-500',
  absensi: 'bg-yellow-500',
  nilai:   'bg-green-500',
  info:    'bg-gray-400',
}

// ── WS status indicator ───────────────────────────────────────────────────────
const WsIndicator = ({ status }) => {
  const map = {
    connected:    { color: 'text-green-500',  icon: Wifi,    tip: 'Real-time: terhubung' },
    connecting:   { color: 'text-yellow-500', icon: Wifi,    tip: 'Real-time: menghubungkan…' },
    disconnected: { color: 'text-gray-400',   icon: WifiOff, tip: 'Real-time: terputus' },
    error:        { color: 'text-red-500',    icon: WifiOff, tip: 'Real-time: error' },
  }
  const cfg = map[status] || map.disconnected
  const Icon = cfg.icon
  return (
    <span title={cfg.tip} className={`${cfg.color} flex items-center`}>
      <Icon size={14} />
    </span>
  )
}

// ── Notification dropdown ─────────────────────────────────────────────────────
const NotificationPanel = ({ onClose }) => {
  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotificationStore()

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
          Notifikasi {unreadCount > 0 && <span className="ml-1 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">{unreadCount}</span>}
        </span>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} title="Tandai semua dibaca" className="text-gray-400 hover:text-blue-500 transition-colors">
              <CheckCheck size={15} />
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} title="Hapus semua" className="text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <ul className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
        {notifications.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-gray-400">Tidak ada notifikasi</li>
        )}
        {notifications.map(n => (
          <li
            key={n.id}
            onClick={() => markRead(n.id)}
            className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${n.read ? 'opacity-60' : ''}`}
          >
            {/* Colour dot */}
            <span className={`mt-1 shrink-0 w-2 h-2 rounded-full ${TYPE_DOT[n.type] || TYPE_DOT.info}`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{n.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{n.body}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {new Date(n.createdAt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
              </p>
            </div>
            {!n.read && <span className="ml-auto shrink-0 w-2 h-2 mt-1 rounded-full bg-blue-500" />}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
const Header = ({ onMenuClick }) => {
  const { isDarkMode, toggleTheme } = useThemeStore()
  const user         = useAuthStore(s => s.user)
  const theme        = getTheme(user?.role)
  const pageTitle    = usePageTitle()
  const unreadCount  = useNotificationStore(s => s.unreadCount)
  const wsStatus     = useNotificationStore(s => s.wsStatus)

  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef    = useRef(null)

  // Close panel when clicking outside
  const handleOutsideClick = useCallback((e) => {
    if (panelRef.current && !panelRef.current.contains(e.target)) {
      setPanelOpen(false)
    }
  }, [])

  useEffect(() => {
    if (panelOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [panelOpen, handleOutsideClick])

  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Role-accent strip */}
      <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${theme.vars['--sb-avatar']}, ${theme.vars['--sb-accent']})` }} />
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {pageTitle}
          </h2>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* WS status */}
          <WsIndicator status={wsStatus} />

          {/* Notifications */}
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setPanelOpen(v => !v)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5 leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {panelOpen && <NotificationPanel onClose={() => setPanelOpen(false)} />}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}

export default memo(Header)
