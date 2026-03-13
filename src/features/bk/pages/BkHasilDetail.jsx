import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Calendar, Briefcase, CheckCircle, Lightbulb } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { bkHasilService } from '../services/bkService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { formatDateTime } from '../../../utils/formatters'

const BkHasilDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [hasil, setHasil] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const fetchHasil = async () => {
      setLoading(true)
      const { data, error } = await bkHasilService.getById(id)
      if (controller.signal.aborted) return
      if (data) {
        setHasil(data.data)
      } else {
        showError('Gagal mengambil data hasil konseling')
        navigate('/bk/hasil')
      }
      setLoading(false)
    }
    fetchHasil()
    return () => controller.abort()
  }, [id, navigate])

  const handleDelete = async () => {
    const result = await showDeleteConfirm('hasil konseling ini')
    if (result.isConfirmed) {
      const { error } = await bkHasilService.delete(hasil.id)
      if (!error) {
        showSuccess('Hasil konseling berhasil dihapus!')
        navigate('/bk/hasil')
      } else {
        showError('Gagal menghapus hasil konseling')
      }
    }
  }

  if (loading || !hasil) {
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
          <Button variant="secondary" onClick={() => navigate('/bk/hasil')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Hasil Konseling</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="warning" onClick={() => navigate(`/bk/hasil/${id}/edit`)}>
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
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Hasil Konseling</h3>

          <div className="grid grid-cols-1 gap-6">
            {/* ID Kasus */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Briefcase size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">ID Kasus</p>
                <p className="font-medium text-gray-900 dark:text-white">Kasus #{hasil.trx_bk_kasus_id}</p>
              </div>
            </div>

            {/* Hasil */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Hasil</p>
                <p className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap">{hasil.hasil || '-'}</p>
              </div>
            </div>

            {/* Rekomendasi */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb size={20} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Rekomendasi</p>
                <p className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap">{hasil.rekomendasi || '-'}</p>
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
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(hasil.created_at)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} className="text-rose-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Diperbarui</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(hasil.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default BkHasilDetail