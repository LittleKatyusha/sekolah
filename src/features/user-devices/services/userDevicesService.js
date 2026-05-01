import { apiService } from '../../../utils/api'

const BASE_URL = '/admin/user-devices'

/**
 * Service for managing user devices (FCM tokens) via admin API.
 */
export const userDevicesService = {
  /**
   * Get all devices for a user.
   * @param {number|string} userId
   */
  getByUser: async (userId) =>
    apiService.get(`${BASE_URL}/user/${userId}`),

  /**
   * Get a single device by ID.
   * @param {number|string} id
   */
  getById: async (id) =>
    apiService.get(`${BASE_URL}/${id}`),

  /**
   * Register a new device.
   * @param {Object} data
   * @param {number}  data.user_id
   * @param {string}  data.fcm_token
   * @param {string}  [data.device_type]
   * @param {string}  [data.app_version]
   * @param {string}  [data.device_model]
   * @param {string}  [data.os_version]
   */
  create: async (data) =>
    apiService.post(BASE_URL, data),

  /**
   * Update an existing device.
   * @param {number|string} id
   * @param {Object} data
   */
  update: async (id, data) =>
    apiService.put(`${BASE_URL}/${id}`, data),

  /**
   * Delete a device.
   * @param {number|string} id
   */
  delete: async (id) =>
    apiService.delete(`${BASE_URL}/${id}`),

  /**
   * Touch last-active timestamp.
   * @param {number|string} id
   */
  touch: async (id) =>
    apiService.post(`${BASE_URL}/${id}/touch`),
}

export default userDevicesService
