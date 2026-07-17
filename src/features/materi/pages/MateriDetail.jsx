import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, BookOpen, User, FileText, Link, Hash, AlignLeft } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { materiService } from '../services/materiService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

// Status mapping for display (backend: 1 Aktif, 0 Draft)
const STATUS_MAP = {
  1: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  0: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const MateriDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [materi, setMateri] = useState(null)

  useEffect(() => {
    fetchMateri()
  }, [id])

  const fetchMateri = async () => {
    setLoading(true)
    const { data, error } = await materiService.getById(id)
    if (data) {
      setMateri(data.data)
    } else {
      showError('Gagal mengambil data materi')
      navigate('/akademik/materi')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `Materi "${materi.judul || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await materiService.delete(materi.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/akademik/materi')
      } else {
        showError('Gagal menghapus materi')
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Helper function to strip HTML tags
  const stripHtmlTags = (html) => {
    if (!html) return ''
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const getStatusBadge = (status, statusLabel) => {
    if (status === null || status === undefined) return '-'
    const bg = STATUS_MAP[status] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg}`}>
        {statusLabel || String(status)}
      </span>
    )
  }

  if (loading || !materi) {
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
          <Button variant="secondary" onClick={() => navigate('/akademik/materi')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Materi</h1>
        </div>
        <div className="flex gap-3">
          <PermissionGuard permission="materi.update">
            <Button variant="warning" onClick={() => navigate(`/akademik/materi/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="materi.delete">
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <BookOpen size={48} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {materi.judul || '-'}
              </h2>
              <div className="flex justify-center gap-2 mb-2">
                {getStatusBadge(materi.status, materi.status_label)}
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{materi.id}</span>
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
                    <BookOpen size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Judul</p>
                    <p className="font-medium text-gray-900 dark:text-white">{materi.judul || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Guru / Mata Pelajaran</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {materi.guru_mapel?.guru?.nama || '-'}
                    </p>
                    {materi.guru_mapel?.mapel?.nama && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Mapel: {materi.guru_mapel.mapel.nama}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <div className="mt-1">{getStatusBadge(materi.status, materi.status_label)}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">File Materi</p>
                    <p className="font-medium text-gray-900 dark:text-white break-all">{materi.file_materi || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Link size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Link Video</p>
                    {materi.link_video ? (
                      <a
                        href={materi.link_video}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary-600 hover:underline break-all"
                      >
                        {materi.link_video}
                      </a>
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-white">-</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Deskripsi Section */}
              {materi.deskripsi && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlignLeft size={16} className="text-gray-500" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Deskripsi</h4>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{stripHtmlTags(materi.deskripsi)}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(materi.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(materi.updated_at)}</p>
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

export default MateriDetail