import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notifikasiService } from './notifikasiService'

vi.mock('../../../utils/api', () => ({
  apiService: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}))

import { apiService } from '../../../utils/api'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('notifikasiService', () => {
  describe('getAll', () => {
    it('calls GET /notifikasi with params', async () => {
      // apiService.get returns { data: <Laravel response body>, error }
      apiService.get.mockResolvedValue({ data: { success: true, data: [], meta: { unread_count: 0 } }, error: null })
      await notifikasiService.getAll({ is_read: 0, page: 2 })
      expect(apiService.get).toHaveBeenCalledWith('/notifikasi/', { params: { is_read: 0, page: 2 } })
    })

    it('calls GET /notifikasi with no params by default and returns unwrapped envelope', async () => {
      const envelope = { success: true, data: [{ id: 1 }], meta: { unread_count: 1 } }
      apiService.get.mockResolvedValue({ data: envelope, error: null })
      const result = await notifikasiService.getAll()
      expect(apiService.get).toHaveBeenCalledWith('/notifikasi/', { params: {} })
      expect(result).toEqual(envelope)
    })
  })

  describe('getUnreadCount', () => {
    it('calls GET /notifikasi/unread-count and returns unwrapped envelope', async () => {
      const envelope = { success: true, data: { unread_count: 5 } }
      apiService.get.mockResolvedValue({ data: envelope, error: null })
      const result = await notifikasiService.getUnreadCount()
      expect(apiService.get).toHaveBeenCalledWith('/notifikasi/unread-count')
      expect(result).toEqual(envelope)
    })
  })

  describe('markRead', () => {
    it('calls PUT /notifikasi/{id}/read and returns unwrapped envelope', async () => {
      const envelope = { success: true, data: { id: 42, is_read: true } }
      apiService.put.mockResolvedValue({ data: envelope, error: null })
      const result = await notifikasiService.markRead(42)
      expect(apiService.put).toHaveBeenCalledWith('/notifikasi/42/read', {})
      expect(result).toEqual(envelope)
    })
  })

  describe('markAllRead', () => {
    it('calls POST /notifikasi/read-all and returns unwrapped envelope', async () => {
      const envelope = { success: true, data: { updated: 3 } }
      apiService.post.mockResolvedValue({ data: envelope, error: null })
      const result = await notifikasiService.markAllRead()
      expect(apiService.post).toHaveBeenCalledWith('/notifikasi/read-all', {})
      expect(result).toEqual(envelope)
    })
  })
})
