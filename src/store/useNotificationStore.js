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
    set((state) => {
      // Single-pass: update the notification and track whether it was unread,
      // avoiding a second find() traversal over the full array.
      let wasUnread = false
      const notifications = state.notifications.map(n => {
        if (n.id === id && !n.read) {
          wasUnread = true
          return { ...n, read: true }
        }
        return n
      })
      return {
        notifications,
        unreadCount: Math.max(0, state.unreadCount - (wasUnread ? 1 : 0)),
      }
    })
  },

  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount:   0,
    }))
  },

  clearAll: () => set({ notifications: [], unreadCount: 0 }),

  setWsStatus: (status) => set({ wsStatus: status }),

  // ─── API-persisted actions ───────────────────────────────────────────────

  /** Replace in-memory list with persisted data from API */
  loadFromApi: (items, unreadCount) => {
    const notifications = items.map(n => ({
      id:        n.id,
      type:      n.type     || 'info',
      urgency:   n.urgency  || 'low',
      title:     n.judul    || '',
      body:      n.pesan    || '',
      data:      n.data     || {},
      read:      !!n.is_read,
      read_at:   n.read_at  || null,
      createdAt: n.created_at,
    }))
    set({ notifications, unreadCount: unreadCount ?? 0 })
  },

  setUnreadCount: (count) => set({ unreadCount: count }),

  /** Mark a notification read by its numeric API id */
  markReadApi: (id) => {
    set((state) => {
      let wasUnread = false
      const notifications = state.notifications.map(n => {
        if (n.id === id && !n.read) {
          wasUnread = true
          return { ...n, read: true }
        }
        return n
      })
      return { notifications, unreadCount: Math.max(0, state.unreadCount - (wasUnread ? 1 : 0)) }
    })
  },

  markAllReadApi: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount:   0,
    }))
  },
}))

export default useNotificationStore
