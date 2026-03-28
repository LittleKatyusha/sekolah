import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight, Search } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { rolePermissionService, roleService, permissionService } from '../services/rolesService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const normalizePermissionIds = (rolePermission) => {
  if (Array.isArray(rolePermission?.permission_ids)) {
    return rolePermission.permission_ids.map((id) => Number(id)).filter(Boolean)
  }

  if (Array.isArray(rolePermission?.permissions)) {
    return rolePermission.permissions
      .map((permission) => Number(permission?.id ?? permission))
      .filter(Boolean)
  }

  if (rolePermission?.permission_id) {
    return [Number(rolePermission.permission_id)].filter(Boolean)
  }

  return []
}

const formatModuleName = (moduleName) => {
  if (!moduleName) return 'other'
  return moduleName.replace(/-/g, ' ')
}

const normalizeRolePermissions = (responseData) => {
  const candidates = [
    responseData?.data?.permissions,
    responseData?.data,
    responseData?.permissions,
    responseData,
  ]

  const permissionList = candidates.find((candidate) => Array.isArray(candidate)) || []

  return permissionList
    .map((permission) => Number(permission?.id ?? permission?.permission_id ?? permission))
    .filter(Boolean)
}

const mapApiErrorsToFormErrors = (apiErrors = {}) => {
  const mapped = { ...apiErrors }

  if (apiErrors.sys_role_id && !mapped.role_id) {
    mapped.role_id = Array.isArray(apiErrors.sys_role_id) ? apiErrors.sys_role_id[0] : apiErrors.sys_role_id
  }

  if (apiErrors.sys_permission_id && !mapped.permission_ids) {
    mapped.permission_ids = Array.isArray(apiErrors.sys_permission_id)
      ? apiErrors.sys_permission_id[0]
      : apiErrors.sys_permission_id
  }

  if (Array.isArray(mapped.role_id)) mapped.role_id = mapped.role_id[0]
  if (Array.isArray(mapped.permission_ids)) mapped.permission_ids = mapped.permission_ids[0]

  return mapped
}

const dedupePermissionsById = (permissionList = []) => {
  const seen = new Set()

  return permissionList.filter((permission) => {
    const id = Number(permission?.id ?? permission?.permission_id ?? permission)
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

const normalizePermissionRecords = (responseData) => {
  const candidates = [
    responseData?.data?.permissions,
    responseData?.data,
    responseData?.permissions,
    responseData,
  ]

  const permissionList = candidates.find((candidate) => Array.isArray(candidate)) || []

  return dedupePermissionsById(
    permissionList
      .map((permission) => {
        if (permission && typeof permission === 'object') {
          const id = Number(permission.id ?? permission.permission_id)
          if (!id) return null

          return {
            ...permission,
            id,
            name: permission.name || permission.slug || `Permission #${id}`,
            module: permission.module || 'other',
          }
        }

        const id = Number(permission)
        return id
          ? {
              id,
              name: `Permission #${id}`,
              module: 'other',
            }
          : null
      })
      .filter(Boolean)
  )
}

const RolePermissionsForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  const [fetchingData, setFetchingData] = useState(false)
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    role_id: '',
    permission_ids: [],
  })
  const [errors, setErrors] = useState({})
  const [selectedRoleOption, setSelectedRoleOption] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [selectedPermissionOptions, setSelectedPermissionOptions] = useState([])
  const [expandedModules, setExpandedModules] = useState({})
  const [permissionSearch, setPermissionSearch] = useState('')

  const mergedPermissions = useMemo(() => {
    return dedupePermissionsById([...selectedPermissionOptions, ...permissions])
  }, [permissions, selectedPermissionOptions])

  const groupedPermissions = useMemo(() => {
    const keyword = permissionSearch.trim().toLowerCase()

    const filteredPermissions = keyword
      ? mergedPermissions.filter((permission) =>
          [permission.name, permission.slug, permission.description, permission.module]
            .some((value) => String(value || '').toLowerCase().includes(keyword))
        )
      : mergedPermissions

    return filteredPermissions.reduce((groups, permission) => {
      const moduleName = permission.module || 'other'
      if (!groups[moduleName]) groups[moduleName] = []
      groups[moduleName].push(permission)
      return groups
    }, {})
  }, [mergedPermissions, permissionSearch])

  const sortedModules = useMemo(() => {
    return Object.entries(groupedPermissions).sort(([a], [b]) => a.localeCompare(b))
  }, [groupedPermissions])

  const buildRoleOption = useCallback((role) => ({
    value: String(role.id),
    label: role.name || `Role #${role.id}`,
  }), [])

  const searchRoleOptions = useCallback(async (keyword = '') => {
    const { data } = await roleService.getAll({
      search: keyword || undefined,
      per_page: 20,
    })

    const roleList = data?.data || []
    return roleList.map(buildRoleOption)
  }, [buildRoleOption])

  const hydrateSelectedRoleOption = useCallback(async (roleId) => {
    if (!roleId) {
      setSelectedRoleOption(null)
      return
    }

    const { data } = await roleService.getById(roleId)
    const role = data?.data

    if (role) {
      setSelectedRoleOption(buildRoleOption(role))
    }
  }, [buildRoleOption])

  const hydratePermissionDetails = useCallback(async (permissionIds = [], fallbackPermissions = []) => {
    if (permissionIds.length === 0) {
      setSelectedPermissionOptions([])
      return
    }

    const fallbackMap = new Map(
      dedupePermissionsById(fallbackPermissions).map((permission) => [Number(permission.id), permission])
    )

    // Check if all IDs are already covered by the fallback records
    const missingIds = permissionIds.filter((id) => !fallbackMap.has(Number(id)))

    if (missingIds.length === 0) {
      const hydrated = permissionIds.map((id) => fallbackMap.get(Number(id))).filter(Boolean)
      setSelectedPermissionOptions(dedupePermissionsById(hydrated))
      return
    }

    // Bulk fetch: load all permissions in one request, then filter by IDs needed.
    // This replaces the previous N individual getById() calls.
    const { data } = await permissionService.getAll({ per_page: 'all' })
    const allPermissions = data?.data || []
    const bulkMap = new Map(allPermissions.map((p) => [Number(p.id), p]))

    // Merge: prefer bulk data, fall back to fallback records, then create placeholder
    const hydrated = permissionIds.map((permissionId) => {
      const id = Number(permissionId)
      const source = bulkMap.get(id) || fallbackMap.get(id)
      if (source) {
        return {
          ...source,
          id,
          name: source.name || source.slug || `Permission #${id}`,
          module: source.module || 'other',
        }
      }
      return { id, name: `Permission #${id}`, module: 'other' }
    })

    setSelectedPermissionOptions(dedupePermissionsById(hydrated.filter(Boolean)))
  }, [])

  const fetchRolePermission = useCallback(async () => {
    setFetchingData(true)
    const { data } = await rolePermissionService.getById(id)
    if (data) {
      const rolePermission = data.data
      const selectedRoleId = rolePermission.role_id ? Number(rolePermission.role_id) : null

      if (selectedRoleId) {
        const { data: rolePermissionsData } = await roleService.getPermissions(selectedRoleId)
        const existingPermissionIds = normalizeRolePermissions(rolePermissionsData)
        const existingPermissionRecords = normalizePermissionRecords(rolePermissionsData)

        setFormData({
          role_id: String(selectedRoleId),
          permission_ids: existingPermissionIds,
        })
        setSelectedRoleOption({
          value: String(selectedRoleId),
          label: rolePermission.role?.name || rolePermission.role_name || `Role #${selectedRoleId}`,
        })
        await hydratePermissionDetails(existingPermissionIds, existingPermissionRecords)
      } else {
        const existingPermissionIds = normalizePermissionIds(rolePermission)
        const existingPermissionRecords = normalizePermissionRecords(rolePermission)

        setFormData({
          role_id: '',
          permission_ids: existingPermissionIds,
        })
        await hydratePermissionDetails(existingPermissionIds, existingPermissionRecords)
      }
    } else {
      showError('Gagal mengambil data role permission')
      navigate('/admin/role-permissions')
    }
    setFetchingData(false)
  }, [hydratePermissionDetails, id, navigate])

  const fetchRolePermissionsByRoleId = useCallback(async (roleId) => {
    if (!roleId) return

    setLoadingRolePermissions(true)
    const { data, error } = await roleService.getPermissions(roleId)

    if (data) {
      const permissionIds = normalizeRolePermissions(data)
      const permissionRecords = normalizePermissionRecords(data)

      setFormData((prev) => ({
        ...prev,
        permission_ids: permissionIds,
      }))
      await hydratePermissionDetails(permissionIds, permissionRecords)
      setErrors((prev) => ({ ...prev, permission_ids: '' }))
    } else if (error) {
      showError('Gagal mengambil permission dari role terpilih')
    }

    setLoadingRolePermissions(false)
  }, [hydratePermissionDetails])

  useEffect(() => {
    if (isEditMode) {
      fetchRolePermission()
    }
  }, [fetchRolePermission, isEditMode])

  useEffect(() => {
    hydrateSelectedRoleOption(formData.role_id)
  }, [formData.role_id, hydrateSelectedRoleOption])

  // Fetch ALL permissions once on mount — client-side search handles filtering
  // so we avoid re-fetching 9999 records on every keystroke.
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await permissionService.getAll({ per_page: 'all' })
      if (mounted) setPermissions(dedupePermissionsById(data?.data || []))
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (sortedModules.length === 0) return
    setExpandedModules((prev) => {
      const next = { ...prev }
      sortedModules.forEach(([moduleName]) => {
        if (typeof next[moduleName] === 'undefined') {
          next[moduleName] = true
        }
      })
      return next
    })
  }, [sortedModules])

  const handleRoleChange = async (e) => {
    const { value } = e.target

    setFormData((prev) => ({
      ...prev,
      role_id: value,
      permission_ids: [],
    }))
    setSelectedPermissionOptions([])

    if (errors.role_id || errors.permission_ids) {
      setErrors((prev) => ({ ...prev, role_id: '', permission_ids: '' }))
    }

    if (value) {
      await fetchRolePermissionsByRoleId(Number(value))
    }
  }

  const handlePermissionToggle = (permissionId) => {
    setFormData((prev) => {
      const exists = prev.permission_ids.includes(permissionId)
      const nextPermissionIds = exists
        ? prev.permission_ids.filter((id) => id !== permissionId)
        : [...prev.permission_ids, permissionId]

      return { ...prev, permission_ids: nextPermissionIds }
    })

    if (errors.permission_ids) {
      setErrors((prev) => ({ ...prev, permission_ids: '' }))
    }
  }

  const handleModuleSelectAll = (modulePermissionIds, checked) => {
    setFormData((prev) => {
      let nextPermissionIds = [...prev.permission_ids]

      if (checked) {
        const idSet = new Set(nextPermissionIds)
        modulePermissionIds.forEach((permissionId) => idSet.add(permissionId))
        nextPermissionIds = Array.from(idSet)
      } else {
        const moduleSet = new Set(modulePermissionIds)
        nextPermissionIds = nextPermissionIds.filter((permissionId) => !moduleSet.has(permissionId))
      }

      return { ...prev, permission_ids: nextPermissionIds }
    })

    if (errors.permission_ids) {
      setErrors((prev) => ({ ...prev, permission_ids: '' }))
    }
  }

  const toggleModuleExpand = (moduleName) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.role_id) newErrors.role_id = 'Role wajib dipilih'
    if (!formData.permission_ids.length) newErrors.permission_ids = 'Minimal satu permission wajib dipilih'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setSubmitting(true)

    const selectedRoleId = Number(formData.role_id)
    const selectedPermissionIds = formData.permission_ids.map((permissionId) => Number(permissionId))

    const result = await roleService.assignPermissions(selectedRoleId, selectedPermissionIds)
    const { error } = result
    setSubmitting(false)

    if (!error) {
      showSuccess(`Role permission berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/admin/role-permissions')
    } else {
      if (error?.errors) {
        setErrors(mapApiErrorsToFormErrors(error.errors))
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} role permission`)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/admin/role-permissions')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Role Permission' : 'Assign Permission to Role'}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {fetchingData ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleRoleChange}
                    options={selectedRoleOption ? [selectedRoleOption] : []}
                    loadOptions={searchRoleOptions}
                    placeholder="Pilih Role"
                    searchPlaceholder="Cari role..."
                    noOptionsText="Tidak ada role yang cocok"
                    error={errors.role_id}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Permissions <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.permission_ids.length}/{mergedPermissions.length} dipilih
                    </span>
                  </div>

                  <div className="relative mb-3">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                      placeholder="Cari permission, modul, slug, atau deskripsi..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {loadingRolePermissions ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      Memuat permission berdasarkan role terpilih...
                    </div>
                  ) : null}

                  {sortedModules.length > 0 ? (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {sortedModules.map(([moduleName, modulePermissions]) => {
                        const modulePermissionIds = modulePermissions.map((permission) => permission.id)
                        const selectedCount = modulePermissionIds.filter((permissionId) =>
                          formData.permission_ids.includes(permissionId)
                        ).length
                        const allSelected = modulePermissionIds.length > 0 && selectedCount === modulePermissionIds.length
                        const isIndeterminate = selectedCount > 0 && !allSelected
                        const isExpanded = expandedModules[moduleName] ?? true

                        return (
                          <div
                            key={moduleName}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                          >
                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700">
                              <div className="flex items-center justify-between gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleModuleExpand(moduleName)}
                                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100"
                                >
                                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                  <span className="capitalize">{formatModuleName(moduleName)}</span>
                                  <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                                    ({selectedCount}/{modulePermissions.length})
                                  </span>
                                </button>

                                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(el) => {
                                      if (el) el.indeterminate = isIndeterminate
                                    }}
                                    onChange={(e) => handleModuleSelectAll(modulePermissionIds, e.target.checked)}
                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                  />
                                  <span>Select All</span>
                                </label>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {modulePermissions.map((permission) => (
                                  <label
                                    key={permission.id}
                                    className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={formData.permission_ids.includes(permission.id)}
                                      onChange={() => handlePermissionToggle(permission.id)}
                                      className="mt-0.5 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {permission.name}
                                      {permission.description ? (
                                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                                          {permission.description}
                                        </span>
                                      ) : null}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {permissionSearch.trim()
                        ? 'Tidak ada permission yang cocok dengan pencarian.'
                        : 'Tidak ada permission tersedia.'}
                    </p>
                  )}

                  {errors.permission_ids && <p className="mt-1 text-sm text-red-500">{errors.permission_ids}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button type="button" variant="secondary" onClick={() => navigate('/admin/role-permissions')}>
                  Batal
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Menyimpan...' : isEditMode ? 'Update' : 'Simpan'}
                </Button>
              </div>
            </>
          )}
        </form>
      </Card>
    </div>
  )
}

export default RolePermissionsForm