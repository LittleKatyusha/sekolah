import { apiService } from '../../../utils/api'

const PUBLIC_BASE = '/public/blog'
const CMS_BASE = '/artikel'
const CATEGORY_BASE = '/artikel-kategori'

export const blogService = {
  // ── Public Endpoints (Unauthenticated) ──
  getPublicArticles: async (params = {}) => {
    return await apiService.get(PUBLIC_BASE, { params })
  },

  getPublicArticleBySlug: async (slug, params = {}) => {
    return await apiService.get(`${PUBLIC_BASE}/${encodeURIComponent(slug)}`, { params })
  },

  getPublicCategories: async (params = {}) => {
    return await apiService.get(`${PUBLIC_BASE}/categories`, { params })
  },

  // ── Internal / CMS Endpoints (Authenticated & Tenant Scoped) ──
  getAll: async (params = {}) => {
    return await apiService.get(CMS_BASE, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${CMS_BASE}/${id}`)
  },

  create: async (payload) => {
    return await apiService.post(CMS_BASE, payload)
  },

  update: async (id, payload) => {
    return await apiService.put(`${CMS_BASE}/${id}`, payload)
  },

  delete: async (id) => {
    return await apiService.delete(`${CMS_BASE}/${id}`)
  },

  submit: async (id) => {
    return await apiService.post(`${CMS_BASE}/${id}/submit`)
  },

  approve: async (id) => {
    return await apiService.post(`${CMS_BASE}/${id}/approve`)
  },

  reject: async (id, rejectionNote) => {
    return await apiService.post(`${CMS_BASE}/${id}/reject`, {
      rejection_note: rejectionNote,
    })
  },

  archive: async (id) => {
    return await apiService.post(`${CMS_BASE}/${id}/archive`)
  },

  // ── Category Management ──
  getCategories: async (params = {}) => {
    return await apiService.get(CATEGORY_BASE, { params })
  },

  createCategory: async (payload) => {
    return await apiService.post(CATEGORY_BASE, payload)
  },

  updateCategory: async (id, payload) => {
    return await apiService.put(`${CATEGORY_BASE}/${id}`, payload)
  },

  deleteCategory: async (id) => {
    return await apiService.delete(`${CATEGORY_BASE}/${id}`)
  },
}

export default blogService
