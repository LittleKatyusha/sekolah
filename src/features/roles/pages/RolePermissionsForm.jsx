import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Search,
  ShieldCheck,
} from 'lucide-react'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
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

  const selectedRoleLabel = useMemo(() => {
    if (selectedRoleOption?.label) return selectedRoleOption.label
    if (formData.role_id) return `Role #${formData.role_id}`
    return 'Belum ada role dipilih'
  }, [formData.role_id, selectedRoleOption])

  const visiblePermissionCount = useMemo(() => {
    return sortedModules.reduce((total, [, modulePermissions]) => total + modulePermissions.length, 0)
  }, [sortedModules])

  const selectedModuleCount = useMemo(() => {
    return sortedModules.filter(([, modulePermissions]) => (
      modulePermissions.some((permission) => formData.permission_ids.includes(permission.id))
    )).length
  }, [formData.permission_ids, sortedModules])

  const selectionProgress = useMemo(() => {
    if (!mergedPermissions.length) return 0
    return Math.round((formData.permission_ids.length / mergedPermissions.length) * 100)
  }, [formData.permission_ids.length, mergedPermissions.length])

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

  const setAllModulesExpanded = (expanded) => {
    setExpandedModules((prev) => {
      const next = { ...prev }
      sortedModules.forEach(([moduleName]) => {
        next[moduleName] = expanded
      })
      return next
    })
  }

  const clearSelectedPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: [],
    }))

    if (errors.permission_ids) {
      setErrors((prev) => ({ ...prev, permission_ids: '' }))
    }
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
      <Card className="overflow-hidden p-0">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-slate-800 px-6 py-6 text-white sm:px-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)] lg:block" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <Button variant="secondary" className="border border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => navigate('/admin/role-permissions')}>
                <ArrowLeft size={18} className="mr-2" />
                Kembali ke daftar
              </Button>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/80">
                  <ShieldCheck size={14} />
                  {isEditMode ? 'Edit akses role' : 'Role permission builder'}
                </div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {isEditMode ? 'Perbarui konfigurasi permission role' : 'Buat assignment permission yang lebih terstruktur'}
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-white/75 sm:text-base">
                  Pilih role, tinjau permission yang tersedia per modul, lalu simpan konfigurasi akses dengan tampilan yang lebih mudah dipindai.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[430px]">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/10 p-2">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Role</p>
                    <p className="mt-1 text-sm font-semibold text-white">{selectedRoleLabel}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/10 p-2">
                    <CheckSquare size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Dipilih</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formData.permission_ids.length} dari {mergedPermissions.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/10 p-2">
                    <BadgeCheck size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Cakupan modul</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {selectedModuleCount}/{sortedModules.length || 0} modul aktif
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {fetchingData ? (
          <Card className="py-12">
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-200 border-b-primary-600"></div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Memuat konfigurasi role permission</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Menyiapkan data role dan permission yang tersimpan.</p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-6">
                <Card className="p-0 overflow-hidden">
                  <div className="border-b border-gray-200 bg-gray-50/80 px-6 py-5 dark:border-gray-700 dark:bg-gray-900/30">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-primary-100 p-3 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pilih role tujuan</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Role yang dipilih akan menjadi dasar assignment permission yang akan disimpan.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Role <span className="text-red-500">*</span>
                      </label>
                      <SearchableSelect
                        name="role_id"
                        value={formData.role_id}
                        onChange={handleRoleChange}
                        options={selectedRoleOption ? [selectedRoleOption] : []}
                        loadOptions={searchRoleOptions}
                        placeholder="Pilih role yang akan dikonfigurasi"
                        searchPlaceholder="Cari role..."
                        noOptionsText="Tidak ada role yang cocok"
                        error={errors.role_id}
                      />
                    </div>

                    <div className="grid gap-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/20 dark:text-gray-300 md:grid-cols-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Mode</p>
                        <p className="mt-1">{isEditMode ? 'Mengubah assignment yang sudah ada' : 'Membuat assignment baru'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Role aktif</p>
                        <p className="mt-1">{selectedRoleLabel}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Status sinkronisasi</p>
                        <p className="mt-1">{loadingRolePermissions ? 'Memuat permission bawaan role...' : 'Siap untuk ditinjau dan disimpan'}</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-0 overflow-hidden">
                  <div className="border-b border-gray-200 bg-gray-50/80 px-6 py-5 dark:border-gray-700 dark:bg-gray-900/30">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-primary-100 p-3 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                          <ShieldCheck size={18} />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Kelola permission per modul</h2>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Cari permission, buka modul yang relevan, lalu pilih akses yang ingin diberikan ke role.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAllModulesExpanded(true)}
                          className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-white dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          Buka semua
                        </button>
                        <button
                          type="button"
                          onClick={() => setAllModulesExpanded(false)}
                          className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-white dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          Tutup semua
                        </button>
                        <button
                          type="button"
                          onClick={clearSelectedPermissions}
                          className="inline-flex items-center rounded-lg border border-transparent bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
                        >
                          Reset pilihan
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 p-6">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          value={permissionSearch}
                          onChange={(e) => setPermissionSearch(e.target.value)}
                          placeholder="Cari permission, modul, slug, atau deskripsi..."
                          className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-900/30">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Ringkasan pencarian</p>
                        <p className="mt-2 font-semibold text-gray-900 dark:text-white">{visiblePermissionCount} permission terlihat</p>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">Dalam {sortedModules.length} modul yang sesuai filter</p>
                      </div>
                    </div>

                    {loadingRolePermissions ? (
                      <div className="flex items-center gap-2 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700 dark:border-primary-900/40 dark:bg-primary-900/20 dark:text-primary-200">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-200 border-b-primary-600"></div>
                        Memuat permission berdasarkan role terpilih...
                      </div>
                    ) : null}

                    {sortedModules.length > 0 ? (
                      <div className="space-y-4 max-h-[720px] overflow-y-auto pr-1">
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
                              className={[
                                'overflow-hidden rounded-2xl border transition',
                                selectedCount > 0
                                  ? 'border-primary-200 bg-primary-50/40 shadow-sm dark:border-primary-900/40 dark:bg-primary-900/10'
                                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800/60',
                              ].join(' ')}
                            >
                              <div className="border-b border-inherit px-5 py-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                  <button
                                    type="button"
                                    onClick={() => toggleModuleExpand(moduleName)}
                                    className="inline-flex items-center gap-3 text-left"
                                  >
                                    <span className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-300">
                                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </span>
                                    <span>
                                      <span className="block text-sm font-semibold capitalize text-gray-900 dark:text-gray-100">
                                        {formatModuleName(moduleName)}
                                      </span>
                                      <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                                        {selectedCount} dari {modulePermissions.length} permission dipilih
                                      </span>
                                    </span>
                                  </button>

                                  <label className="inline-flex items-center gap-2 self-start rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
                                    <input
                                      type="checkbox"
                                      checked={allSelected}
                                      ref={(el) => {
                                        if (el) el.indeterminate = isIndeterminate
                                      }}
                                      onChange={(e) => handleModuleSelectAll(modulePermissionIds, e.target.checked)}
                                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span>Pilih semua modul ini</span>
                                  </label>
                                </div>
                              </div>

                              {isExpanded && (
                                <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-2">
                                  {modulePermissions.map((permission) => {
                                    const isSelected = formData.permission_ids.includes(permission.id)

                                    return (
                                      <label
                                        key={permission.id}
                                        className={[
                                          'group flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition',
                                          isSelected
                                            ? 'border-primary-200 bg-white shadow-sm dark:border-primary-900/50 dark:bg-gray-900/60'
                                            : 'border-gray-200 bg-gray-50/80 hover:border-gray-300 hover:bg-white dark:border-gray-700 dark:bg-gray-900/30 dark:hover:bg-gray-900/60',
                                        ].join(' ')}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => handlePermissionToggle(permission.id)}
                                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />

                                        <span className="min-w-0 flex-1">
                                          <span className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                              {permission.name}
                                            </span>
                                            {permission.slug ? (
                                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                                {permission.slug}
                                              </span>
                                            ) : null}
                                          </span>
                                          {permission.description ? (
                                            <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                                              {permission.description}
                                            </span>
                                          ) : (
                                            <span className="mt-1 block text-xs leading-5 text-gray-400 dark:text-gray-500">
                                              Permission ini belum memiliki deskripsi tambahan.
                                            </span>
                                          )}
                                        </span>

                                        {isSelected ? (
                                          <span className="rounded-full bg-primary-100 p-1 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                                            <BadgeCheck size={16} />
                                          </span>
                                        ) : null}
                                      </label>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/80 px-6 py-12 text-center dark:border-gray-700 dark:bg-gray-900/20">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm dark:bg-gray-800 dark:text-gray-500">
                          <Search size={18} />
                        </div>
                        <p className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                          {permissionSearch.trim() ? 'Tidak ada permission yang cocok dengan pencarian.' : 'Tidak ada permission tersedia.'}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {permissionSearch.trim() ? 'Coba gunakan kata kunci lain atau kosongkan filter pencarian.' : 'Periksa data permission dari server lalu muat ulang halaman ini.'}
                        </p>
                      </div>
                    )}

                    {errors.permission_ids && <p className="text-sm text-red-500">{errors.permission_ids}</p>}
                  </div>
                </Card>
              </div>

              <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                <Card className="p-0 overflow-hidden">
                  <div className="border-b border-gray-200 bg-gray-50/80 px-5 py-4 dark:border-gray-700 dark:bg-gray-900/30">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Ringkasan assignment</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Pantau progres konfigurasi sebelum disimpan.</p>
                  </div>

                  <div className="space-y-5 p-5">
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Progress pemilihan</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{selectionProgress}%</span>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-700 transition-all"
                          style={{ width: `${selectionProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/20">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Role aktif</p>
                        <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{selectedRoleLabel}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Permission</p>
                          <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{formData.permission_ids.length}</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">dipilih</p>
                        </div>

                        <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-700">
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Modul</p>
                          <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{selectedModuleCount}</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">tercakup</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-0 overflow-hidden">
                  <div className="border-b border-gray-200 bg-gray-50/80 px-5 py-4 dark:border-gray-700 dark:bg-gray-900/30">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Aksi</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Selesaikan review lalu simpan perubahan.</p>
                  </div>

                  <div className="space-y-4 p-5">
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/20 dark:text-gray-300">
                      <p className="font-medium text-gray-900 dark:text-white">Checklist singkat</p>
                      <ul className="mt-3 space-y-2">
                        <li>Pastikan role yang dipilih sudah benar.</li>
                        <li>Tinjau modul penting seperti create, edit, dan delete.</li>
                        <li>Simpan setelah jumlah permission sesuai kebutuhan.</li>
                      </ul>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                      <Button type="button" variant="secondary" onClick={() => navigate('/admin/role-permissions')}>
                        Batal
                      </Button>
                      <PermissionGuard permission={isEditMode ? 'role-permissions.edit' : 'role-permissions.create'}>
                        <Button type="submit" disabled={submitting} loading={submitting}>
                          {submitting ? 'Menyimpan konfigurasi...' : isEditMode ? 'Simpan perubahan' : 'Simpan assignment'}
                        </Button>
                      </PermissionGuard>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  )
}

export default RolePermissionsForm