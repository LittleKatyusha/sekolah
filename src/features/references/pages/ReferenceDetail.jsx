import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Tag, Hash, FileText, ListOrdered } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { referenceAdminService } from '../services/referenceAdminService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const ReferenceDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [reference, setReference] = useState(null)

  useEffect(() => { fetchReference() }, [id])

  const fetchReference = async () => {
    setLoading(true)
    const { data, error } = await referenceAdminService.getById(id)
    if (data) {
      setReference(data.data)
    } else {
      showError('Gagal mengambil data referensi')
      navigate('/admin/references')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const result = await showDeleteConfirm(reference.nama)
    if (result.isConfirmed) {
      const { error } = await referenceAdminService.delete(reference.id)
      if (!error) {
        showSuccess(`${reference.nama} berhasil dihapus!`)
        navigate('/admin/references')
      } else {
        showError('Gagal menghapus referensi')
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading || !reference) {
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
          <Button variant="secondary" onClick={() => navigate('/admin/references')}>
            <ArrowLeft size={18} className="mr-2" /> Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Referensi</h1>
        </div>
        <div className="flex gap-3">
          <PermissionGuard permission="references.edit">
            <Button variant="warning" onClick={() => navigate(`/admin/references/${id}/edit`)}>
              <Edit size={18} className="mr-2" /> Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="references.delete">
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" /> Hapus
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Referensi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Tag size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Kategori</p>
                <p className="font-medium text-gray-900 dark:text-white">{reference.kategori || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Hash size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Kode</p>
                <p className="font-medium text-gray-900 dark:text-white">{reference.kode || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nama</p>
                <p className="font-medium text-gray-900 dark:text-white">{reference.nama || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <ListOrdered size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Urutan</p>
                <p className="font-medium text-gray-900 dark:text-white">{reference.urutan ?? '-'}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                <p className="text-gray-700 dark:text-gray-300">{formatDate(reference.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                <p className="text-gray-700 dark:text-gray-300">{formatDate(reference.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ReferenceDetail