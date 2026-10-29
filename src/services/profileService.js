import { apiService } from '../utils/api'

export const profileService = {
  getProfile: async () => {
    const response = await apiService.get('/profile')
    return response.data?.data
  },

  updateProfile: async (payload) => {
    const response = await apiService.put('/profile', payload)
    return response.data?.data
  },

  uploadAvatar: async (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await apiService.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data?.data
  },

  changePassword: async (payload) => {
    const response = await apiService.put('/profile/password', payload)
    return response.data
  },

  getActivityLogs: async (params = {}) => {
    const response = await apiService.get('/profile/activity-logs', { params })
    return response.data?.data
  },
}

export default profileService
