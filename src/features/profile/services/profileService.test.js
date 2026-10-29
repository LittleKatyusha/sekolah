import { describe, it, expect, vi, beforeEach } from 'vitest'
import { profileService } from './profileService'
import { apiService } from '../../../utils/api'

vi.mock('../../../utils/api', () => ({
  apiService: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}))

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches profile data', async () => {
    apiService.get.mockResolvedValue({ data: { success: true, data: { user: { id: 1 } } } })
    const res = await profileService.getProfile()
    expect(apiService.get).toHaveBeenCalledWith('/profile')
    expect(res.user.id).toBe(1)
  })

  it('updates profile data', async () => {
    apiService.put.mockResolvedValue({ data: { success: true, data: { user: { name: 'New Name' } } } })
    const res = await profileService.updateProfile({ name: 'New Name' })
    expect(apiService.put).toHaveBeenCalledWith('/profile', { name: 'New Name' })
    expect(res.user.name).toBe('New Name')
  })

  it('uploads avatar as multipart FormData', async () => {
    apiService.post.mockResolvedValue({ data: { success: true, data: { avatar: 'http://img.url' } } })
    const file = new File(['img'], 'test.png', { type: 'image/png' })
    const res = await profileService.uploadAvatar(file)

    expect(apiService.post).toHaveBeenCalledTimes(1)
    const [url, formData, config] = apiService.post.mock.calls[0]
    expect(url).toBe('/profile/avatar')
    expect(formData).toBeInstanceOf(FormData)
    expect(formData.get('avatar')).toBe(file)
    expect(config.headers['Content-Type']).toBe('multipart/form-data')
    expect(res.avatar).toBe('http://img.url')
  })

  it('changes password', async () => {
    apiService.put.mockResolvedValue({ data: { success: true } })
    const payload = { current_password: 'old', password: 'new', password_confirmation: 'new' }
    await profileService.changePassword(payload)
    expect(apiService.put).toHaveBeenCalledWith('/profile/password', payload)
  })

  it('fetches activity logs with params', async () => {
    apiService.get.mockResolvedValue({ data: { success: true, data: [{ id: 10 }] } })
    const res = await profileService.getActivityLogs({ limit: 15 })
    expect(apiService.get).toHaveBeenCalledWith('/profile/activity-logs', { params: { limit: 15 } })
    expect(res).toHaveLength(1)
  })
})
