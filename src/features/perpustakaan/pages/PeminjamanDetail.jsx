import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, BookOpen, User, Calendar, Clock, CheckCircle, RotateCcw, FileText } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { peminjamanService } from '../services/perpustakaanService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { usePageTitle } from '../../../hooks/usePageTitle'
import usePermission from '../../../hooks/usePermission'

const PeminjamanDetail = () => {
  const { can } = usePermission()
  const { id } = useParams()
  const navigate = useNavigate()
  
  usePageTitle('Detail Peminjaman')

  const [loading, setLoading] = useState(false)
  const [peminjaman, setPeminjaman] = useState(null)

  useEffect(() => {
    fetchPeminjaman()
  }, [id])

  const fetchPeminjaman = async () => {
    setLoading(true)
    const { data, error } = await peminjamanService.getById(id)
    if (data && data.data) {
      setPeminjaman(data.data)
    } else {
      showError('Gagal mengambil data peminjaman')
      navigate('/perpustakaan/peminjaman')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!peminjaman) return
    
    const result = await showDeleteConfirm(`peminjaman ${peminjaman.siswa?.nama || ''}`)
    if (result.isConfirmed) {
      const { error } = await peminjamanService.delete(peminjaman.id)
      if (!error) {
        showSuccess('Peminjaman berhasil dihapus!')
        navigate('/perpustakaan/peminjaman')
      } else {
        showError('Gagal menghapus peminjaman')
      }
    }
  }

  const handleKembalikan = async () => {
    if (!peminjaman) return
    
    const result = await showDeleteConfirm(`mengembalikan buku "${peminjaman.buku?.judul || ''}" oleh ${peminjaman.siswa?.nama || ''}`)
    if (result.isConfirmed) {
      const { error } = await peminjamanService.pengembalian(peminjaman.id)
      if (!error) {
        showSuccess('Buku berhasil dikembalikan!')
        // Refresh data to show updated status
        fetchPeminjaman()
      } else {
        showError('Gagal memproses pengembalian')
      }
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      dipinjam: {
        label: 'Dipinjam',
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      },
      dikembalikan: {
        label: 'Dikembalikan',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      },
      terlambat: {
        label: 'Terlambat',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      }
    }

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' }

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
        {config.label}
      </span>
    )
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

  if (loading || !peminjaman) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const showKembalikanButton = peminjaman.status !== 'dikembalikan'

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/perpustakaan/peminjaman')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Peminjaman</h1>
        </div>
        <div className="flex gap-3">
          {showKembalikanButton && (
            <Button variant="success" onClick={handleKembalikan}>
              <RotateCcw size={18} className="mr-2" />
              Kembalikan
            </Button>
          )}
          {can('peminjaman.update') && (
            <Button variant="warning" onClick={() => navigate(`/perpustakaan/peminjaman/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          )}
          {can('peminjaman.delete') && (
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-primary-50 dark:bg-primary-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                <BookOpen size={48} className="text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {peminjaman.buku?.judul || 'Buku Tidak Diketahui'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                ISBN: {peminjaman.buku?.isbn || '-'}
              </p>

              <div className="flex justify-center mb-4">
                {getStatusBadge(peminjaman.status)}
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID Peminjaman</span>
                  <span className="font-medium text-gray-900 dark:text-white">#{peminjaman.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tanggal Pinjam</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDate(peminjaman.tanggal_pinjam)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Jatuh Tempo</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatDate(peminjaman.tanggal_jatuh_tempo)}</span>
                </div>
                {peminjaman.tanggal_kembali && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Tanggal Kembali</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{formatDate(peminjaman.tanggal_kembali)}</span>
                  </div>
                )}
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
                {/* Siswa Info */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama Siswa</p>
                    <p className="font-medium text-gray-900 dark:text-white">{peminjaman.siswa?.nama || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">NIS</p>
                    <p className="font-medium text-gray-900 dark:text-white">{peminjaman.siswa?.nis || '-'}</p>
                  </div>
                </div>

                {/* Buku Info */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Judul Buku</p>
                    <p className="font-medium text-gray-900 dark:text-white">{peminjaman.buku?.judul || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">ISBN</p>
                    <p className="font-medium text-gray-900 dark:text-white">{peminjaman.buku?.isbn || '-'}</p>
                  </div>
                </div>

                {/* Tanggal Info */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Pinjam</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(peminjaman.tanggal_pinjam)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock size={20} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Jatuh Tempo</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(peminjaman.tanggal_jatuh_tempo)}</p>
                  </div>
                </div>

                {/* Tanggal Kembali */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <RotateCcw size={20} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Kembali</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(peminjaman.tanggal_kembali)}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={20} className="text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(peminjaman.status)}
                    </div>
                  </div>
                </div>

                {/* Keterangan */}
                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={20} className="text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Keterangan</p>
                    <p className="font-medium text-gray-900 dark:text-white">{peminjaman.keterangan || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDateTime(peminjaman.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDateTime(peminjaman.updated_at)}</p>
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

export default PeminjamanDetail