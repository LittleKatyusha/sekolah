import { apiService } from '../../../utils/api'

const BASE_URL = '/admin/menus'

export const menuService = {
  /**
   * Get all menus with pagination and filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get(BASE_URL, { params })
  },

  /**
   * Get menu details by ID
   * @param {number|string} id - Menu ID
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Create new menu
   * @param {Object} data - Menu data
   * @returns {Promise<{data: any, error: any}>}
   */
  create: async (data) => {
    return await apiService.post(BASE_URL, data)
  },

  /**
   * Update existing menu
   * @param {number|string} id - Menu ID
   * @param {Object} data - Updated menu data
   * @returns {Promise<{data: any, error: any}>}
   */
  update: async (id, data) => {
    return await apiService.put(`${BASE_URL}/${id}`, data)
  },

  /**
   * Delete menu
   * @param {number|string} id - Menu ID
   * @returns {Promise<{data: any, error: any}>}
   */
  delete: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
  },
}

export default menuService