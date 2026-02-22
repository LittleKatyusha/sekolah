import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, User, Mail, Shield, Calendar, ToggleRight } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { usersService } from '../services/usersService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

// Role options based on API response
const ROLE_OPTIONS = [
  { value: 1, label: 'Administrator', code: 'admin' },
  { value: 2, label: 'Guru', code: 'guru' },
  { value: 3, label: 'Staff', code: 'staff' },
]

// Get role label from role ID
const getRoleLabel = (roleValue, roles = []) => {
  if (roles && roles.length > 0) {
    return roles[0].name || 'Unknown'
  }
  const role = ROLE_OPTIONS.find(r => r.value === roleValue)
  return role ? role.label : 'Unknown'
}

// Get role badge color
const getRoleBadgeColor = (roleValue, roles = []) => {
  const roleCode = roles && roles.length > 0 ? roles[0].code : null
  if (roleCode === 'admin' || roleValue === 1) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  }
  if (roleCode === 'guru' || roleValue === 2) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}

const UsersDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchUser()
  }, [id])

  const fetchUser = async () => {
    setLoading(true)
    const { data, error } = await usersService.getById(id)
    if (data) {
      setUser(data.data)
    } else {
      showError('Gagal mengambil data user')
      navigate('/users')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const result = await showDeleteConfirm(user.name)
    if (result.isConfirmed) {
      const { error } = await usersService.delete(user.id)
      if (!error) {
        showSuccess(`${user.name} berhasil dihapus!`)
        navigate('/users')
      } else {
        showError('Gagal menghapus user')
      }
    }
  }

  const handleToggleStatus = async () => {
    const newStatus = !user.is_active
    const { error } = await usersService.toggleStatus(user.id, newStatus)
    if (!error) {
      showSuccess(`User ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}!`)
      fetchUser()
    } else {
      showError('Gagal mengubah status user')
    }
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const roleLabel = getRoleLabel(user.role, user.roles)
  const badgeColor = getRoleBadgeColor(user.role, user.roles)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/users')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail User</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="warning" onClick={() => navigate(`/users/${id}/edit`)}>
            <Edit size={18} className="mr-2" />
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={18} className="mr-2" />
            Hapus
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User size={48} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{user.name}</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{user.email}</p>
              
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {user.is_active ? 'Aktif' : 'Nonaktif'}
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                  {roleLabel}
                </span>
              </div>

              <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                <Button 
                  variant={user.isActive ? "secondary" : "success"} 
                  onClick={handleToggleStatus}
                  className="w-full"
                >
                  <ToggleRight size={18} className="mr-2" />
                  {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Details */}
        <div className="md:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Informasi User</h3>
              
              <div className="space-y-4">
                {/* Name */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-500 dark:text-gray-400">Nama Lengkap</label>
                    <p className="text-gray-900 dark:text-white font-medium">{user.name}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-500 dark:text-gray-400">Email</label>
                    <p className="text-gray-900 dark:text-white font-medium">{user.email}</p>
                  </div>
                </div>

                {/* Role */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-500 dark:text-gray-400">Role</label>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
                      {roleLabel}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ToggleRight size={20} className="text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-500 dark:text-gray-400">Status</label>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.is_active ? 'User dapat login ke sistem' : 'User tidak dapat login ke sistem'}
                    </p>
                  </div>
                </div>

                {/* Created At */}
                {user.created_at && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar size={20} className="text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-500 dark:text-gray-400">Dibuat Pada</label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {new Date(user.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Updated At */}
                {user.updated_at && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar size={20} className="text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-500 dark:text-gray-400">Terakhir Diperbarui</label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {new Date(user.updated_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default UsersDetail