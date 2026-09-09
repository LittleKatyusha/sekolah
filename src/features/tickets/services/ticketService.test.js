import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ticketService } from './ticketService'
import { apiService } from '../../../utils/api'

vi.mock('../../../utils/api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('ticketService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends JSON when no file is attached', async () => {
    apiService.post.mockResolvedValue({ data: { success: true } })
    const payload = { judul: 'Tes', deskripsi: 'Desc', kategori: 'umum' }

    await ticketService.create(payload)

    expect(apiService.post).toHaveBeenCalledWith('/support/tickets/', payload)
  })

  it('sends FormData when file is attached', async () => {
    apiService.post.mockResolvedValue({ data: { success: true } })
    const testFile = new File(['content'], 'screenshot.png', { type: 'image/png' })
    const payload = { judul: 'Tes', deskripsi: 'Desc', file: testFile }

    await ticketService.create(payload)

    expect(apiService.post).toHaveBeenCalledTimes(1)
    const [url, sentBody, config] = apiService.post.mock.calls[0]
    expect(url).toBe('/support/tickets/')
    expect(sentBody).toBeInstanceOf(FormData)
    expect(sentBody.get('judul')).toBe('Tes')
    expect(sentBody.get('deskripsi')).toBe('Desc')
    expect(sentBody.get('file')).toBe(testFile)
    expect(config.headers['Content-Type']).toBe('multipart/form-data')
  })
})
