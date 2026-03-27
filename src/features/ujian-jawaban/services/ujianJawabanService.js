import api from '../../../utils/api'

const BASE_URL = '/akademik/ujian-jawaban'

export const ujianJawabanService = {
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

  update: async (id, data) => {
    try {
      const response = await api.put(`${BASE_URL}/${id}`, data)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`${BASE_URL}/${id}`)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },

  koreksi: async (id, data) => {
    try {
      const response = await api.patch(`${BASE_URL}/${id}/koreksi`, data)
      return { data: response.data, error: null }
    } catch (error) {
      return { data: null, error: error.response?.data || error.message }
    }
  },
}