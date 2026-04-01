import apiService from '../../../utils/api'

const BASE_URL = '/akademik/forum'
const LIST_URL = '/akademik/forum/'

export const forumService = {
  /**
   * Get all forum with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {string} [params.search] - Search keyword
   * @param {number} [params.per_page] - Items per page (default: 15)
   * @param {string} [params.cursor] - Cursor for pagination
   * @param {Object} [options] - Additional options
   * @param {AbortSignal} [options.signal] - AbortController signal for cancellation
   * @returns {Promise<{data: any, meta: any, error: any}>}
   */
  getAll: async (params = {}, options = {}) => {
    try {
      const config = options.signal ? { params, signal: options.signal } : { params }
      const { data, error } = await apiService.get(LIST_URL, config)
      if (error) throw new Error(typeof error === 'string' ? error : error.message || 'Failed to fetch topics')
      return { data: data?.data || [], meta: data?.meta || {}, error: null }
    } catch (error) {
      if (error.name === 'AbortError') return { data: null, meta: null, error: 'cancelled' }
      return { data: null, meta: null, error: error.message || 'Failed to fetch topics' }
    }
  },

  /**
   * Get forum details by ID
   * @param {number|string} id - Forum ID
   * @param {Object} [options] - Additional options
   * @param {AbortSignal} [options.signal] - AbortController signal for cancellation
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id, options = {}) => {
    try {
      const config = options.signal ? { signal: options.signal } : {}
      const { data, error } = await apiService.get(`${BASE_URL}/${id}`, config)
      if (error) throw new Error(typeof error === 'string' ? error : error.message || 'Failed to fetch topic')
      return { data: data?.data || null, error: null }
    } catch (error) {
      if (error.name === 'AbortError') return { data: null, error: 'cancelled' }
      return { data: null, error: error.message || 'Failed to fetch topic' }
    }
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
  create: async (payload) => {
    try {
      const { data, error } = await apiService.post(BASE_URL, payload)
      if (error) throw new Error(typeof error === 'string' ? error : error.message || 'Failed to create topic')
      return { data: data?.data || null, error: null }
    } catch (error) {
      return { data: null, error: error.message || 'Failed to create topic' }
    }
  },

  /**
   * Update existing forum
   * @param {number|string} id - Forum ID
   * @param {Object} data - Updated forum data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, payload) => {
    try {
      const { data, error } = await apiService.put(`${BASE_URL}/${id}`, payload)
      if (error) throw new Error(typeof error === 'string' ? error : error.message || 'Failed to update topic')
      return { data: data?.data || null, error: null }
    } catch (error) {
      return { data: null, error: error.message || 'Failed to update topic' }
    }
  },

  /**
   * Delete forum
   * @param {number|string} id - Forum ID
   * @returns {Promise<{data: boolean, error: any}>}
   */
  delete: async (id) => {
    try {
      const { error } = await apiService.delete(`${BASE_URL}/${id}`)
      if (error) throw new Error(typeof error === 'string' ? error : error.message || 'Failed to delete topic')
      return { data: true, error: null }
    } catch (error) {
      return { data: null, error: error.message || 'Failed to delete topic' }
    }
  },

  /**
   * Get forum topics by guru mapel ID
   * @param {number|string} guruMapelId - Guru Mapel ID
   * @param {Object} [params] - Optional query parameters
   * @param {string} [params.search] - Search keyword
   * @param {Object} [options] - Additional options
   * @param {AbortSignal} [options.signal] - AbortController signal for cancellation
   * @returns {Promise<{data: any, error: any}>}
   */
  getTopicsByGuruMapel: async (guruMapelId, params = {}, options = {}) => {
    try {
      const config = options.signal ? { params, signal: options.signal } : { params }
      const { data, error } = await apiService.get(`${BASE_URL}/guru-mapel/${guruMapelId}/topics`, config)
      if (error) throw new Error(typeof error === 'string' ? error : error.message || 'Failed to fetch topics')
      return { data: data?.data || [], error: null }
    } catch (error) {
      if (error.name === 'AbortError') return { data: null, error: 'cancelled' }
      return { data: null, error: error.message || 'Failed to fetch topics' }
    }
  },

  /**
   * Get replies for a forum post
   * @param {number|string} parentId - Parent forum ID
   * @param {Object} [options] - Additional options
   * @param {AbortSignal} [options.signal] - AbortController signal for cancellation
   * @returns {Promise<{data: any, error: any}>}
   */
  getReplies: async (parentId, options = {}) => {
    try {
      const config = options.signal ? { signal: options.signal } : {}
      const { data, error } = await apiService.get(`${BASE_URL}/${parentId}/replies`, config)
      if (error) throw new Error(typeof error === 'string' ? error : error.message || 'Failed to fetch replies')
      return { data: data?.data || [], error: null }
    } catch (error) {
      if (error.name === 'AbortError') return { data: null, error: 'cancelled' }
      return { data: null, error: error.message || 'Failed to fetch replies' }
    }
  },

  /**
   * Get forum posts by user ID
   * @param {number|string} userId - User ID
   * @param {Object} [params] - Optional query parameters
   * @param {number} [params.mst_guru_mapel_id] - Filter by guru mapel
   * @param {Object} [options] - Additional options
   * @param {AbortSignal} [options.signal] - AbortController signal for cancellation
   * @returns {Promise<{data: any, error: any}>}
   */
  getByUser: async (userId, params = {}, options = {}) => {
    try {
      const config = options.signal ? { params, signal: options.signal } : { params }
      const { data, error } = await apiService.get(`${BASE_URL}/user/${userId}`, config)
      if (error) throw new Error(typeof error === 'string' ? error : error.message || 'Failed to fetch user posts')
      return { data: data?.data || [], error: null }
    } catch (error) {
      if (error.name === 'AbortError') return { data: null, error: 'cancelled' }
      return { data: null, error: error.message || 'Failed to fetch user posts' }
    }
  },
}

export default forumService
