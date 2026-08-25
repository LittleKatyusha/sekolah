import { apiService } from '../../../utils/api'

const BASE_URL = '/admin/tahun-ajaran'
const LIST_URL = '/admin/tahun-ajaran/'

const importExcel = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return await apiService.post(`${BASE_URL}/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

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

  importExcel,
}

export default tahunAjaranService
