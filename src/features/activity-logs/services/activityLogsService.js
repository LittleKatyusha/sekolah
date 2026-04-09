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
   * Delete activity log by ID
   * @param {number|string} id
   * @returns {Promise<{data: any, error: any}>}
   */
  deleteById: async (id) => {
    return await apiService.delete(`${BASE_URL}/${id}`)
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
   * Get list of modules
   * @param {Object} params - Query parameters
   * @returns {Promise<{data: any, error: any}>}
   */
  getModuleList: async (params = {}) => {
    return await apiService.get(`${BASE_URL}/module/list`, { params })
  },

  /**
   * Clear old activity logs
   * @returns {Promise<{data: any, error: any}>}
   */
  clearOld: async () => {
    return await apiService.delete(`${BASE_URL}/clear-old`)
  },

  /**
   * Get activity logs statistics
   * @returns {Promise<{data: any, error: any}>}
   */
  getStatistics: async () => {
    return await apiService.get(`${BASE_URL}/statistics`)
  },

  /**
   * Get history of changes for a specific record
   * @param {string} table - DB table name
   * @param {number|string} id - Record ID
   * @param {Object} params - Query parameters (per_page, page)
   * @returns {Promise<{data: any, error: any}>}
   */
  getByRecord: async (table, id, params = {}) => {
    return await apiService.get(`${BASE_URL}/record/${table}/${id}`, { params })
  },
}

export default activityLogsService 