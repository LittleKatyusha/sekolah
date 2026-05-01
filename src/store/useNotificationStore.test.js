import { describe, it, expect, beforeEach } from 'vitest'
import useNotificationStore from './useNotificationStore'

// Reset store before each test
beforeEach(() => {
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
    wsStatus: 'disconnected',
  })
})

describe('useNotificationStore — existing actions', () => {
  it('addNotification adds to front and increments unreadCount', () => {
    const store = useNotificationStore.getState()
    store.addNotification({ type: 'info', title: 'Test', body: 'hello' })
    const state = useNotificationStore.getState()
    expect(state.notifications).toHaveLength(1)
    expect(state.notifications[0].title).toBe('Test')
    expect(state.unreadCount).toBe(1)
  })

  it('markAllRead sets all read and unreadCount to 0', () => {
    useNotificationStore.setState({
      notifications: [
        { id: '1', read: false },
        { id: '2', read: false },
      ],
      unreadCount: 2,
    })
    useNotificationStore.getState().markAllRead()
    const state = useNotificationStore.getState()
    expect(state.unreadCount).toBe(0)
    expect(state.notifications.every(n => n.read)).toBe(true)
  })
})

describe('useNotificationStore — API actions', () => {
  it('loadFromApi replaces notifications and sets unreadCount', () => {
    const items = [
      { id: 1, judul: 'A', pesan: 'msg', is_read: false, type: 'info', urgency: 'low', data: {}, read_at: null, created_at: '2024-01-01T00:00:00Z' },
      { id: 2, judul: 'B', pesan: 'msg2', is_read: true, type: 'ews_alert', urgency: 'high', data: {}, read_at: '2024-01-01T01:00:00Z', created_at: '2024-01-01T00:00:00Z' },
    ]
    useNotificationStore.getState().loadFromApi(items, 1)
    const state = useNotificationStore.getState()
    expect(state.notifications).toHaveLength(2)
    expect(state.notifications[0].id).toBe(1)
    expect(state.notifications[0].title).toBe('A')
    expect(state.notifications[0].read).toBe(false)
    expect(state.notifications[1].read).toBe(true)
    expect(state.unreadCount).toBe(1)
  })

  it('setUnreadCount updates unreadCount', () => {
    useNotificationStore.getState().setUnreadCount(7)
    expect(useNotificationStore.getState().unreadCount).toBe(7)
  })

  it('markReadApi marks a notification as read by numeric id', () => {
    useNotificationStore.setState({
      notifications: [
        { id: 10, read: false },
        { id: 20, read: false },
      ],
      unreadCount: 2,
    })
    useNotificationStore.getState().markReadApi(10)
    const state = useNotificationStore.getState()
    expect(state.notifications.find(n => n.id === 10).read).toBe(true)
    expect(state.notifications.find(n => n.id === 20).read).toBe(false)
    expect(state.unreadCount).toBe(1)
  })

  it('markAllReadApi marks all notifications as read', () => {
    useNotificationStore.setState({
      notifications: [
        { id: 10, read: false },
        { id: 20, read: false },
      ],
      unreadCount: 2,
    })
    useNotificationStore.getState().markAllReadApi()
    const state = useNotificationStore.getState()
    expect(state.unreadCount).toBe(0)
    expect(state.notifications.every(n => n.read)).toBe(true)
  })
})
