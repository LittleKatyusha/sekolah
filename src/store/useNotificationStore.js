import { create } from 'zustand'

/**
 * Notification store – manages real-time notifications pushed over WebSocket
 * and exposes the current WebSocket connection status.
 *
 * Each notification object shape:
 *   {
 *     id:        string  (auto-generated)
 *     type:      string  e.g. "forum", "absensi", "nilai", "info"
 *     title:     string
 *     body:      string
 *     data:      object  (raw payload from server)
 *     read:      boolean
 *     createdAt: string  (ISO)
 *   }
 */
const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  wsStatus: 'disconnected',   // 'connecting' | 'connected' | 'disconnected' | 'error'

  // ─── Mutators ───────────────────────────────────────────────────────────────

  /** Called by the WebSocket handler when a notification frame arrives */
  addNotification: (notif) => {
    const entry = {
      id:        crypto.randomUUID(),
      type:      notif.type  || 'info',
      title:     notif.title || 'Notifikasi',
      body:      notif.body  || notif.message || '',
      data:      notif.data  || notif,
      read:      false,
      createdAt: notif.created_at || new Date().toISOString(),
    }
    set((state) => ({
      notifications: [entry, ...state.notifications].slice(0, 100), // keep last 100
      unreadCount:   state.unreadCount + 1,
    }))
  },

  markRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - (
        state.notifications.find(n => n.id === id && !n.read) ? 1 : 0
      )),
    }))
  },

  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount:   0,
    }))
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),

  setWsStatus: (status) => set({ wsStatus: status }),
}))

export default useNotificationStore
