import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Calendar, Hash, CheckCircle, BookOpen } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { semesterService } from '../services/semesterService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_MAP = {
  1: { label: 'Aktif', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  0: { label: 'Nonaktif', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  true: { label: 'Aktif', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  false: { label: 'Nonaktif', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const SemesterDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [semester, setSemester] = useState(null)

  useEffect(() => {
    fetchSemester()
  }, [id])

  const fetchSemester = async () => {
    setLoading(true)
    const { data, error } = await semesterService.getById(id)
    if (data) {
      setSemester(data.data)
    } else {
      showError('Gagal mengambil data semester')
      navigate('/admin/semester')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `Semester "${semester.nama || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await semesterService.delete(semester.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/admin/semester')
      } else {
        showError('Gagal menghapus semester')
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

  const getStatusBadge = (status) => {
    if (status === null || status === undefined) return '-'
    const key = String(status)
    const info = STATUS_MAP[status] || STATUS_MAP[key] || { label: String(status), bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.bg}`}>
        {info.label}
      </span>
    )
  }

  if (loading || !semester) {
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
          <Button variant="secondary" onClick={() => navigate('/admin/semester')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Semester</h1>
        </div>
        <div className="flex gap-3">
          <PermissionGuard permission="semester.edit">
            <Button variant="warning" onClick={() => navigate(`/admin/semester/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="semester.delete">
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <BookOpen size={48} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {semester.nama || '-'}
              </h2>
              <div className="flex justify-center gap-2 mb-2">
                {getStatusBadge(semester.is_active)}
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{semester.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tahun Ajaran</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {semester.tahun_ajaran?.nama || semester.tahun_ajaran?.kode || '-'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Lengkap</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama</p>
                    <p className="font-medium text-gray-900 dark:text-white">{semester.nama || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tahun Ajaran</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {semester.tahun_ajaran?.nama || semester.tahun_ajaran?.kode || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Mulai</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(semester.tanggal_mulai)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Selesai</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(semester.tanggal_selesai)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <div className="mt-1">{getStatusBadge(semester.is_active)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(semester.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(semester.updated_at)}</p>
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

export default SemesterDetail