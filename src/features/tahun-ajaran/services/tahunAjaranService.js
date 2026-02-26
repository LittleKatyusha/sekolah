import { apiService } from '../../../utils/api'

const BASE_URL = '/admin/tahun-ajaran'
const LIST_URL = '/admin/tahun-ajaran/'

export const tahunAjaranService = {
  getAll: async (params = {}) => {
    return await apiService.get(LIST_URL, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
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

  getActive: async () => {
    return await apiService.get(`${BASE_URL}/active`)
  },

  setActive: async (id) => {
    return await apiService.post(`${BASE_URL}/${id}/set-active`)
  },
}

export default tahunAjaranService