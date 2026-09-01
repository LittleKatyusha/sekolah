import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Tag, Calendar } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { bkJenisService } from '../services/bkService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { formatDateTime } from '../../../utils/formatters'

const BkJenisDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [jenis, setJenis] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    
    const fetchJenis = async () => {
      setLoading(true)
      const { data, error } = await bkJenisService.getById(id)
      if (controller.signal.aborted) return
      
      if (data) {
        setJenis(data.data)
      } else {
        showError('Gagal mengambil data jenis BK')
        navigate('/bk/jenis')
      }
      setLoading(false)
    }
    
    fetchJenis()
    return () => controller.abort()
  }, [id, navigate])

  const handleDelete = async () => {
    const result = await showDeleteConfirm(jenis.nama)
    if (result.isConfirmed) {
      const { error } = await bkJenisService.delete(jenis.id)
      if (!error) {
        showSuccess(`${jenis.nama} berhasil dihapus!`)
        navigate('/bk/jenis')
      } else {
        showError('Gagal menghapus jenis BK')
      }
    }
  }


  if (loading || !jenis) {
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
          <Button variant="secondary" onClick={() => navigate('/bk/jenis')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Jenis BK</h1>
        </div>
        <div className="flex gap-3">
          <PermissionGuard permission="bk-jenis.update">
            <Button variant="warning" onClick={() => navigate(`/bk/jenis/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="bk-jenis.delete">
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Jenis BK</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Tag size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nama Jenis</p>
                <p className="font-medium text-gray-900 dark:text-white">{jenis.nama}</p>
              </div>
            </div>

          </div>

          {/* Timestamps */}
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(jenis.created_at)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Diperbarui</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(jenis.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default BkJenisDetail
