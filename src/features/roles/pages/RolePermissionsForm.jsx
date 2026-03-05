import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { rolePermissionService, roleService, permissionService } from '../services/rolesService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const RolePermissionsForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  const [fetchingData, setFetchingData] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    role_id: '',
    permission_id: '',
  })
  const [errors, setErrors] = useState({})
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])

  useEffect(() => {
    fetchRolesAndPermissions()
    if (isEditMode) {
      fetchRolePermission()
    }
  }, [id])

  const fetchRolesAndPermissions = async () => {
    const [rolesRes, permsRes] = await Promise.all([
      roleService.getAll({ per_page: 1000 }),
      permissionService.getAll({ per_page: 1000 })
    ])
    
    if (rolesRes.data) {
      setRoles(rolesRes.data.data || [])
    }
    if (permsRes.data) {
      setPermissions(permsRes.data.data || [])
    }
  }

  const fetchRolePermission = async () => {
    setFetchingData(true)
    const { data, error } = await rolePermissionService.getById(id)
    if (data) {
      const rolePermission = data.data
      setFormData({
        role_id: rolePermission.role_id || '',
        permission_id: rolePermission.permission_id || '',
      })
    } else {
      showError('Gagal mengambil data role permission')
      navigate('/admin/role-permissions')
    }
    setFetchingData(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.role_id) newErrors.role_id = 'Role wajib dipilih'
    if (!formData.permission_id) newErrors.permission_id = 'Permission wajib dipilih'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setSubmitting(true)

    const submitData = {
      role_id: Number(formData.role_id),
      permission_id: Number(formData.permission_id),
    }

    let result
    if (isEditMode) {
      result = await rolePermissionService.update(id, submitData)
    } else {
      result = await rolePermissionService.create(submitData)
    }

    const { data, error } = result
    setSubmitting(false)

    if (!error) {
      showSuccess(`Role permission berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/admin/role-permissions')
    } else {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {fetchingData ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6">
                {/* Role Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Pilih Role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  {errors.role_id && <p className="mt-1 text-sm text-red-500">{errors.role_id}</p>}
                </div>

                {/* Permission Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Permission <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="permission_id"
                    value={formData.permission_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Pilih Permission</option>
                    {permissions.map(permission => (
                      <option key={permission.id} value={permission.id}>
                        {permission.name}
                      </option>
                    ))}
                  </select>
                  {errors.permission_id && <p className="mt-1 text-sm text-red-500">{errors.permission_id}</p>}
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
      </div>
    </div>
  )
}

export default RolePermissionsForm