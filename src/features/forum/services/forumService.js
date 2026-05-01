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
   * @param {Object} [options] - Additional options
   * @param {AbortSignal} [options.signal] - AbortController signal for cancellation
   * @returns {Promise<{data: any, meta: any, error: any}>}
   */
  getAll: async (params = {}, options = {}) => {
    try {
      const config = options.signal ? { params, signal: options.signal } : { params }
      const { data, error } = await apiService.get(LIST_URL, config)
      if (error) throw new Error(typeof error === 'string' ? error : error.message || 'Failed to fetch topics')
      return { data: { data: data?.data || [], meta: data?.meta || {} }, error: null }
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
   * @param {number} data.sekolah_id - Sekolah ID (required)
   * @param {number} data.created_by - User ID (required)
   * @param {string} data.judul - Title (required, max 200)
   * @param {string} data.konten - Content (required)
   * @param {number} [data.kelas_id] - Kelas ID (optional)
   * @param {number} [data.mapel_id] - Mapel ID (optional)
   * @param {number} [data.tipe] - Type: 1=diskusi, 2=pengumuman, 3=QnA (optional)
   * @param {number} [data.status] - Status: 0=draft, 1=aktif, 2=closed (optional)
   * @param {boolean} [data.is_anonymous] - Anonymous post (optional)
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
   * Get forum posts by user ID
   * @param {number|string} userId - User ID
   * @param {Object} [params] - Optional query parameters
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
