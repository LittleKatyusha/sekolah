import { apiService } from '../../../utils/api'

const BASE_URL = '/akademik/ujian-jawaban'

export const ujianJawabanService = {
  getAll: async (params = {}) => {
    return await apiService.get(BASE_URL, { params })
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

  koreksi: async (id, data) => {
    return await apiService.patch(`${BASE_URL}/${id}/koreksi`, data)
  },
}