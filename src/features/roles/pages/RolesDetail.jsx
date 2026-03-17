import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Shield, Key } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
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

  // Group permissions by prefix
  const groupedPermissions = (role?.permissions || []).reduce((groups, perm) => {
    const name = perm.name || perm
    const parts = String(name).split('.')
    const group = parts.length > 1 ? parts[0] : 'other'
    if (!groups[group]) groups[group] = []
    groups[group].push(name)
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
          <Button variant="warning" onClick={() => navigate(`/admin/roles/${id}/edit`)}>
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
        {/* Summary Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Shield size={48} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {role.name || '-'}
              </h2>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{role.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Permissions</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {role.permissions?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Detail Info */}
        <div className="md:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Lengkap</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama Role</p>
                    <p className="font-medium text-gray-900 dark:text-white">{role.name || '-'}</p>
                  </div>
                </div>

              </div>

              {/* Permissions Section */}
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Assigned Permissions ({role.permissions?.length || 0})
                </h4>
                {Object.keys(groupedPermissions).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).sort(([a], [b]) => a.localeCompare(b)).map(([group, perms]) => (
                      <div key={group} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 capitalize">{group}</h5>
                        <div className="flex flex-wrap gap-2">
                          {perms.map((name, idx) => (
                            <span key={idx} className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Tidak ada permission yang ditetapkan.</p>
                )}
              </div>

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(role.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(role.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default RolesDetail