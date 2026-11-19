import { create } from 'zustand'

/**
 * Notification store – manages real-time notifications pushed over WebSocket
 * and exposes the current WebSocket connection status.
 *
 * Each notification object shape:
 *   {
 *     id:        number|string  (database ID when persisted)
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
      id:        notif.id ?? crypto.randomUUID(),
      type:      notif.type  || 'info',
      urgency:   notif.urgency || 'low',
      title:     notif.judul || notif.title || 'Notifikasi',
      body:      notif.pesan || notif.body || notif.message || '',
      data:      notif.data  || notif,
      read:      Boolean(notif.is_read ?? notif.read ?? false),
      read_at:   notif.read_at || null,
      createdAt: notif.created_at || new Date().toISOString(),
    }
    set((state) => {
      const existingIndex = state.notifications.findIndex(n => String(n.id) === String(entry.id))
      if (existingIndex >= 0) {
        const notifications = [...state.notifications]
        notifications[existingIndex] = { ...notifications[existingIndex], ...entry }
        return { notifications }
      }

      return {
        notifications: [entry, ...state.notifications].slice(0, 100), // keep last 100
        unreadCount: state.unreadCount + (entry.read ? 0 : 1),
      }
    })
  },

  markRead: (id) => {
    set((state) => {
      // Single-pass: update the notification and track whether it was unread,
      // avoiding a second find() traversal over the full array.
      let wasUnread = false
      const notifications = state.notifications.map(n => {
        if (String(n.id) === String(id) && !n.read) {
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
    const apiNotifications = items.map(n => ({
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
    set((state) => {
      const apiIds = new Set(apiNotifications.map(n => String(n.id)))
      const realtimeOnly = state.notifications.filter(n => !apiIds.has(String(n.id)))
      const extraUnread = realtimeOnly.filter(n => !n.read).length

      return {
        notifications: [...realtimeOnly, ...apiNotifications]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 100),
        unreadCount: (unreadCount ?? 0) + extraUnread,
      }
    })
  },

  setUnreadCount: (count) => set({ unreadCount: count }),

  /** Mark a notification read by its numeric API id */
  markReadApi: (id) => {
    set((state) => {
      let wasUnread = false
      const notifications = state.notifications.map(n => {
        if (String(n.id) === String(id) && !n.read) {
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
