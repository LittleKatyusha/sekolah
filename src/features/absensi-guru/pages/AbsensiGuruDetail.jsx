import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, User, Calendar, ClipboardCheck, FileText, Clock3 } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { absensiGuruService } from '../services/absensiGuruService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const normalizeStatusToken = (status) => {
  if (status === null || status === undefined || status === '') return ''
  return String(status).trim().toLowerCase()
}

const getStatusLabel = (status) => {
  const normalized = normalizeStatusToken(status)
  const map = { '1': 'Hadir', '2': 'Izin', '3': 'Sakit', '4': 'Alpha', hadir: 'Hadir', sakit: 'Sakit', izin: 'Izin', alpha: 'Alpha', alpa: 'Alpha' }
  return map[normalized] || status || '-'
}

const getStatusBadgeClass = (status) => {
  const normalized = normalizeStatusToken(status)
  const map = {
    '1': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    '2': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    '3': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    '4': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    hadir: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    sakit: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    izin: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    alpha: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    alpa: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }
  return map[normalized] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTime = (value) => {
  if (!value) return '-'
  return String(value).slice(0, 5)
}

const AbsensiGuruDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [absensi, setAbsensi] = useState(null)

  const fetchAbsensi = useCallback(async () => {
    setLoading(true)
    const { data, error } = await absensiGuruService.getById(id)
    if (data) {
      setAbsensi(data.data)
    } else {
      showError('Gagal mengambil data absensi guru')
      navigate('/absensi-guru')
    }
    setLoading(false)
  }, [id, navigate])

  useEffect(() => { fetchAbsensi() }, [fetchAbsensi])

  const handleDelete = useCallback(async () => {
    if (!absensi) return
    const result = await showDeleteConfirm(absensi.guru?.nama || 'absensi ini')
    if (result.isConfirmed) {
      const { error } = await absensiGuruService.deleteById(absensi.id)
      if (!error) {
        showSuccess('Absensi guru berhasil dihapus!')
        navigate('/absensi-guru')
      } else {
        showError('Gagal menghapus absensi guru')
      }
    }
  }, [absensi, navigate])

  const formatDate = (val) => {
    if (!val) return '-'
    return new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading || !absensi) {
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
          <Button variant="secondary" onClick={() => navigate('/absensi-guru')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Absensi Guru</h1>
        </div>
        <div className="flex gap-3">
          <PermissionGuard permission="absensi-guru.edit">
            <Button variant="warning" onClick={() => navigate(`/absensi-guru/edit/${id}`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="absensi-guru.delete">
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
                <User size={48} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {absensi.guru?.nama || '-'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                NIP: {absensi.guru?.nip || '-'}
              </p>

              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(absensi.status_absensi || absensi.status)}`}>
                {getStatusLabel(absensi.status_absensi || absensi.status)}
              </span>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tanggal</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDate(absensi.tanggal)}</span>
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
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama Guru</p>
                    <p className="font-medium text-gray-900 dark:text-white">{absensi.guru?.nama || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">NIP</p>
                    <p className="font-medium text-gray-900 dark:text-white">{absensi.guru?.nip || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(absensi.tanggal)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ClipboardCheck size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <div className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(absensi.status_absensi || absensi.status)}`}>
                        {getStatusLabel(absensi.status_absensi || absensi.status)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock3 size={20} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Jam Masuk</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatTime(absensi.jam_masuk)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock3 size={20} className="text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Jam Keluar</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatTime(absensi.jam_keluar)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Keterangan</p>
                    <p className="font-medium text-gray-900 dark:text-white">{absensi.keterangan || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDateTime(absensi.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDateTime(absensi.updated_at)}</p>
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

export default AbsensiGuruDetail
