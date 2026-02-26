import { apiService } from '../../../utils/api'

const BASE_URL = '/admin/kalender-harian'
const LIST_URL = '/admin/kalender-harian/'

export const kalenderHarianService = {
  getAll: async (params = {}) => {
    return await apiService.get(LIST_URL, { params })
  },

  generate: async (data) => {
    return await apiService.post(`${BASE_URL}/generate`, data)
  },

  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },
}

export default kalenderHarianService