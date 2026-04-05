import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Link } from 'lucide-react'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import Card from '../../../components/ui/Card'
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

  const fetchRolePermission = useCallback(async () => {
    setLoading(true)
    const { data } = await rolePermissionService.getById(id)
    if (data) {
      setRolePermission(data.data)
    } else {
      showError('Gagal mengambil data role permission')
      navigate('/admin/role-permissions')
    }
    setLoading(false)
  }, [id, navigate])

  useEffect(() => {
    fetchRolePermission()
  }, [fetchRolePermission])

  const handleDelete = useCallback(async () => {
    const label = `Role Permission ID "${rolePermission?.id || ''}"`
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
  }, [rolePermission, navigate])

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
          <PermissionGuard permission="role-permissions.edit">
            <Button variant="warning" onClick={() => navigate(`/admin/role-permissions/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="role-permissions.delete">
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Link size={24} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Role Permission #{rolePermission.id}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {rolePermission.role?.name || '-'} &rarr; {rolePermission.permission?.name || '-'}
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Role</p>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">ID</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{rolePermission.role_id || '-'}</p>
              </div>
              {rolePermission.role && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nama Role</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rolePermission.role.name || '-'}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Permission</p>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">ID</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{rolePermission.permission_id || '-'}</p>
              </div>
              {rolePermission.permission && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nama Permission</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{rolePermission.permission.name || '-'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Dibuat: <span className="text-gray-700 dark:text-gray-300">{formatDate(rolePermission.created_at)}</span></span>
              <span>Diperbarui: <span className="text-gray-700 dark:text-gray-300">{formatDate(rolePermission.updated_at)}</span></span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default RolePermissionsDetail