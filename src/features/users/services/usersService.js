import { apiService } from '../../../utils/api'

const BASE_URL = '/admin/users'
const LIST_URL = '/admin/users/'

export const usersService = {
  /**
   * Get all users with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {string} [params.search] - Search by name or email
   * @param {string} [params.role] - Filter by role
   * @param {number} [params.per_page] - Items per page (default: 15)
   * @param {string} [params.cursor] - Cursor for pagination
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get(LIST_URL, { params })
  },

  /**
   * Get user details by ID
   * @param {number|string} id - User ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new user
   * @param {Object} data - User data
   * @param {string} data.name - User name
   * @param {string} data.email - Email address
   * @param {string} data.password - Password (required for create)
   * @param {number} [data.role] - Role ID
   * @param {boolean} [data.is_active] - Active status
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing user
   * @param {number|string} id - User ID
   * @param {Object} data - Updated user data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Toggle user active status
   * @param {number|string} id - User ID
   * @param {boolean} is_active - Active status
   * @returns {Promise<{data: any, error: any}>}
   */
  toggleStatus: async (id, is_active) => {
    return await apiService.patch(`${BASE_URL}/${id}`, { is_active })
  },

  /**
   * Delete user
   * @param {number|string} id - User ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },
}

export default usersService