import { apiService } from '../../../utils/api'

const BASE_URL = '/admin/references'

export const referenceAdminService = {
  getAll: async (params = {}) => {
    return await apiService.get(`${BASE_URL}/`, { params })
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

  getByCategory: async (category) => {
    return await apiService.get(`${BASE_URL}/category/${category}`)
  },
}

export default referenceAdminService