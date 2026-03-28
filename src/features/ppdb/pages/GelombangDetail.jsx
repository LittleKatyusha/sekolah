import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Calendar, Hash, DollarSign, ToggleLeft } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { gelombangService } from '../services/ppdbService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import usePermission from '../../../hooks/usePermission'

const GelombangDetail = () => {
  const { can } = usePermission()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [gelombang, setGelombang] = useState(null)

  useEffect(() => {
    fetchGelombang()
  }, [id])

  const fetchGelombang = async () => {
    setLoading(true)
    const { data, error } = await gelombangService.getById(id)
    if (data) {
      setGelombang(data.data)
    } else {
      showError('Gagal mengambil data gelombang')
      navigate('/ppdb/gelombang')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `Gelombang "${gelombang.nama_gelombang || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await gelombangService.delete(gelombang.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/ppdb/gelombang')
      } else {
        showError('Gagal menghapus gelombang')
      }
    }
  }

  const handleToggleActive = async () => {
    const action = gelombang.is_active ? 'deactivate' : 'activate'
    const { error } = gelombang.is_active
      ? await gelombangService.deactivate(gelombang.id)
      : await gelombangService.activate(gelombang.id)
    if (!error) {
      showSuccess(`Gelombang berhasil di-${action}!`)
      fetchGelombang()
    } else {
      showError(`Gagal ${action} gelombang`)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-'
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value)
  }

  if (loading || !gelombang) {
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
          <Button variant="secondary" onClick={() => navigate('/ppdb/gelombang')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Gelombang</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleToggleActive}>
            <ToggleLeft size={18} className="mr-2" />
            {gelombang.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          </Button>
          {can('ppdb.gelombang.update') && (
            <Button variant="warning" onClick={() => navigate(`/ppdb/gelombang/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          )}
          {can('ppdb.gelombang.delete') && (
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Calendar size={48} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {gelombang.nama_gelombang || '-'}
              </h2>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${gelombang.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                {gelombang.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{gelombang.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Biaya</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(gelombang.biaya_pendaftaran)}</span>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama Gelombang</p>
                    <p className="font-medium text-gray-900 dark:text-white">{gelombang.nama_gelombang || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tahun Ajaran</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {gelombang.tahun_ajaran?.nama || gelombang.tahun_ajaran_id || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Mulai</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(gelombang.tgl_mulai)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Selesai</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(gelombang.tgl_selesai)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Biaya Pendaftaran</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(gelombang.biaya_pendaftaran)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ToggleLeft size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${gelombang.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {gelombang.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(gelombang.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(gelombang.updated_at)}</p>
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

export default GelombangDetail