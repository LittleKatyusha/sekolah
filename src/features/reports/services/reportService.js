import { apiService } from '../../../utils/api'

const BASE_URL = '/reports'

export const reportService = {
  /**
   * Generate a report synchronously
   * POST /reports/generate
   * @param {Object} data
   * @param {string} data.report_path - Path to the report template
   * @param {Object} [data.parameters] - Report parameters
   * @param {string} [data.format] - Output format: pdf, xlsx, docx, html, csv, rtf, ods, pptx
   * @param {string} [data.output_filename] - Output filename
   */
  generate: (data) => apiService.post(`${BASE_URL}/generate`, data),

  /**
   * Generate a report asynchronously
   * POST /reports/generate-async
   * @param {Object} data
   * @param {string} data.report_path
   * @param {Object} [data.parameters]
   * @param {string} [data.format]
   * @param {string} [data.output_filename]
   * @param {string} [data.callback_url]
   */
  generateAsync: (data) => apiService.post(`${BASE_URL}/generate-async`, data),

  /**
   * Get async report generation status
   * GET /reports/status
   * @param {Object} params
   * @param {string} params.job_id - The async job ID
   */
  getStatus: (params = {}) => apiService.get(`${BASE_URL}/status`, { params }),

  /**
   * List available report templates
   * GET /reports/list
   * @param {Object} [params]
   */
  list: (params = {}) => apiService.get(`${BASE_URL}/list`, { params }),

  /**
   * Get parameters for a specific report
   * GET /reports/parameters
   * @param {Object} params
   * @param {string} params.report_path - Path to the report template
   */
  getParameters: (params = {}) => apiService.get(`${BASE_URL}/parameters`, { params }),

  /**
   * Delete a generated report file
   * DELETE /reports/delete
   * @param {Object} data
   * @param {string} data.file_name - Filename to delete
   */
  deleteFile: (data) => apiService.delete(`${BASE_URL}/delete`, { data }),

  /**
   * Clean old generated report files
   * DELETE /reports/clean
   * @param {Object} [data]
   * @param {number} [data.older_than_hours] - Delete files older than N hours
   */
  clean: (data = {}) => apiService.delete(`${BASE_URL}/clean`, { data }),

  /**
   * Test connection to JasperReports Server
   * GET /reports/test
   */
  testConnection: () => apiService.get(`${BASE_URL}/test`),
}
