import { apiService } from '../../../utils/api'

const BASE_URL = '/notifikasi'

export const notifikasiService = {
  getAll: async (params = {}) => {
    const res = await apiService.get(`${BASE_URL}/`, { params })
    // apiService.get returns { data: <axios response.data>, error }
    // Laravel envelope: { success, message, data: [...], meta: {...} }
    return res.data ?? { data: [], meta: {} }
  },

  getUnreadCount: async () => {
    const res = await apiService.get(`${BASE_URL}/unread-count`)
    return res.data ?? { data: { unread_count: 0 } }
  },

  markRead: async (id) => {
    const res = await apiService.put(`${BASE_URL}/${id}/read`, {})
    return res.data ?? {}
  },

  markAllRead: async () => {
    const res = await apiService.post(`${BASE_URL}/read-all`, {})
    return res.data ?? {}
  },
}

export default notifikasiService
