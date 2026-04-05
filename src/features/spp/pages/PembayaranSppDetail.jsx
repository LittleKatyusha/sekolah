import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, DollarSign, User, Calendar, Hash, CreditCard, FileText } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { pembayaranSppService } from '../services/sppService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'

const getLabel = (value, options) => {
  if (!value || !options?.length) return value ?? '-'
  const opt = options.find(o => o.value === String(value) || o.value === value)
  return opt ? opt.label : value
}

const getStatusColorClass = (value) => {
  const v = String(value)
  if (v === '2' || v === 'lunas') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  if (v === '1' || v === 'belum_lunas' || v === 'belum bayar') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  if (v === '3' || v === 'pending') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  if (v === '4' || v === 'batal') return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}

const PembayaranSppDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [pembayaran, setPembayaran] = useState(null)
  const { options: statusBayarOptions } = useReferenceOptions('status_bayar')
  const { options: metodePembayaranOptions } = useReferenceOptions('metode_pembayaran')

  useEffect(() => {
    fetchPembayaran()
  }, [id])

  const fetchPembayaran = async () => {
    setLoading(true)
    const { data, error } = await pembayaranSppService.getById(id)
    if (data) {
      setPembayaran(data.data)
    } else {
      showError('Gagal mengambil data pembayaran SPP')
      navigate('/keuangan/pembayaran-spp')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `Pembayaran SPP #${pembayaran.id}`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await pembayaranSppService.delete(pembayaran.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/keuangan/pembayaran-spp')
      } else {
        showError('Gagal menghapus pembayaran SPP')
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '-'
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
  }

  const getStatusBadge = (status) => {
    if (status === null || status === undefined) return '-'
    const label = getLabel(status, statusBayarOptions)
    const bg = getStatusColorClass(status)
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg}`}>
        {label}
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
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <DollarSign size={48} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {pembayaran.siswa?.nama || '-'}
              </h2>
              {pembayaran.siswa?.nis && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">NIS: {pembayaran.siswa.nis}</p>
              )}
              <p className="text-2xl font-bold text-primary-600 mb-2">
                {formatCurrency(pembayaran.jumlah_bayar)}
              </p>
              <div className="mb-2">{getStatusBadge(pembayaran.status)}</div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{pembayaran.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Bulan</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {pembayaran.nama_bulan || pembayaran.bulan} {pembayaran.tahun}
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
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Siswa</p>
                    <p className="font-medium text-gray-900 dark:text-white">{pembayaran.siswa?.nama || '-'}</p>
                    {pembayaran.siswa?.nis && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">NIS: {pembayaran.siswa.nis}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tarif SPP</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(pembayaran.tarif_spp?.nominal)}
                    </p>
                    {pembayaran.tarif_spp?.kelas?.nama_kelas && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Kelas: {pembayaran.tarif_spp.kelas.nama_kelas}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Periode</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {pembayaran.nama_bulan || pembayaran.bulan} {pembayaran.tahun}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Bayar</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(pembayaran.tanggal_bayar)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Jumlah Bayar</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(pembayaran.jumlah_bayar)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <div className="mt-1">{getStatusBadge(pembayaran.status)}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard size={20} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Metode Pembayaran</p>
                    <p className="font-medium text-gray-900 dark:text-white">{getLabel(pembayaran.metode_pembayaran, metodePembayaranOptions)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Petugas</p>
                    <p className="font-medium text-gray-900 dark:text-white">{pembayaran.petugas?.name || '-'}</p>
                  </div>
                </div>
              </div>

              {pembayaran.keterangan && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Keterangan</h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{pembayaran.keterangan}</p>
                  </div>
                </div>
              )}

              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(pembayaran.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(pembayaran.updated_at)}</p>
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