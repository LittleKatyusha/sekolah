import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Shield } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { roleService } from '../services/rolesService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const RolesDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState(null)

  useEffect(() => {
    fetchRole()
  }, [id])

  const fetchRole = async () => {
    setLoading(true)
    const { data, error } = await roleService.getById(id)
    if (data) {
      setRole(data.data)
    } else {
      showError('Gagal mengambil data role')
      navigate('/admin/roles')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `Role "${role.name || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await roleService.delete(role.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/admin/roles')
      } else {
        showError('Gagal menghapus role')
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Group permissions by module field
  const groupedPermissions = (role?.permissions || []).reduce((groups, perm) => {
    const group = perm.module || (perm.code ? perm.code.split('.')[0] : null) || 'other'
    if (!groups[group]) groups[group] = []
    groups[group].push(perm)
    return groups
  }, {})

  if (loading || !role) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/admin/roles')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Role</h1>
        </div>
        <div className="flex gap-3">
          <PermissionGuard permission="roles.edit">
            <Button variant="warning" onClick={() => navigate(`/admin/roles/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="roles.delete">
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
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield size={24} className="text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{role.name || '-'}</h2>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400">{role.code || '-'}</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">ID</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{role.id}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Nama Role</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{role.name || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Code</p>
              <p className="text-sm font-mono text-gray-900 dark:text-white">{role.code || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Permissions</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {role.permissions?.length || 0} permission
              </span>
            </div>
          </div>

          {/* Permissions */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Assigned Permissions ({role.permissions?.length || 0})
            </h3>
            {Object.keys(groupedPermissions).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(groupedPermissions).sort(([a], [b]) => a.localeCompare(b)).map(([group, perms]) => (
                  <div key={group} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 capitalize">{group}</h4>
                    <div className="flex flex-wrap gap-2">
                      {perms.map((perm, idx) => (
                        <span key={idx} className="inline-flex flex-col px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800">
                          <span>{perm.name || perm.code || perm}</span>
                          {perm.code && <span className="font-mono opacity-70">{perm.code}</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Tidak ada permission yang ditetapkan.</p>
            )}
          </div>

          {/* Timestamps */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Dibuat: <span className="text-gray-700 dark:text-gray-300">{formatDate(role.created_at)}</span></span>
              <span>Diperbarui: <span className="text-gray-700 dark:text-gray-300">{formatDate(role.updated_at)}</span></span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default RolesDetail