import { apiService } from '../utils/api'

/**
 * Health check service for API monitoring
 */
export const healthService = {
  /**
   * Check if the API is healthy
   * @returns {Promise<{data: any, error: any}>}
   */
  check: async () => {
    return await apiService.get('/health')
  },
}

export default healthService