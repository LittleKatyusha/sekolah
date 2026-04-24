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
      apiService.get.mockResolvedValue({ data: [], meta: { unread_count: 0 } })
      await notifikasiService.getAll({ is_read: 0, page: 2 })
      expect(apiService.get).toHaveBeenCalledWith('/notifikasi/', { params: { is_read: 0, page: 2 } })
    })

    it('calls GET /notifikasi with no params by default', async () => {
      apiService.get.mockResolvedValue({ data: [] })
      await notifikasiService.getAll()
      expect(apiService.get).toHaveBeenCalledWith('/notifikasi/', { params: {} })
    })
  })

  describe('getUnreadCount', () => {
    it('calls GET /notifikasi/unread-count', async () => {
      apiService.get.mockResolvedValue({ data: { unread_count: 5 } })
      const result = await notifikasiService.getUnreadCount()
      expect(apiService.get).toHaveBeenCalledWith('/notifikasi/unread-count')
      expect(result).toEqual({ data: { unread_count: 5 } })
    })
  })

  describe('markRead', () => {
    it('calls PUT /notifikasi/{id}/read', async () => {
      apiService.put.mockResolvedValue({ data: { id: 42, is_read: true } })
      const result = await notifikasiService.markRead(42)
      expect(apiService.put).toHaveBeenCalledWith('/notifikasi/42/read', {})
      expect(result).toEqual({ data: { id: 42, is_read: true } })
    })
  })

  describe('markAllRead', () => {
    it('calls POST /notifikasi/read-all', async () => {
      apiService.post.mockResolvedValue({ data: { updated: 3 } })
      const result = await notifikasiService.markAllRead()
      expect(apiService.post).toHaveBeenCalledWith('/notifikasi/read-all', {})
      expect(result).toEqual({ data: { updated: 3 } })
    })
  })
})
