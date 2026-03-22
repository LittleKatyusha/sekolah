import { apiService } from '../../../utils/api'

const BASE_URL = '/ews'
const LIST_URL = '/ews/'

export const ewsService = {
  getAll: async (params = {}) => {
    return await apiService.get(LIST_URL, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  resolve: async (id) => {
    return await apiService.put(`${BASE_URL}/${id}/resolve`, {})
  },

  trigger: async (siswaId) => {
    return await apiService.post(`${BASE_URL}/${siswaId}/trigger`, {})
  },
}

export default ewsService