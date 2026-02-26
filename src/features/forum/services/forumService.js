import { apiService } from '../../../utils/api'

const BASE_URL = '/akademik/forum'
const LIST_URL = '/akademik/forum/'

export const forumService = {
  /**
   * Get all forum with pagination and filtering
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
   * Get forum details by ID
   * @param {number|string} id - Forum ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new forum
   * @param {Object} data - Forum data
   * @param {number} data.mst_guru_mapel_id - Guru Mapel ID (required)
   * @param {number} data.sys_user_id - User ID (required)
   * @param {number} [data.parent_id] - Parent forum ID (optional, for replies)
   * @param {string} [data.judul] - Title (optional)
   * @param {string} data.pesan - Message (required)
   * @param {string} [data.file_lampiran] - Attachment file path (optional)
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing forum
   * @param {number|string} id - Forum ID
   * @param {Object} data - Updated forum data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete forum
   * @param {number|string} id - Forum ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },

  /**
   * Get forum topics by guru mapel ID
   * @param {number|string} guruMapelId - Guru Mapel ID
   * @param {Object} [params] - Optional query parameters
   * @param {string} [params.search] - Search keyword
   * @returns {Promise<{data: any, error: any}>}
   */
  getTopicsByGuruMapel: async (guruMapelId, params = {}) => {
    return await apiService.get(`${BASE_URL}/guru-mapel/${guruMapelId}/topics`, { params })
  },

  /**
   * Get replies for a forum post
   * @param {number|string} parentId - Parent forum ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getReplies: async (parentId) => {
    return await apiService.get(`${BASE_URL}/${parentId}/replies`)
  },

  /**
   * Get forum posts by user ID
   * @param {number|string} userId - User ID
   * @param {Object} [params] - Optional query parameters
   * @param {number} [params.mst_guru_mapel_id] - Filter by guru mapel
   * @returns {Promise<{data: any, error: any}>}
   */
  getByUser: async (userId, params = {}) => {
    return await apiService.get(`${BASE_URL}/user/${userId}`, { params })
  },
}

export default forumService