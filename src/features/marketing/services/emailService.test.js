import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../utils/api', () => ({ apiService: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))

const { emailService } = await import('./emailService')
const { apiService } = await import('../../../utils/api')

describe('emailService', () => {
  it('loads allowed senders from the API', async () => {
    const senders = [{ email: 'priyambodo@akademihub.id', name: 'Priyambodo' }]
    apiService.get.mockResolvedValue({ data: { data: senders } })
    await expect(emailService.getSenders()).resolves.toEqual(senders)
    expect(apiService.get).toHaveBeenCalledWith('/email/senders')
  })

  it('preserves the selected sender for JSON and attachment uploads', async () => {
    apiService.post.mockResolvedValue({ data: { data: { success: true } } })
    const message = { from: 'priyambodo@akademihub.id', email: 'recipient@example.com', subject: 'Hello', content: '<p>Hello</p>' }
    await emailService.sendCustom(message)
    expect(apiService.post).toHaveBeenLastCalledWith('/email/send', message, { headers: {} })

    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    await emailService.sendCustom({ ...message, attachments: [file] })
    const [, payload] = apiService.post.mock.calls.at(-1)
    expect(payload.get('from')).toBe(message.from)
    expect(payload.get('email')).toBe(message.email)
    expect(payload.get('attachments[]').name).toBe('hello.txt')
  })

  it('throws apiService error responses', async () => {
    apiService.post.mockResolvedValue({ data: null, error: { message: 'Forbidden', status: 403 } })
    await expect(emailService.sendOffer({})).rejects.toThrow('Forbidden')
  })

  it('calls sync inbox endpoint', async () => {
    apiService.post.mockResolvedValue({ data: { data: { synced_count: 5 } } })
    const res = await emailService.syncInbox()
    expect(res.payload).toEqual({ synced_count: 5 })
    expect(apiService.post).toHaveBeenCalledWith('/email/inbox/sync')
  })
})
