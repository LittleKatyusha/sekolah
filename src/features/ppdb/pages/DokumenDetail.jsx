import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, FileText, CheckCircle, XCircle } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { dokumenService } from '../services/ppdbService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const DokumenDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [dokumen, setDokumen] = useState(null)

  useEffect(() => {
    fetchDokumen()
  }, [id])

  const fetchDokumen = async () => {
    setLoading(true)
    const { data, error } = await dokumenService.getById(id)
    if (data) {
      setDokumen(data.data || data)
    } else {
      showError('Gagal mengambil data dokumen')
      navigate('/ppdb/dokumen')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `Dokumen "${dokumen.jenis_dokumen || dokumen.file_name || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await dokumenService.delete(dokumen.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/ppdb/dokumen')
      } else {
        showError('Gagal menghapus dokumen')
      }
    }
  }

  const handleVerify = async () => {
    const { error } = await dokumenService.verify(dokumen.id, '')
    if (!error) {
      showSuccess('Dokumen berhasil diverifikasi!')
      fetchDokumen()
    } else {
      showError('Gagal memverifikasi dokumen')
    }
  }

  const handleReject = async () => {
    const { error } = await dokumenService.reject(dokumen.id, '')
    if (!error) {
      showSuccess('Dokumen berhasil ditolak!')
      fetchDokumen()
    } else {
      showError('Gagal menolak dokumen')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '-'
    const num = Number(bytes)
    if (num < 1024) return `${num} B`
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`
    return `${(num / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusBadge = (status) => {
    if (status === 'verified' || status === true || status === 1) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Terverifikasi</span>
    }
    if (status === 'rejected') {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Ditolak</span>
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</span>
  }

  if (loading || !dokumen) {
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
          <Button variant="secondary" onClick={() => navigate('/ppdb/dokumen')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Dokumen</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={handleVerify}>
            <CheckCircle size={18} className="mr-2" />
            Verifikasi
          </Button>
          <Button variant="danger" onClick={handleReject}>
            <XCircle size={18} className="mr-2" />
            Tolak
          </Button>
          <Button variant="warning" onClick={() => navigate(`/ppdb/dokumen/${id}/edit`)}>
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
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FileText size={48} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {dokumen.jenis_dokumen || '-'}
              </h2>
              <div className="flex justify-center gap-2 mb-2">
                {getStatusBadge(dokumen.verifikasi_status)}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{dokumen.file_name || '-'}</p>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Dokumen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ID Pendaftar</p>
                    <p className="font-medium text-gray-900 dark:text-white">{dokumen.ppdb_pendaftar_id || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Jenis Dokumen</p>
                    <p className="font-medium text-gray-900 dark:text-white">{dokumen.jenis_dokumen || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama File</p>
                    <p className="font-medium text-gray-900 dark:text-white">{dokumen.file_name || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">MIME Type</p>
                    <p className="font-medium text-gray-900 dark:text-white">{dokumen.mime_type || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ukuran File</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatFileSize(dokumen.file_size)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Path File</p>
                    <p className="font-medium text-gray-900 dark:text-white break-all">{dokumen.file_path || '-'}</p>
                  </div>
                </div>
              </div>

              {dokumen.catatan_admin && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Catatan Admin</p>
                  <p className="text-gray-900 dark:text-white">{dokumen.catatan_admin}</p>
                </div>
              )}

              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(dokumen.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(dokumen.updated_at)}</p>
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

export default DokumenDetail