import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Calendar, FileText, Briefcase, File, Download } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { bkLampiranService } from '../services/bkService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { formatDateTime } from '../../../utils/formatters'

const BkLampiranDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [lampiran, setLampiran] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const fetchLampiran = async () => {
      setLoading(true)
      const { data, error } = await bkLampiranService.getById(id)
      if (controller.signal.aborted) return
      if (data) {
        setLampiran(data.data)
      } else {
        showError('Gagal mengambil data lampiran')
        navigate('/bk/lampiran')
      }
      setLoading(false)
    }
    fetchLampiran()
    return () => controller.abort()
  }, [id, navigate])

  const handleDelete = async () => {
    const result = await showDeleteConfirm('lampiran ini')
    if (result.isConfirmed) {
      const { error } = await bkLampiranService.delete(lampiran.id)
      if (!error) {
        showSuccess('Lampiran berhasil dihapus!')
        navigate('/bk/lampiran')
      } else {
        showError('Gagal menghapus lampiran')
      }
    }
  }

  if (loading || !lampiran) {
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
          <Button variant="secondary" onClick={() => navigate('/bk/lampiran')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Lampiran BK</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={18} className="mr-2" />
            Hapus
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Lampiran BK</h3>

          <div className="grid grid-cols-1 gap-6">
            {/* ID Kasus */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Briefcase size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">ID Kasus</p>
                <p className="font-medium text-gray-900 dark:text-white">Kasus #{lampiran.trx_bk_kasus_id}</p>
              </div>
            </div>

            {/* File */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <File size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">File</p>
                <a
                  href={lampiran.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-800 underline font-medium"
                >
                  {lampiran.file_path?.split('/').pop() || '-'}
                </a>
              </div>
            </div>

            {/* Keterangan */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Keterangan</p>
                <p className="font-medium text-gray-900 dark:text-white">{lampiran.keterangan || '-'}</p>
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
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(lampiran.created_at)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} className="text-rose-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Diperbarui</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(lampiran.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Image Preview */}
          {lampiran.url && lampiran.file_path && /\.(jpg|jpeg|png|gif|webp)$/i.test(lampiran.file_path) && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Preview</h3>
              <img src={lampiran.url} alt="Lampiran" className="max-w-full max-h-96 rounded-lg border border-gray-200 dark:border-gray-700" />
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default BkLampiranDetail