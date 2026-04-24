import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Shield, Key, Search, ChevronRight, Users } from 'lucide-react'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import Input from '../../../components/ui/Input'
import { roleService, permissionService } from '../services/rolesService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const RolesForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [permissionSearch, setPermissionSearch] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    code: '',
  })

  const [errors, setErrors] = useState({})
  const [allPermissions, setAllPermissions] = useState([])
  const [selectedPermissions, setSelectedPermissions] = useState([])

  useEffect(() => {
    fetchAllPermissions()
    if (isEditMode) {
      fetchRole()
    }
  }, [id])

  const fetchAllPermissions = async () => {
    const { data } = await permissionService.getAll({ per_page: 1000 })
    if (data) {
      setAllPermissions(data.data || [])
    }
  }

  const fetchRole = async () => {
    setFetchingData(true)
    const { data, error } = await roleService.getById(id)
    if (data) {
      const role = data.data
      setFormData({
        name: role.name || '',
        code: role.code || '',
      })
      if (role.permissions && Array.isArray(role.permissions)) {
        setSelectedPermissions(role.permissions.map(p => p.id || p))
      }
    } else {
      showError('Gagal mengambil data role')
      navigate('/admin/roles')
    }
    setFetchingData(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const handleSelectAll = () => {
    if (selectedPermissions.length === allPermissions.length) {
      setSelectedPermissions([])
    } else {
      setSelectedPermissions(allPermissions.map(p => p.id))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Nama role wajib diisi'
    if (!isEditMode && !formData.code.trim()) newErrors.code = 'Code role wajib diisi'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)

    const submitData = {
      name: formData.name,
      ...(formData.code.trim() && { code: formData.code.trim() }),
    }

    let result
    if (isEditMode) {
      result = await roleService.update(id, submitData)
    } else {
      result = await roleService.create(submitData)
    }

    const { data, error } = result

    if (!error) {
      // Assign permissions after create/update
      const roleId = isEditMode ? id : data?.data?.id
      if (roleId) {
        await roleService.assignPermissions(roleId, selectedPermissions)
      }
      showSuccess(`Role berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/admin/roles')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} role`)
      }
    }
    setLoading(false)
  }

  const handleGroupToggle = (perms) => {
    const groupIds = perms.map(p => p.id)
    const allSelected = groupIds.every(id => selectedPermissions.includes(id))
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !groupIds.includes(id)))
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...groupIds])])
    }
  }

  // Group permissions by module field
  const groupedPermissions = useMemo(() => {
    const filtered = permissionSearch
      ? allPermissions.filter(p =>
          (p.name || '').toLowerCase().includes(permissionSearch.toLowerCase()) ||
          (p.code || '').toLowerCase().includes(permissionSearch.toLowerCase())
        )
      : allPermissions
    return filtered.reduce((groups, perm) => {
      const group = perm.module || (perm.code ? perm.code.split('.')[0] : null) || 'other'
      if (!groups[group]) groups[group] = []
      groups[group].push(perm)
      return groups
    }, {})
  }, [allPermissions, permissionSearch])

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        <button
          type="button"
          onClick={() => navigate('/admin/roles')}
          className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          Roles
        </button>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-900 dark:text-white font-medium">
          {isEditMode ? 'Edit Role' : 'Tambah Role Baru'}
        </span>
      </nav>

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl shrink-0">
            <Shield size={22} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? 'Edit Role' : 'Tambah Role Baru'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {isEditMode
                ? 'Perbarui informasi dan hak akses role ini'
                : 'Buat role baru dan atur hak akses yang sesuai'}
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/admin/roles')}>
          <ArrowLeft size={15} className="mr-1.5" />
          Kembali
        </Button>
      </div>

      {fetchingData ? (
        /* Skeleton loading */
        <div className="space-y-4 animate-pulse">
          <div className="card !p-0 overflow-hidden">
            <div className="px-6 py-4 bg-gray-100 dark:bg-gray-700/50 h-16 rounded-t-lg" />
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="card !p-0 overflow-hidden">
            <div className="px-6 py-4 bg-gray-100 dark:bg-gray-700/50 h-16 rounded-t-lg" />
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700/50 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Info Card */}
          <div className="card !p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-gray-500 dark:text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Informasi Role</h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-5">Nama dan kode identifikasi unik untuk role ini</p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nama Role <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Masukkan nama role"
                  error={errors.name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Code Role {!isEditMode && <span className="text-red-500">*</span>}
                </label>
                <Input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder={isEditMode ? 'Kosongkan untuk tidak mengubah' : 'contoh: kepala-sekolah'}
                  error={errors.code}
                  disabled={isEditMode}
                />
                {!isEditMode && (
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    Identifier unik, hanya huruf kecil dan tanda hubung. Otomatis diisi dari nama jika dikosongkan.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Permissions Card */}
          <div className="card !p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Key size={15} className="text-primary-600 dark:text-primary-400" />
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Permissions</h2>
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                      {selectedPermissions.length} / {allPermissions.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-5">Pilih hak akses yang diizinkan untuk role ini</p>
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={handleSelectAll}>
                  {selectedPermissions.length === allPermissions.length ? 'Hapus Semua' : 'Pilih Semua'}
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari permission..."
                  value={permissionSearch}
                  onChange={e => setPermissionSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                />
              </div>

              {/* Permission Groups */}
              {Object.keys(groupedPermissions).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(groupedPermissions)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([group, perms]) => {
                      const groupIds = perms.map(p => p.id)
                      const selectedCount = groupIds.filter(id => selectedPermissions.includes(id)).length
                      const allSelected = selectedCount === groupIds.length
                      const someSelected = selectedCount > 0 && !allSelected

                      return (
                        <div key={group} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                          {/* Group header */}
                          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700/50">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <button
                                type="button"
                                onClick={() => handleGroupToggle(perms)}
                                aria-label={`Toggle all permissions in ${group}`}
                                className={`w-[18px] h-[18px] rounded flex items-center justify-center shrink-0 border transition-colors ${
                                  allSelected
                                    ? 'bg-primary-600 border-primary-600'
                                    : someSelected
                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-400'
                                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500'
                                }`}
                              >
                                {allSelected && (
                                  <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none" stroke="white" strokeWidth="2">
                                    <path d="M1 4l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                                {someSelected && (
                                  <div className="w-2 h-0.5 bg-primary-600 rounded" />
                                )}
                              </button>
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">{group}</span>
                            </label>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              allSelected
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                : someSelected
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}>
                              {selectedCount}/{perms.length}
                            </span>
                          </div>
                          {/* Permission items */}
                          <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                            {perms.map(perm => (
                              <label
                                key={perm.id}
                                className={`flex items-start gap-2 cursor-pointer p-2.5 rounded-lg transition-colors ${
                                  selectedPermissions.includes(perm.id)
                                    ? 'bg-primary-50 dark:bg-primary-900/20'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPermissions.includes(perm.id)}
                                  onChange={() => handlePermissionToggle(perm.id)}
                                  className="mt-0.5 w-4 h-4 shrink-0 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300 leading-tight min-w-0">
                                  {perm.name}
                                  {perm.code && (
                                    <span className="block text-xs text-gray-400 dark:text-gray-500 font-mono truncate">{perm.code}</span>
                                  )}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-14">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Key size={20} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {permissionSearch ? 'Tidak ada permission ditemukan' : 'Tidak ada permission tersedia'}
                  </p>
                  {permissionSearch && (
                    <button
                      type="button"
                      onClick={() => setPermissionSearch('')}
                      className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Hapus pencarian
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-4">
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/roles')}>
              Batal
            </Button>
            <PermissionGuard permission={isEditMode ? 'roles.edit' : 'roles.create'}>
              <Button type="submit" disabled={loading} loading={loading}>
                {!loading && <Save size={16} className="mr-1.5" />}
                {loading ? 'Menyimpan...' : isEditMode ? 'Perbarui Role' : 'Simpan Role'}
              </Button>
            </PermissionGuard>
          </div>
        </form>
      )}
    </div>
  )
}

export default RolesForm