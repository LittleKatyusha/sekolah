import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Users, UserCheck, Tag, Calendar, AlertCircle, FileText } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { bkKasusService } from '../services/bkService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

// Explicit color classes for Tailwind purge safety
const colorClasses = {
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  gray: 'bg-gray-100 text-gray-700',
}

const getStatusBadge = (status) => {
  const statusMap = {
    'dibuka': { label: 'Dibuka', color: 'blue' },
    'dalam_proses': { label: 'Dalam Proses', color: 'yellow' },
    'selesai': { label: 'Selesai', color: 'green' },
    'ditutup': { label: 'Ditutup', color: 'gray' },
    1: { label: 'Dibuka', color: 'blue' },
    2: { label: 'Dalam Proses', color: 'yellow' },
    3: { label: 'Selesai', color: 'green' },
    4: { label: 'Ditutup', color: 'gray' },
  }
  const s = statusMap[status] || { label: status || '-', color: 'gray' }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClasses[s.color]}`}>
      {s.label}
    </span>
  )
}

const BkKasusDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [kasus, setKasus] = useState(null)

  useEffect(() => {
    fetchKasus()
  }, [id])

  const fetchKasus = async () => {
    setLoading(true)
    const { data, error } = await bkKasusService.getById(id)
    if (data) {
      setKasus(data.data)
    } else {
      showError('Gagal mengambil data kasus BK')
      navigate('/bk/kasus')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const result = await showDeleteConfirm('kasus ini')
    if (result.isConfirmed) {
      const { error } = await bkKasusService.delete(kasus.id)
      if (!error) {
        showSuccess('Kasus BK berhasil dihapus!')
        navigate('/bk/kasus')
      } else {
        showError('Gagal menghapus kasus BK')
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

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading || !kasus) {
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
          <Button variant="secondary" onClick={() => navigate('/bk/kasus')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Kasus BK</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="warning" onClick={() => navigate(`/bk/kasus/${id}/edit`)}>
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
        {/* Left Summary Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              {/* Status Badge */}
              <div className="mb-4">
                {getStatusBadge(kasus.status)}
              </div>

              {/* Siswa Name */}
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {kasus.siswa?.nama || '-'}
              </h2>

              {/* Siswa NIS */}
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                NIS: {kasus.siswa?.nis || '-'}
              </p>

              {/* Jenis BK Tag */}
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                {kasus.jenis?.nama || '-'}
              </div>

              {/* Quick Info */}
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Guru BK</span>
                  <span className="font-medium text-gray-900 dark:text-white">{kasus.guru?.nama || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tanggal</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDate(kasus.tanggal)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Info Card */}
        <div className="md:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Lengkap</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Siswa */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Siswa</p>
                    <p className="font-medium text-gray-900 dark:text-white">{kasus.siswa?.nama || '-'}</p>
                    {kasus.siswa?.nis && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">NIS: {kasus.siswa.nis}</p>
                    )}
                  </div>
                </div>

                {/* Guru BK */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserCheck size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Guru BK</p>
                    <p className="font-medium text-gray-900 dark:text-white">{kasus.guru?.nama || '-'}</p>
                  </div>
                </div>

                {/* Jenis BK */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Tag size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Jenis BK</p>
                    <p className="font-medium text-gray-900 dark:text-white">{kasus.jenis?.nama || '-'}</p>
                  </div>
                </div>

                {/* Tanggal */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(kasus.tanggal)}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <div className="mt-1">{getStatusBadge(kasus.status)}</div>
                  </div>
                </div>

                {/* Keterangan - full width */}
                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Keterangan</p>
                    <p className="font-medium text-gray-900 dark:text-white">{kasus.keterangan || '-'}</p>
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
                      <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(kasus.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar size={20} className="text-rose-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Diperbarui</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(kasus.updated_at)}</p>
                    </div>
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

export default BkKasusDetail