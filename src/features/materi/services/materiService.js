import { apiService } from '../../../utils/api'

const BASE_URL = '/akademik/materi'
const LIST_URL = '/akademik/materi/'

export const materiService = {
  /**
   * Get all materi with pagination and filtering
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
   * Get materi details by ID
   * @param {number|string} id - Materi ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new materi
   * @param {Object} data - Materi data
   * @param {number} data.mst_guru_mapel_id - Guru Mapel ID (required)
   * @param {string} data.judul - Title (required)
   * @param {string} [data.deskripsi] - Content/description (optional)
   * @param {string} [data.file_materi] - File path (optional)
   * @param {string} [data.link_video] - Video URL (optional)
   * @param {number|string} [data.status] - Status (optional)
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing materi
   * @param {number|string} id - Materi ID
   * @param {Object} data - Updated materi data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete materi
   * @param {number|string} id - Materi ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Get materi by guru mapel ID
   * @param {number|string} guruMapelId - Guru Mapel ID
   * @param {Object} [params] - Optional query parameters
   * @param {string} [params.status] - Filter by status
   * @param {string} [params.search] - Search keyword
   * @returns {Promise<{data: any, error: any}>}
   */
  getByGuruMapel: async (guruMapelId, params = {}) => {
    return await apiService.get(`${BASE_URL}/guru-mapel/${guruMapelId}`, { params })
  },
}

export default materiService