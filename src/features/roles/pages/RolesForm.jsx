import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
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

  // Group permissions by module field
  const groupedPermissions = allPermissions.reduce((groups, perm) => {
    const group = perm.module || (perm.code ? perm.code.split('.')[0] : null) || 'other'
    if (!groups[group]) groups[group] = []
    groups[group].push(perm)
    return groups
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/admin/roles')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Role' : 'Tambah Role Baru'}
        </h1>
      </div>

      <Card>
        {fetchingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Identifier unik role, hanya huruf kecil dan tanda hubung (akan otomatis diisi dari nama jika dikosongkan)
                  </p>
                )}
              </div>

            </div>

            {/* Permissions Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Permissions ({selectedPermissions.length}/{allPermissions.length})
                </h3>
                <Button type="button" variant="secondary" onClick={handleSelectAll}>
                  {selectedPermissions.length === allPermissions.length ? 'Hapus Semua' : 'Pilih Semua'}
                </Button>
              </div>

              {Object.keys(groupedPermissions).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).sort(([a], [b]) => a.localeCompare(b)).map(([group, perms]) => (
                    <div key={group} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 capitalize">{group}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {perms.map(perm => (
                          <label key={perm.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm.id)}
                              onChange={() => handlePermissionToggle(perm.id)}
                              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                              {perm.name}
                              {perm.code && <span className="block text-xs text-gray-400 dark:text-gray-500">{perm.code}</span>}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Tidak ada permission tersedia.</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/admin/roles')}>
                Batal
              </Button>
              <PermissionGuard permission={isEditMode ? 'roles.edit' : 'roles.create'}>
                <Button type="submit" disabled={loading}>
                  <Save size={18} className="mr-2" />
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </PermissionGuard>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}

export default RolesForm