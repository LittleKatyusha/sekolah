import { apiService } from '../../../utils/api'

const BASE_URL = '/admin/activity-logs'
const LIST_URL = '/admin/activity-logs/'

export const activityLogsService = {
  /**
   * Get all activity logs with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {string} [params.search] - Search by action, module, or description
   * @param {string} [params.user_id] - Filter by user ID
   * @param {string} [params.module] - Filter by module
   * @param {string} [params.action] - Filter by action
   * @param {string} [params.from_date] - Filter from date (YYYY-MM-DD)
   * @param {string} [params.to_date] - Filter to date (YYYY-MM-DD)
   * @param {number} [params.per_page] - Items per page (default: 15)
   * @param {string} [params.cursor] - Cursor for pagination
   * @returns {Promise<{data: any, error: any}>}
   */
  getAll: async (params = {}) => {
    return await apiService.get(LIST_URL, { params })
  },
}

export default activityLogsService 