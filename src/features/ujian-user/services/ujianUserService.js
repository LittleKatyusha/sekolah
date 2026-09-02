import { apiService } from '../../../utils/api'

const BASE_URL = '/akademik/ujian-user'
const LIST_URL = '/akademik/ujian-user/'

export const ujianUserService = {
  /**
   * Get all ujian user with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {string} [params.search] - Search by ujian name or siswa name
   * @param {number} [params.trx_ujian_id] - Filter by ujian ID
   * @param {number} [params.mst_siswa_id] - Filter by siswa ID
   * @param {number} [params.status] - Filter by status (0-3)
   * @param {number} [params.per_page] - Items per page (default: 15)
   * @param {string} [params.cursor] - Cursor for pagination
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get(LIST_URL, { params })
  },

  /**
   * Get ujian user details by ID
   * @param {number|string} id - Ujian User ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new ujian user
   * @param {Object} data - Ujian user data
   * @param {number} data.trx_ujian_id - Ujian ID (required)
   * @param {number} data.mst_siswa_id - Siswa ID (required)
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing ujian user
   * @param {number|string} id - Ujian User ID
   * @param {Object} data - Updated ujian user data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete ujian user
   * @param {number|string} id - Ujian User ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Start exam (mulai ujian)
   * @param {number|string} id - Ujian User ID
   * @returns {Promise<{data: any, error: any}>}
   */
  mulaiUjian: async (id) => {
    return await apiService.post(`${BASE_URL}/${id}/mulai`)
  },

  getSoal: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}/soal`)
  },

  simpanJawaban: async (data) => {
    return await apiService.post('/akademik/ujian-jawaban', data)
  },

  updateJawaban: async (id, data) => {
    return await apiService.put(`/akademik/ujian-jawaban/${id}`, data)
  },

  /**
   * Finish exam (selesaikan ujian)
   * @param {number|string} id - Ujian User ID
   * @returns {Promise<{data: any, error: any}>}
   */
  selesaikanUjian: async (id) => {
    return await apiService.post(`${BASE_URL}/${id}/selesaikan`)
  },

  /**
   * Report exam violation (Lightweight telemetry)
   * @param {number|string} id - Ujian User ID
   * @param {string} type - Violation type (e.g. TAB_SWITCH, EXIT_FULLSCREEN)
   * @returns {Promise<{data: any, error: any}>}
   */
  reportViolation: async (id, type) => {
    return await apiService.post(`${BASE_URL}/${id}/pelanggaran`, { type })
  },
}

export default ujianUserService
