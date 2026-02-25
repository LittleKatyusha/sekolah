import { apiService } from '../../../utils/api'

const BASE_URL = '/mapel'
const LIST_URL = '/mapel/'

export const mapelService = {
  /**
   * Get all mapel with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {string} [params.search] - Search by kode or nama
   * @param {number} [params.per_page] - Items per page (default: 15)
   * @param {string} [params.cursor] - Cursor for pagination
   * @returns {Promise<{data: any, error: any}>}
   */
  getMapel: async (params = {}) => {
    return await apiService.get(LIST_URL, { params })
  },

  /**
   * Get mapel details by ID
   * @param {number|string} id - Mapel ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getMapelById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new mapel
   * @param {Object} data - Mapel data
   * @param {string} data.kode - Mapel code
   * @param {string} data.nama - Mapel name
   * @returns {Promise<{data: any, error: any}>}
   */
  createMapel: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing mapel
   * @param {number|string} id - Mapel ID
   * @param {Object} data - Updated mapel data
   * @returns {Promise<{data: any, error: any}>}
   */
  updateMapel: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete mapel
   * @param {number|string} id - Mapel ID
   * @returns {Promise<{data: any, error: any}>}
   */
  deleteMapel: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },
}

export default mapelService