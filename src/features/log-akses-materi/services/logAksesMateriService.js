import { apiService } from '../../../utils/api'

const BASE_URL = '/akademik/log-akses-materi'

export const logAksesMateriService = {
  getAll: async (params = {}) => {
    return await apiService.get(BASE_URL, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  updateDurasi: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}/durasi`, data)
  },

  byMateri: async (materiId, params = {}) => {
    return await apiService.get(`${BASE_URL}/materi/${materiId}`, { params })
  },

  bySiswa: async (siswaId, params = {}) => {
    return await apiService.get(`${BASE_URL}/siswa/${siswaId}`, { params })
  },

  popular: async (params = {}) => {
    return await apiService.get(`${BASE_URL}/popular`, { params })
  },
}