import { apiService } from '../../../utils/api'

const ROLE_BASE_URL = '/admin/roles'
const ROLE_LIST_URL = '/admin/roles/'
const PERMISSION_BASE_URL = '/admin/permissions'
const PERMISSION_LIST_URL = '/admin/permissions/'
const ROLE_PERMISSION_BASE_URL = '/admin/role-permissions'
const ROLE_PERMISSION_LIST_URL = '/admin/role-permissions/'

export const roleService = {
  getAll: async (params = {}) => {
    return await apiService.get(ROLE_LIST_URL, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${ROLE_BASE_URL}/${id}`)
  },

  create: async (data) => {
    return await apiService.post(ROLE_BASE_URL, data)
  },

  update: async (id, data) => {
    return await apiService.put(`${ROLE_BASE_URL}/${id}`, data)
  },

  delete: async (id) => {
    return await apiService.delete(`${ROLE_BASE_URL}/${id}`)
  },

  getPermissions: async (id) => {
    return await apiService.get(`${ROLE_BASE_URL}/${id}/permissions`)
  },

  assignPermissions: async (id, permissions) => {
    return await apiService.post(`${ROLE_BASE_URL}/${id}/assign-permissions`, { permissions })
  },
}

export const permissionService = {
  getAll: async (params = {}) => {
    return await apiService.get(PERMISSION_LIST_URL, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${PERMISSION_BASE_URL}/${id}`)
  },

  create: async (data) => {
    return await apiService.post(PERMISSION_BASE_URL, data)
  },

  update: async (id, data) => {
    return await apiService.put(`${PERMISSION_BASE_URL}/${id}`, data)
  },

  delete: async (id) => {
    return await apiService.delete(`${PERMISSION_BASE_URL}/${id}`)
  },
}

export const rolePermissionService = {
  getAll: async (params = {}) => {
    return await apiService.get(ROLE_PERMISSION_LIST_URL, { params })
  },

  getById: async (id) => {
    return await apiService.get(`${ROLE_PERMISSION_BASE_URL}/${id}`)
  },

  create: async (data) => {
    return await apiService.post(ROLE_PERMISSION_BASE_URL, data)
  },

  update: async (id, data) => {
    return await apiService.put(`${ROLE_PERMISSION_BASE_URL}/${id}`, data)
  },

  delete: async (id) => {
    return await apiService.delete(`${ROLE_PERMISSION_BASE_URL}/${id}`)
  },
}

export default { roleService, permissionService, rolePermissionService }