import { apiService } from '../../../utils/api'

const BASE_URL = '/ews'
const ALERTS_URL = `${BASE_URL}/alerts`

export const ewsService = {
  getAll: async (params = {}) => {
    return await apiService.get(ALERTS_URL, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  resolve: async (id) => {
    return await apiService.patch(`${ALERTS_URL}/${id}/resolve`, {})
  },

  trigger: async (siswaId) => {
    return await apiService.post(`${BASE_URL}/process-siswa/${siswaId}`, {})
  },
}

export default ewsService
