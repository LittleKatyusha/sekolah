import { apiService } from '../../../utils/api'

const BASE_URL = '/notifikasi'

export const notifikasiService = {
  getAll: async (params = {}) => {
    return await apiService.get(`${BASE_URL}/`, { params })
  },

  getUnreadCount: async () => {
    return await apiService.get(`${BASE_URL}/unread-count`)
  },

  markRead: async (id) => {
    return await apiService.put(`${BASE_URL}/${id}/read`, {})
  },

  markAllRead: async () => {
    return await apiService.post(`${BASE_URL}/read-all`, {})
  },
}

export default notifikasiService
