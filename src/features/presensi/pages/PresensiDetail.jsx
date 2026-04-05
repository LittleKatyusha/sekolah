import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, User, Calendar, Clock, BookOpen, FileText } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { presensiService } from '../services/presensiService'
import { showError } from '../../../utils/sweetalert'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'

const getLabel = (value, options) => {
  if (!value || !options?.length) return value ?? '-'
  const opt = options.find(o => o.value === String(value) || o.value === value)
  return opt ? opt.label : value
}

// Status Badge Component
const StatusBadge = ({ statusValue, statusLabel, statusOptions }) => {
  const statusConfig = {
    'Hadir': {
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    },
    'Izin': {
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    },
    'Sakit': {
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    },
    'Alpha': {
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }
  }

  const label = statusLabel || getLabel(statusValue, statusOptions)
  const config = statusConfig[label] || {
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {label || '-'}
    </span>
  )
}

const PresensiDetail = () => {
  usePageTitle()
  const { options: statusAbsensiOptions } = useReferenceOptions('status_absensi')
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [presensi, setPresensi] = useState(null)

  useEffect(() => {
    fetchPresensi()
  }, [id])

  const fetchPresensi = async () => {
    setLoading(true)
    const { data, error } = await presensiService.getPresensiById(id)
    if (data) {
      setPresensi(data.data)
    } else {
      showError('Gagal mengambil data presensi')
      navigate('/akademik/presensi')
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

  if (loading || !presensi) {
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
          <Button variant="secondary" onClick={() => navigate('/akademik/presensi')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Presensi</h1>
        </div>
        <Button onClick={() => navigate(`/akademik/presensi/edit/${id}`)}>
          <Edit size={18} className="mr-2" />
          Edit
        </Button>
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
                {presensi.siswa?.nama || '-'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-2">NIS: {presensi.siswa?.nis || '-'}</p>

              <div className="mt-4">
                <StatusBadge statusLabel={presensi.status_label} statusOptions={statusAbsensiOptions} />
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tanggal</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(presensi.tanggal)}
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Presensi</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(presensi.tanggal)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Jam Masuk</p>
                    <p className="font-medium text-gray-900 dark:text-white">{presensi.jam_masuk || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status Presensi</p>
                    <div className="mt-1">
                      <StatusBadge statusLabel={presensi.status_label} statusOptions={statusAbsensiOptions} />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama Siswa</p>
                    <p className="font-medium text-gray-900 dark:text-white">{presensi.siswa?.nama || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">NIS</p>
                    <p className="font-medium text-gray-900 dark:text-white">{presensi.siswa?.nis || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Guru Mapel</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {presensi.guru_mapel
                        ? `${presensi.guru_mapel.guru?.nama || '-'} - ${presensi.guru_mapel.mapel?.nama_mapel || '-'}`
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Keterangan</p>
                    <p className="font-medium text-gray-900 dark:text-white">{presensi.keterangan || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDateTime(presensi.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Diperbarui pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDateTime(presensi.updated_at)}</p>
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

export default PresensiDetail