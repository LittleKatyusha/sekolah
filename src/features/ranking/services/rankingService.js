import { apiService } from '../../../utils/api'

const BASE_URL = '/akademik/ranking'
const LIST_URL = '/akademik/ranking/'

export const rankingService = {
  /**
   * Get all ranking with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {string} [params.search] - Search keyword
   * @param {number} [params.per_page] - Items per page (default: 15)
   * @param {string} [params.cursor] - Cursor for pagination
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get(LIST_URL, { params })
  },

  /**
   * Get ranking details by ID
   * @param {number|string} id - Ranking ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new ranking
   * @param {Object} data - Ranking data
   * @param {number} data.mst_siswa_id - Siswa ID (required)
   * @param {number} data.mst_kelas_id - Kelas ID (required)
   * @param {number} data.semester - Semester ID (required)
   * @param {number} data.rata_rata_nilai - Rata-rata Nilai (required)
   * @param {number} data.peringkat - Peringkat (required)
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing ranking
   * @param {number|string} id - Ranking ID
   * @param {Object} data - Updated ranking data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete ranking
   * @param {number|string} id - Ranking ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Get ranking by kelas ID
   * @param {number|string} kelasId - Kelas ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getByKelas: async (kelasId) => {
    return await apiService.get(`${BASE_URL}/kelas/${kelasId}`)
  },

  /**
   * Generate ranking
   * @param {Object} data - Generate parameters
   * @param {number} data.kelas_id - Kelas ID
   * @param {string} data.semester - Semester
   * @param {string} data.tahun_ajaran - Tahun Ajaran
   * @returns {Promise<{data: any, error: any}>}
   */
  generate: async (data) => {
    return await apiService.post(`${BASE_URL}/generate`, data)
  },
}

export default rankingService