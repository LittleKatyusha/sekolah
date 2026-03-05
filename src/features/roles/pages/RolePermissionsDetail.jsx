import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { rolePermissionService } from '../services/rolesService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const RolePermissionsDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [rolePermission, setRolePermission] = useState(null)

  useEffect(() => {
    fetchRolePermission()
  }, [id])

  const fetchRolePermission = async () => {
    setLoading(true)
    const { data, error } = await rolePermissionService.getById(id)
    if (data) {
      setRolePermission(data.data)
    } else {
      showError('Gagal mengambil data role permission')
      navigate('/admin/role-permissions')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `Role Permission ID "${rolePermission.id || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await rolePermissionService.delete(rolePermission.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/admin/role-permissions')
      } else {
        showError('Gagal menghapus role permission')
      }
    }
  }

  if (loading || !rolePermission) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/admin/role-permissions')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Role Permission</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="warning" onClick={() => navigate(`/admin/role-permissions/${id}/edit`)}>
            <Edit size={18} className="mr-2" />
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={18} className="mr-2" />
            Hapus
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Role Permission #{rolePermission.id}
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{rolePermission.id}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Detail Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role Info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Role ID</p>
                    <p className="font-medium text-gray-900 dark:text-white">{rolePermission.role_id || '-'}</p>
                  </div>
                  {rolePermission.role && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Role Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">{rolePermission.role.name || '-'}</p>
                    </div>
                  )}
                </div>

                {/* Permission Info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Permission ID</p>
                    <p className="font-medium text-gray-900 dark:text-white">{rolePermission.permission_id || '-'}</p>
                  </div>
                  {rolePermission.permission && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Permission Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">{rolePermission.permission.name || '-'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metadata Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Metadata</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
              <p className="text-gray-700 dark:text-gray-300">{formatDate(rolePermission.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
              <p className="text-gray-700 dark:text-gray-300">{formatDate(rolePermission.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RolePermissionsDetail