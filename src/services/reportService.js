import api, { apiService } from '../utils/api'

/**
 * Report service — membungkus endpoint mesin laporan lokal (/api/v1/reports/*).
 *
 * Catatan arsitektur:
 * - `generate` mengembalikan `download_url` ke endpoint API terproteksi.
 *   Unduhan harus menggunakan klien API agar bearer token tetap terkirim.
 * - Semua method mengikuti konvensi codebase: mengembalikan `{ data, error }`.
 */

const BASE_URL = '/reports'

export const reportService = {
  /**
   * Generate laporan secara sinkron.
   * @param {Object} params
   * @param {string} params.report_path - Path template pada registry laporan.
   * @param {Object} [params.parameters] - Parameter/filter laporan (mis. siswa_id, kelas_id).
   * @param {string} [params.format] - Format output: pdf | xlsx | csv | ods | html.
   * @param {string} [params.output_filename] - Nama file kustom tanpa ekstensi.
   * @returns {Promise<{data: any, error: any}>}
   */
  generate: async ({ report_path, parameters = {}, format = 'pdf', output_filename = null }) => {
    return await apiService.post(`${BASE_URL}/generate`, {
      report_path,
      parameters,
      format,
      output_filename,
    })
  },

  /**
   * Generate laporan secara asinkron (antrian background) untuk laporan berat.
   * @param {Object} params
   * @param {string} params.report_path
   * @param {Object} [params.parameters]
   * @param {string} [params.format]
   * @param {string} [params.output_filename]
   * @param {string} [params.callback_url] - Webhook opsional saat job selesai.
   * @returns {Promise<{data: any, error: any}>}
   */
  generateAsync: async ({
    report_path,
    parameters = {},
    format = 'pdf',
    output_filename = null,
    callback_url = null,
  }) => {
    return await apiService.post(`${BASE_URL}/generate-async`, {
      report_path,
      parameters,
      format,
      output_filename,
      callback_url,
    })
  },

  /**
   * Cek status job laporan asinkron.
   * @param {string} jobId
   * @returns {Promise<{data: any, error: any}>}
   */
  getJobStatus: async (jobId) => {
    return await apiService.get(`${BASE_URL}/status`, {
      params: { job_id: jobId },
    })
  },

  /**
   * Ambil daftar template laporan yang tersedia (opsional difilter per folder/modul).
   * @param {string} [folder]
   * @returns {Promise<{data: any, error: any}>}
   */
  listTemplates: async (folder = null) => {
    return await apiService.get(`${BASE_URL}/list`, {
      params: folder ? { folder } : {},
    })
  },

  /**
   * Ambil daftar parameter yang dibutuhkan sebuah template.
   * @param {string} reportPath
   * @returns {Promise<{data: any, error: any}>}
   */
  getParameters: async (reportPath) => {
    return await apiService.get(`${BASE_URL}/parameters`, {
      params: { report_path: reportPath },
    })
  },

  /**
   * Tes ketersediaan mesin laporan lokal.
   * @returns {Promise<{data: any, error: any}>}
   */
  test: async () => {
    return await apiService.get(`${BASE_URL}/test`)
  },

  /**
   * Hapus satu file laporan hasil generate.
   * @param {string} filename
   * @returns {Promise<{data: any, error: any}>}
   */
  deleteReport: async (filename) => {
    return await apiService.delete(`${BASE_URL}/delete`, {
      data: { filename },
    })
  },

  /**
   * Bersihkan file laporan lama (lebih lama dari N jam).
   * @param {number} [hoursOld=24]
   * @returns {Promise<{data: any, error: any}>}
   */
  cleanReports: async (hoursOld = 24) => {
    return await apiService.delete(`${BASE_URL}/clean`, {
      data: { hours_old: hoursOld },
    })
  },

  /**
   * Unduh file laporan dengan kredensial API lalu picu browser download.
   * @param {string} downloadUrl - URL endpoint laporan dari backend.
   * @param {string|null} [filename] - Nama file yang disarankan.
   */
  triggerBrowserDownload: async (downloadUrl, filename = null) => {
    const response = await api.get(downloadUrl, { responseType: 'blob' })
    const objectUrl = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = objectUrl
    link.rel = 'noopener'
    if (filename) {
      link.setAttribute('download', filename)
    }
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  },

  /**
   * Generate + langsung unduh dalam satu aksi.
   * Mengembalikan `{ data, error }` agar konsisten dengan konvensi service lain.
   * @param {Object} params - Sama seperti `generate`.
   * @returns {Promise<{data: any, error: any}>}
   */
  generateAndDownload: async (params) => {
    const { data, error } = await reportService.generate(params)
    if (error) {
      return { data: null, error }
    }

    const payload = data?.data || {}
    const downloadUrl = payload.download_url
    if (!downloadUrl) {
      return { data: null, error: { message: 'Respons API tidak menyertakan download_url' } }
    }

    const filename =
      payload.file_name || downloadUrl.substring(downloadUrl.lastIndexOf('/') + 1)
    try {
      await reportService.triggerBrowserDownload(downloadUrl, filename)
    } catch (downloadError) {
      return { data: null, error: { message: downloadError.response?.data?.message || 'Unduhan laporan gagal.' } }
    }

    return { data: payload, error: null }
  },
}

export default reportService
