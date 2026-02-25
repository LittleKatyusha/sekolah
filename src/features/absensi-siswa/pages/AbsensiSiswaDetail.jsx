import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Calendar } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { absensiSiswaService } from '../services/absensiSiswaService'
import { showError } from '../../../utils/sweetalert'

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    hadir: {
      label: 'Hadir',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    },
    tidak_hadir: {
      label: 'Tidak Hadir',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    },
    izin: {
      label: 'Izin',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    },
    sakit: {
      label: 'Sakit',
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    }
  }

  const config = statusConfig[status] || {
    label: status || '-',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

const AbsensiSiswaDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [absensi, setAbsensi] = useState(null)

  useEffect(() => {
    fetchAbsensi()
  }, [id])

  const fetchAbsensi = async () => {
    setLoading(true)
    const { data, error } = await absensiSiswaService.getAbsensiSiswaById(id)
    if (data) {
      setAbsensi(data.data)
    } else {
      showError('Gagal mengambil data absensi siswa')
      navigate('/absensi-siswa')
    }
    setLoading(false)
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
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
          <Button variant="secondary" onClick={() => navigate('/absensi-siswa')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Absensi Siswa</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User size={48} className="text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {absensi.siswa?.nama || '-'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-2">NIS: {absensi.siswa?.nis || '-'}</p>

              <div className="mt-4">
                <StatusBadge status={absensi.status_absensi} />
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tanggal</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(absensi.tanggal)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Detail Info */}
        <div className="md:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Absensi</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama Siswa</p>
                    <p className="font-medium text-gray-900 dark:text-white">{absensi.siswa?.nama || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">NIS</p>
                    <p className="font-medium text-gray-900 dark:text-white">{absensi.siswa?.nis || '-'}</p>
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
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status Absensi</p>
                    <div className="mt-1">
                      <StatusBadge status={absensi.status_absensi} />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Keterangan</p>
                    <p className="font-medium text-gray-900 dark:text-white">{absensi.keterangan || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDateTime(absensi.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Diperbarui pada</p>
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

export default AbsensiSiswaDetail