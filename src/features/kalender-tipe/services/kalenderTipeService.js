import { apiService } from '../../../utils/api'

const BASE_URL = '/admin/kalender-tipe'

export const kalenderTipeService = {
  getAll: async (params = {}) => {
    return await apiService.get(`${BASE_URL}/`, { params })
  },

  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },
}

export default kalenderTipeService