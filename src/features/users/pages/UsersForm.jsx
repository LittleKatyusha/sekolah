import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { usersService } from '../services/usersService'
import { roleService } from '../../roles/services/rolesService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { clearSessionCaches } from '../../../store/useAuthStore'

const UsersForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    is_active: true,
  })

  const [errors, setErrors] = useState({})
  const [roles, setRoles] = useState([])

  useEffect(() => {
    fetchRoles()
    if (isEditMode) {
      fetchUser()
    }
  }, [id])

  const fetchRoles = async () => {
    const { data, error } = await roleService.getAll({ per_page: 100 })
    if (error) {
      showError('Gagal mengambil daftar role')
      return
    }
    setRoles(data?.data || [])
  }

  const fetchUser = async () => {
    setLoading(true)
    const { data, error } = await usersService.getById(id)
    if (data) {
      const user = data.data
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // Don't show password
        role: String(user.role_id || user.role?.id || user.role || ''),
        is_active: user.is_active ?? true
      })
    } else {
      showError('Gagal mengambil data user')
      navigate('/admin/users')
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name) newErrors.name = 'Nama wajib diisi'
    if (!formData.email) {
      newErrors.email = 'Email wajib diisi'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid'
    }
    if (!isEditMode && !formData.password) {
      newErrors.password = 'Password wajib diisi'
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter'
    }
    if (!formData.role) newErrors.role = 'Role wajib dipilih'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    let result
    
    // Prepare data - exclude password if empty during edit
    const dataToSubmit = { ...formData, role: Number(formData.role) }
    if (isEditMode && !dataToSubmit.password) {
      delete dataToSubmit.password
    }
    
    if (isEditMode) {
      result = await usersService.update(id, dataToSubmit)
    } else {
      result = await usersService.create(dataToSubmit)
    }

    const { error } = result

    if (!error) {
      clearSessionCaches()
      showSuccess(`User berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/admin/users')
    } else {
      console.error(error)
      // Handle server-side validation errors
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} user`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/admin/users')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit User' : 'Tambah User Baru'}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nama Lengkap User"
                error={errors.name}
              />
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                error={errors.email}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isEditMode ? 'Kosongkan jika tidak ingin mengubah' : 'Password'}
                error={errors.password}
              />
              {isEditMode && (
                <p className="mt-1 text-xs text-gray-500">Kosongkan jika tidak ingin mengubah password</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Pilih role</option>
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-500">{errors.role}</p>}
            </div>

            {/* Status */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  User Aktif
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500">Jika tidak dicentang, user tidak akan dapat login</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/users')}>
              Batal
            </Button>
              <PermissionGuard permission={isEditMode ? 'users.update' : 'users.create'}>
              <Button type="submit" disabled={loading}>
                <Save size={18} className="mr-2" />
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </PermissionGuard>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default UsersForm
