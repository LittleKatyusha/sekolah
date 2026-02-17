import { apiService } from '../utils/api'

const BASE_URL = '/files'

export const fileUploadService = {
  /**
   * Upload a file to the server
   * @param {File} file - The file object to upload
   * @param {string} [folder] - Optional folder name
   * @returns {Promise<{data: any, error: any}>}
   */
  uploadFile: async (file, folder = '') => {
    const formData = new FormData()
    formData.append('file', file)
    
    if (folder) {
      formData.append('folder', folder)
    }

    return await apiService.post(`${BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  /**
   * Get a presigned URL for a file path
   * @param {string} filePath - The file path
   * @param {number} [expiration=15] - Expiration in minutes
   * @returns {Promise<{data: any, error: any}>}
   */
  getPresignedUrl: async (filePath, expiration = 15) => {
    return await apiService.post(`${BASE_URL}/presigned-url`, {
      file_path: filePath,
      expiration,
    })
  },

  /**
   * Delete a file
   * @param {string} filePath - The file path to delete
   * @returns {Promise<{data: any, error: any}>}
   */
  deleteFile: async (filePath) => {
    return await apiService.delete(`${BASE_URL}/delete`, {
      data: { file_path: filePath },
    })
  },
}

export default fileUploadService