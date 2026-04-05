import { apiService } from '../../../utils/api'

const BASE_URL = '/admin/semester'
const LIST_URL = '/admin/semester/'

export const semesterService = {
  getAll: async (params = {}) => {
    return await apiService.get(LIST_URL, { params })
  },

  getById: async (id) => {
    const response = await apiService.get(LIST_URL, { params: { per_page: 1000 } })
    if (response.error) return { data: null, error: response.error }
    const items = response.data?.data?.data || response.data?.data || []
    const item = Array.isArray(items) ? items.find(i => i.id === parseInt(id)) : null
    if (!item) return { data: null, error: { message: 'Data tidak ditemukan' } }
    return { data: { data: item }, error: null }
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