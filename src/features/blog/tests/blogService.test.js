import { describe, it, expect, vi, beforeEach } from 'vitest'
import { blogService } from '../services/blogService'
import { apiService } from '../../../utils/api'

vi.mock('../../../utils/api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('blogService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls getPublicArticles with proper URL and params', async () => {
    apiService.get.mockResolvedValueOnce({ data: { success: true, data: [] }, error: null })
    const params = { sekolah: 'smada', page: 1, limit: 9 }
    await blogService.getPublicArticles(params)

    expect(apiService.get).toHaveBeenCalledWith('/public/blog', { params })
  })

  it('calls getPublicArticleBySlug with encoded slug and params', async () => {
    apiService.get.mockResolvedValueOnce({ data: { success: true, data: {} }, error: null })
    await blogService.getPublicArticleBySlug('juara-1-robotik', { sekolah: 'smada' })

    expect(apiService.get).toHaveBeenCalledWith('/public/blog/juara-1-robotik', {
      params: { sekolah: 'smada' },
    })
  })

  it('calls create with proper payload', async () => {
    const payload = { judul: 'Berita Baru', konten: '<p>Konten</p>', action: 'draft' }
    apiService.post.mockResolvedValueOnce({ data: { success: true }, error: null })
    await blogService.create(payload)

    expect(apiService.post).toHaveBeenCalledWith('/artikel', payload)
  })

  it('calls approve endpoint on /artikel/:id/approve', async () => {
    apiService.post.mockResolvedValueOnce({ data: { success: true }, error: null })
    await blogService.approve(12)

    expect(apiService.post).toHaveBeenCalledWith('/artikel/12/approve')
  })

  it('calls reject endpoint with rejection_note', async () => {
    apiService.post.mockResolvedValueOnce({ data: { success: true }, error: null })
    await blogService.reject(12, 'Perbaiki tanda baca.')

    expect(apiService.post).toHaveBeenCalledWith('/artikel/12/reject', {
      rejection_note: 'Perbaiki tanda baca.',
    })
  })
})
