import api from '../../../utils/api'

const BASE_URL = '/akademik/log-akses-materi'

export const logAksesMateriService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get(BASE_URL, { params })
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`${BASE_URL}/${id}`)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  create: async (data) => {
    try {
      const response = await api.post(BASE_URL, data)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  updateDurasi: async (id, data) => {
    try {
      const response = await api.put(`${BASE_URL}/${id}/durasi`, data)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  byMateri: async (materiId, params = {}) => {
    try {
      const response = await api.get(`${BASE_URL}/materi/${materiId}`, { params })
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  bySiswa: async (siswaId, params = {}) => {
    try {
      const response = await api.get(`${BASE_URL}/siswa/${siswaId}`, { params })
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  popular: async (params = {}) => {
    try {
      const response = await api.get(`${BASE_URL}/popular`, { params })
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },
}