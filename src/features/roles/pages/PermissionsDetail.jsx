import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Key } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { permissionService } from '../services/rolesService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const PermissionsDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [permission, setPermission] = useState(null)

  useEffect(() => {
    fetchPermission()
  }, [id])

  const fetchPermission = async () => {
    setLoading(true)
    const { data, error } = await permissionService.getById(id)
    if (data) {
      setPermission(data.data)
    } else {
      showError('Gagal mengambil data permission')
      navigate('/admin/permissions')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `Permission "${permission.name || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await permissionService.delete(permission.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/admin/permissions')
      } else {
        showError('Gagal menghapus permission')
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading || !permission) {
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
          <Button variant="secondary" onClick={() => navigate('/admin/permissions')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Permission</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="warning" onClick={() => navigate(`/admin/permissions/${id}/edit`)}>
            <Edit size={18} className="mr-2" />
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={18} className="mr-2" />
            Hapus
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Key size={24} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{permission.name || '-'}</h2>
              <p className="text-sm font-mono text-gray-500 dark:text-gray-400">{permission.code || '-'}</p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">ID</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{permission.id}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Nama Permission</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{permission.name || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Code</p>
              <p className="text-sm font-mono text-gray-900 dark:text-white">{permission.code || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Modul</p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                {permission.module || '-'}
              </span>
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Dibuat: <span className="text-gray-700 dark:text-gray-300">{formatDate(permission.created_at)}</span></span>
              <span>Diperbarui: <span className="text-gray-700 dark:text-gray-300">{formatDate(permission.updated_at)}</span></span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default PermissionsDetail