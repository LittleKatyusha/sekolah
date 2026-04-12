import { apiService } from '../../../utils/api'

const BASE_URL = '/chatbot'

export const chatbotService = {
  /**
   * Send a message to the AI chatbot
   * @param {string} text - User message text
   * @returns {Promise<{data: any, error: any}>}
   */
  sendMessage: async (text) => {
    return await apiService.post(`${BASE_URL}/message`, { message: text })
  },

  /**
   * Clear the current user's chat session history
   * @returns {Promise<{data: any, error: any}>}
   */
  clearSession: async () => {
    return await apiService.delete(`${BASE_URL}/session`)
  },
}
