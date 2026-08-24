import { apiService } from '../../../utils/api'

const BASE_URL = '/ews'

export const ewsService = {
  getAll: async (params = {}) => {
    return await apiService.get(`${BASE_URL}/alerts`, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  resolve: async (id) => {
    return await apiService.patch(`${BASE_URL}/alerts/${id}/resolve`, {})
  },

  trigger: async (siswaId) => {
    return await apiService.post(`${BASE_URL}/process-siswa/${siswaId}`, {})
  },
}

export default ewsService
