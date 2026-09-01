import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../utils/api', () => ({ apiService: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))

const { emailService } = await import('./emailService')
const { apiService } = await import('../../../utils/api')

describe('emailService', () => {
  it('throws apiService error responses', async () => {
    apiService.post.mockResolvedValue({ data: null, error: { message: 'Forbidden', status: 403 } })
    await expect(emailService.sendOffer({})).rejects.toThrow('Forbidden')
  })
})
