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
   * @returns {Promise<{data: any, error: any}>}
   */
  getByUser: async (userId) => {
    return await apiService.get(`${BASE_URL}/user/${userId}`)
  },

  /**
   * Filter activity logs by module name
   * @param {string} module
   * @returns {Promise<{data: any, error: any}>}
   */
  getByModule: async (module) => {
    return await apiService.get(`${BASE_URL}/module/${encodeURIComponent(module)}`)
  },
}

export default activityLogsService 