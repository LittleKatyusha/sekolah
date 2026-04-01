import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, DollarSign, User, Calendar, Hash, CreditCard, FileText, Wallet, Clock } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { pembayaranSppService } from '../services/pembayaranSppService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatDate, formatDateTime, formatRupiah } from '../../../utils/formatters'

// Status map for payment status badges
const STATUS_MAP = {
  lunas: { label: 'Lunas', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  belum_lunas: { label: 'Belum Lunas', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  sebagian: { label: 'Sebagian', bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
}

// Indonesian month names
const BULAN_MAP = {
  1: 'Januari',
  2: 'Februari',
  3: 'Maret',
  4: 'April',
  5: 'Mei',
  6: 'Juni',
  7: 'Juli',
  8: 'Agustus',
  9: 'September',
  10: 'Oktober',
  11: 'November',
  12: 'Desember',
}

const PembayaranSppDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  usePageTitle('Detail Pembayaran SPP')

  const [loading, setLoading] = useState(false)
  const [pembayaran, setPembayaran] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchPembayaran(controller)
    return () => controller.abort()
  }, [id])

  const fetchPembayaran = async (controller) => {
    setLoading(true)
    const { data, error } = await pembayaranSppService.getPembayaranSppById(id)
    if (controller?.signal?.aborted) return
    if (data) {
      setPembayaran(data.data)
    } else {
      showError('Gagal mengambil data pembayaran SPP')
      navigate('/keuangan/pembayaran-spp')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `pembayaran SPP untuk ${pembayaran.siswa?.nama || 'siswa'} periode ${getBulanName(pembayaran.bulan)} ${pembayaran.tahun}`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await pembayaranSppService.deletePembayaranSpp(pembayaran.id)
      if (!error) {
        showSuccess('Pembayaran SPP berhasil dihapus!')
        navigate('/keuangan/pembayaran-spp')
      } else {
        showError('Gagal menghapus pembayaran SPP')
      }
    }
  }

  const getBulanName = (bulan) => {
    if (!bulan) return '-'
    return BULAN_MAP[bulan] || String(bulan)
  }

  const getStatusBadge = (status) => {
    if (status === null || status === undefined) return '-'
    const statusInfo = STATUS_MAP[status] || { label: String(status), bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg}`}>
        {statusInfo.label}
      </span>
    )
  }

  if (loading || !pembayaran) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Back, Edit, Delete buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/keuangan/pembayaran-spp')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Pembayaran SPP</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="warning" onClick={() => navigate(`/keuangan/pembayaran-spp/${id}/edit`)}>
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
        {/* Left Column - Summary Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full mx-auto mb-4 flex items-center justify-center">
                <DollarSign size={48} className="text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {pembayaran.siswa?.nama || '-'}
              </h2>
              {pembayaran.siswa?.nis && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">NIS: {pembayaran.siswa.nis}</p>
              )}
              {pembayaran.siswa?.kelas?.nama_kelas && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Kelas: {pembayaran.siswa.kelas.nama_kelas}</p>
              )}
              <p className="text-2xl font-bold text-primary-600 mb-3">
                {formatRupiah(pembayaran.jumlah_bayar)}
              </p>
              <div className="mb-4">{getStatusBadge(pembayaran.status)}</div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">#{pembayaran.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Periode</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getBulanName(pembayaran.bulan)} {pembayaran.tahun}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Detailed Info */}
        <div className="md:col-span-2">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informasi Pembayaran</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Siswa Information */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama Siswa</p>
                    <p className="font-medium text-gray-900 dark:text-white">{pembayaran.siswa?.nama || '-'}</p>
                    {pembayaran.siswa?.nis && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">NIS: {pembayaran.siswa.nis}</p>
                    )}
                  </div>
                </div>

                {/* Kelas */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kelas</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {pembayaran.siswa?.kelas?.nama_kelas || pembayaran.kelas?.nama_kelas || '-'}
                    </p>
                  </div>
                </div>

                {/* Periode Bulan/Tahun */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Periode</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {getBulanName(pembayaran.bulan)} {pembayaran.tahun}
                    </p>
                  </div>
                </div>

                {/* Tanggal Bayar */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Bayar</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(pembayaran.tanggal_bayar)}
                    </p>
                  </div>
                </div>

                {/* Jumlah Bayar */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wallet size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Jumlah Bayar</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatRupiah(pembayaran.jumlah_bayar)}
                    </p>
                  </div>
                </div>

                {/* Denda */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign size={20} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Denda</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatRupiah(pembayaran.denda)}
                    </p>
                  </div>
                </div>

                {/* Metode Pembayaran */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard size={20} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Metode Pembayaran</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {pembayaran.metode_pembayaran || '-'}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <div className="mt-1">{getStatusBadge(pembayaran.status)}</div>
                  </div>
                </div>

                {/* Petugas */}
                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="w-10 h-10 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Petugas</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {pembayaran.petugas?.name || pembayaran.petugas?.nama || '-'}
                    </p>
                    {pembayaran.petugas?.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{pembayaran.petugas.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Keterangan */}
              {pembayaran.keterangan && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-50 dark:bg-gray-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText size={20} className="text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Keterangan</p>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{pembayaran.keterangan}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(pembayaran.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar size={20} className="text-rose-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDateTime(pembayaran.updated_at)}</p>
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

export default PembayaranSppDetail
