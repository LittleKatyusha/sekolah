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
