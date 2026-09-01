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

vi.mock('../../../utils/api', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, apiService: { post: vi.fn() } }
})

const { pendaftarService, ppdbPublicService } = await import('./ppdbService')
const { apiService } = await import('../../../utils/api')

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

  it('enrolls an accepted applicant through the active backend action', async () => {
    await pendaftarService.enroll(42)
    expect(apiService.post).toHaveBeenCalledWith('/ppdb/pendaftaran/42/enroll')
  })
})
