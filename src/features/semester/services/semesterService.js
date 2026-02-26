import { apiService } from '../../../utils/api'

const BASE_URL = '/admin/semester'
const LIST_URL = '/admin/semester/'

export const semesterService = {
  getAll: async (params = {}) => {
    return await apiService.get(LIST_URL, { params })
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

export default semesterService