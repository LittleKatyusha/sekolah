import { apiService } from '../../../utils/api'

const BASE_URL = '/support/tickets'

export const ticketService = {
  getAll: async (params = {}) => {
    const res = await apiService.get(`${BASE_URL}/`, { params })
    return res.data ?? { data: [], meta: {} }
  },

  getById: async (id) => {
    const res = await apiService.get(`${BASE_URL}/${id}`)
    return res.data ?? null
  },

  create: async (data) => {
    if (data instanceof FormData) {
      return await apiService.post(`${BASE_URL}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }
    if (data?.file) {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value)
        }
      })
      return await apiService.post(`${BASE_URL}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }
    return await apiService.post(`${BASE_URL}/`, data)
  },

  escalate: async (id) => {
    return await apiService.post(`${BASE_URL}/${id}/escalate`, {})
  },

  resolve: async (id) => {
    return await apiService.post(`${BASE_URL}/${id}/resolve`, {})
  },
}

export default ticketService
