import { describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const create = vi.fn(() => ({
  get,
  post,
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
}))

vi.mock('axios', () => ({ default: { create } }))

const { ppdbPublicService } = await import('./ppdbService')

describe('ppdbPublicService', () => {
  it('uses resolved API base with no authorization header', async () => {
    get.mockResolvedValue({ data: { data: [] } })
    await ppdbPublicService.getSekolahList()
    const publicClientConfig = create.mock.calls.find(([config]) => config.headers?.Accept === 'application/json' && !config.headers['Content-Type'])?.[0]
    expect(publicClientConfig).toEqual(expect.objectContaining({
      baseURL: expect.any(String),
      headers: { Accept: 'application/json' },
    }))
    expect(publicClientConfig.headers.Authorization).toBeUndefined()
    expect(get).toHaveBeenCalledWith('/ppdb/public/sekolah')
  })

  it('requires registration number and email for status lookup', async () => {
    post.mockResolvedValue({ data: { data: {} } })
    await ppdbPublicService.cekStatus('PPDB-2026-ABC123', 'calon@example.test')
    expect(post).toHaveBeenCalledWith('/ppdb/public/status', {
      no_pendaftaran: 'PPDB-2026-ABC123',
      email: 'calon@example.test',
    })
  })
})
