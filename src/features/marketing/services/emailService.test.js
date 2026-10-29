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
    const message = { from: 'priyambodo@akademihub.id', from_name: 'Priyambodo', email: 'recipient@example.com', subject: 'Hello', content: '<p>Hello</p>' }
    await emailService.sendCustom(message)
    expect(apiService.post).toHaveBeenLastCalledWith('/email/send', message, { headers: {} })

    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    await emailService.sendCustom({ ...message, attachments: [file] })
    const [, payload] = apiService.post.mock.calls.at(-1)
    expect(payload.get('from')).toBe(message.from)
    expect(payload.get('from_name')).toBe(message.from_name)
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

  it('handles outbox methods correctly', async () => {
    apiService.get.mockResolvedValue({ data: { data: [{ id: 1, subject: 'Sent test' }] } })
    const listRes = await emailService.getOutbox({ search: 'test' })
    expect(listRes.payload).toEqual([{ id: 1, subject: 'Sent test' }])
    expect(apiService.get).toHaveBeenCalledWith('/email/outbox', { params: { search: 'test' } })

    apiService.get.mockResolvedValue({ data: { data: { id: 1, subject: 'Detail' } } })
    const showRes = await emailService.showOutbox(1)
    expect(showRes.payload).toEqual({ id: 1, subject: 'Detail' })
    expect(apiService.get).toHaveBeenCalledWith('/email/outbox/1')

    apiService.post.mockResolvedValue({ data: { data: { synced_count: 2 } } })
    const syncRes = await emailService.syncOutbox()
    expect(syncRes.payload).toEqual({ synced_count: 2 })
    expect(apiService.post).toHaveBeenCalledWith('/email/outbox/sync')

    apiService.delete.mockResolvedValue({ data: { data: null } })
    await emailService.deleteOutbox(1)
    expect(apiService.delete).toHaveBeenCalledWith('/email/outbox/1')
  })
})
