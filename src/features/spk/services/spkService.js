import { apiService } from '../../../utils/api'

/**
 * Service for managing SPK Kriteria (criteria)
 */
export const kriteriaService = {
  getAll: async (params = {}) => {
    return await apiService.get('/spk/kriteria/', { params })
  },

  getById: async (id) => {
    return await apiService.get(`/spk/kriteria/${id}`)
  },

  create: async (data) => {
    return await apiService.post('/spk/kriteria', data)
  },

  update: async (id, data) => {
    return await apiService.put(`/spk/kriteria/${id}`, data)
  },

  delete: async (id) => {
    return await apiService.delete(`/spk/kriteria/${id}`)
  },

  getTotalBobot: async () => {
    return await apiService.get('/spk/kriteria/total-bobot')
  },
}

/**
 * Service for managing SPK Penilaian (assessments)
 */
export const penilaianService = {
  getAll: async (params = {}) => {
    return await apiService.get('/spk/penilaian/', { params })
  },

  getById: async (id) => {
    return await apiService.get(`/spk/penilaian/${id}`)
  },

  create: async (data) => {
    return await apiService.post('/spk/penilaian', data)
  },

  update: async (id, data) => {
    return await apiService.put(`/spk/penilaian/${id}`, data)
  },

  delete: async (id) => {
    return await apiService.delete(`/spk/penilaian/${id}`)
  },

  getBySiswa: async (siswaId, params = {}) => {
    return await apiService.get(`/spk/penilaian/siswa/${siswaId}`, { params })
  },

  getByKriteria: async (kriteriaId, params = {}) => {
    return await apiService.get(`/spk/penilaian/kriteria/${kriteriaId}`, { params })
  },
}

/**
 * Service for managing SPK Hasil (results)
 */
export const hasilService = {
  getAll: async (params = {}) => {
    return await apiService.get('/spk/hasil/', { params })
  },

  getById: async (id) => {
    return await apiService.get(`/spk/hasil/${id}`)
  },

  delete: async (id) => {
    return await apiService.delete(`/spk/hasil/${id}`)
  },

  calculate: async (data) => {
    return await apiService.post('/spk/hasil/calculate', data)
  },

  getByPeriode: async (periode) => {
    return await apiService.get(`/spk/hasil/periode/${periode}`)
  },

  getBySiswa: async (siswaId) => {
    return await apiService.get(`/spk/hasil/siswa/${siswaId}`)
  },
}

export default {
  kriteriaService,
  penilaianService,
  hasilService,
}