import { apiService } from '../utils/api'

const BASE_URL = '/fcm'

/**
 * Register (or refresh) an FCM device token for the authenticated user.
 * @param {string} token - The FCM registration token from Firebase SDK.
 */
export const registerFcmToken = async (token) => {
  return apiService.post(`${BASE_URL}/token`, { token })
}

/**
 * Remove the FCM token for the authenticated user (e.g. on logout).
 */
export const deleteFcmToken = async () => {
  return apiService.delete(`${BASE_URL}/token`)
}

const fcmService = { registerFcmToken, deleteFcmToken }

export default fcmService
