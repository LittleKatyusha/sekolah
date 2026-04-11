import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, BookOpen, User } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { guruMapelService } from '../services/guruMapelService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const GuruMapelDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [item, setItem] = useState(null)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await guruMapelService.getGuruMapelById(id)
    if (data) {
      setItem(data.data)
    } else {
      showError('Gagal mengambil data guru mata pelajaran')
      navigate('/guru-mapel')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `${item.guru?.nama ?? ''} - ${item.mapel?.nama ?? ''}`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await guruMapelService.deleteGuruMapel(item.id)
      if (!error) {
        showSuccess('Data guru mata pelajaran berhasil dihapus!')
        navigate('/guru-mapel')
      } else {
        showError('Gagal menghapus data guru mata pelajaran')
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading || !item) {
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
          <Button variant="secondary" onClick={() => navigate('/guru-mapel')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Detail Guru Mata Pelajaran
          </h1>
        </div>
        <div className="flex gap-3">
          <PermissionGuard permission="guru-mapel.update">
            <Button variant="warning" onClick={() => navigate(`/guru-mapel/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="guru-mapel.delete">
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Guru Info */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <User size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informasi Guru</h2>
            </div>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nama Guru</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{item.guru?.nama ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">NIP</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{item.guru?.nip ?? '-'}</dd>
              </div>
            </dl>
          </div>
        </Card>

        {/* Mapel Info */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <BookOpen size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informasi Mata Pelajaran</h2>
            </div>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Kode</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{item.mapel?.kode ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nama Mata Pelajaran</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{item.mapel?.nama ?? '-'}</dd>
              </div>
            </dl>
          </div>
        </Card>
      </div>

      {/* Timestamps */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Riwayat</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Dibuat</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(item.created_at)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Diperbarui</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(item.updated_at)}</dd>
            </div>
          </dl>
        </div>
      </Card>
    </div>
  )
}

export default GuruMapelDetail
