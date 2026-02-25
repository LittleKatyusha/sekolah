import { apiService } from '../../../utils/api'

const BASE_URL = '/admin/activity-logs'

export const activityLogsService = {
  /**
   * Get all activity logs with optional query params
   * @param {Object} params
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get(`${BASE_URL}/`, { params })
  },

  /**
   * Get activity log detail by ID
   * @param {number|string} id
   * @returns {Promise<{data: any, error: any}>}
   */
  getById: async (id) => {
    return await apiService.get(`${BASE_URL}/${id}`)
  },

  /**
   * Filter activity logs by user id
   * @param {number|string} userId
   * @param {Object} params - Query parameters for pagination
   * @returns {Promise<{data: any, error: any}>}
   */
  getByUser: async (userId, params = {}) => {
    return await apiService.get(`${BASE_URL}/user/${userId}`, { params })
  },

  /**
   * Filter activity logs by module name
   * @param {string} module
   * @param {Object} params - Query parameters for pagination
   * @returns {Promise<{data: any, error: any}>}
   */
  getByModule: async (module, params = {}) => {
    return await apiService.get(`${BASE_URL}/module/${encodeURIComponent(module)}`, { params })
  },
}

export default activityLogsService 