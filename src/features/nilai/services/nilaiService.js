import { apiService } from '../../../utils/api'

const BASE_URL = '/akademik/nilai'
const LIST_URL = '/akademik/nilai/'

export const nilaiService = {
  /**
   * Get all nilai with pagination and filtering
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
   * Get nilai details by ID
   * @param {number|string} id - Nilai ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new nilai
   * @param {Object} data - Nilai data
   * @param {number} data.trx_ujian_id - Ujian ID (required)
   * @param {number} data.mst_siswa_id - Siswa ID (required)
   * @param {number} data.nilai - Score value (required)
   * @param {string} [data.keterangan] - Additional notes (optional)
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing nilai
   * @param {number|string} id - Nilai ID
   * @param {Object} data - Updated nilai data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete nilai
   * @param {number|string} id - Nilai ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Get nilai by siswa ID
   * @param {number|string} siswaId - Siswa ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getBySiswa: async (siswaId) => {
    return await apiService.get(`${BASE_URL}/siswa/${siswaId}`)
  },

  /**
   * Get nilai by ujian ID
   * @param {number|string} ujianId - Ujian ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getByUjian: async (ujianId) => {
    return await apiService.get(`${BASE_URL}/ujian/${ujianId}`)
  },

  /**
   * Get rata-rata (average) nilai by siswa ID
   * @param {number|string} siswaId - Siswa ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getRataRata: async (siswaId) => {
    return await apiService.get(`${BASE_URL}/siswa/${siswaId}/rata-rata`)
  },
}

export default nilaiService