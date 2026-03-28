import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Calendar, Briefcase, Users, Phone, Shield } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { bkWaliService } from '../services/bkService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { formatDateTime } from '../../../utils/formatters'
import { getPeranBadge } from '../../../utils/bkBadges.jsx'
import usePermission from '../../../hooks/usePermission'

const BkWaliDetail = () => {
  const { can } = usePermission()
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [bkWali, setBkWali] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const fetchWali = async () => {
      setLoading(true)
      const { data, error } = await bkWaliService.getById(id)
      if (controller.signal.aborted) return
      if (data) {
        setBkWali(data.data)
      } else {
        showError('Gagal mengambil data wali')
        navigate('/bk/wali')
      }
      setLoading(false)
    }
    fetchWali()
    return () => controller.abort()
  }, [id, navigate])

  const handleDelete = async () => {
    const result = await showDeleteConfirm('data wali ini')
    if (result.isConfirmed) {
      const { error } = await bkWaliService.delete(bkWali.id)
      if (!error) {
        showSuccess('Wali berhasil dihapus!')
        navigate('/bk/wali')
      } else {
        showError('Gagal menghapus wali')
      }
    }
  }

  if (loading || !bkWali) {
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
          <Button variant="secondary" onClick={() => navigate('/bk/wali')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Wali BK</h1>
        </div>
        <div className="flex gap-3">
          {can('bk-wali.update') && (
            <Button variant="warning" onClick={() => navigate(`/bk/wali/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          )}
          {can('bk-wali.delete') && (
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          )}
        </div>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Wali BK</h3>

          <div className="grid grid-cols-1 gap-6">
            {/* ID Kasus */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Briefcase size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">ID Kasus</p>
                <p className="font-medium text-gray-900 dark:text-white">Kasus #{bkWali.trx_bk_kasus_id}</p>
              </div>
            </div>

            {/* Nama Wali */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nama Wali</p>
                <p className="font-medium text-gray-900 dark:text-white">{bkWali.wali_murid?.nama || '-'}</p>
              </div>
            </div>

            {/* No. Telepon */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">No. Telepon</p>
                <p className="font-medium text-gray-900 dark:text-white">{bkWali.wali_murid?.notelp || '-'}</p>
              </div>
            </div>

            {/* Peran */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Peran</p>
                <div className="mt-1">{getPeranBadge(bkWali.peran)}</div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(bkWali.created_at)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} className="text-rose-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Diperbarui</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(bkWali.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default BkWaliDetail