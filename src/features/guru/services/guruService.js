import { apiService } from '../../../utils/api'

const BASE_URL = '/guru'
const LIST_URL = '/guru/'

export const guruService = {
  /**
   * Get all guru with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {string} [params.search] - Search by nama or nip
   * @param {string} [params.jenis_kelamin] - Filter by gender
   * @param {number} [params.per_page] - Items per page (default: 15)
   * @param {string} [params.cursor] - Cursor for pagination
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get(LIST_URL, { params })
  },

  /**
   * Get guru details by ID
   * @param {number|string} id - Guru ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new guru
   * @param {Object} data - Guru data
   * @param {string} data.nip - NIP number
   * @param {string} [data.nuptk] - NUPTK number
   * @param {string} data.nama - Teacher name
   * @param {string} data.jenis_kelamin - Gender (Laki-Laki/Perempuan)
   * @param {string} data.tanggal_lahir - Date of birth (YYYY-MM-DD)
   * @param {string} [data.alamat] - Address
   * @param {string} [data.no_hp] - Phone number
   * @param {string} [data.email] - Email address
   * @param {number} [data.pendidikan_terakhir] - Last education level
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing guru
   * @param {number|string} id - Guru ID
   * @param {Object} data - Updated guru data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete guru
   * @param {number|string} id - Guru ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },
}

export default guruService