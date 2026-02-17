import axios from 'axios'

/**
 * Health check service for API monitoring
 */
export const healthService = {
  /**
   * Check if the API is healthy
   * @returns {Promise<{data: any, error: any}>}
   */
  check: async () => {
    try {
      const response = await axios.get('/api/health', {
        timeout: 5000,
      })
      return { data: response.data, error: null }
    } catch (error) {
      return {
        data: null,
        error: error.response?.data || {
          success: false,
          message: 'Health check failed',
        },
      }
    }
  },
}

export default healthService