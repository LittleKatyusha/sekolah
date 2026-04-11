import { apiService } from '../../../utils/api'

const BASE_URL = '/guru-mapel'

export const guruMapelService = {
  getGuruMapel: async (params = {}) => {
    return await apiService.get(`${BASE_URL}/`, { params })
  },

  getGuruMapelById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  createGuruMapel: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  updateGuruMapel: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  deleteGuruMapel: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  getByGuru: async (guruId) => {
    return await apiService.get(`${BASE_URL}/guru/${guruId}`)
  },

  getByMapel: async (mapelId) => {
    return await apiService.get(`${BASE_URL}/mapel/${mapelId}`)
  },
}

export default guruMapelService
