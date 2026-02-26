import { apiService } from '../../../utils/api'

const BASE_URL = '/admin/hari-operasional'

export const hariOperasionalService = {
  getAll: async (params = {}) => {
    return await apiService.get(`${BASE_URL}/`, { params })
  },

  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },
}

export default hariOperasionalService