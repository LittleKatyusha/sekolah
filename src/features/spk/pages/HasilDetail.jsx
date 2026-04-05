import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Trophy, User, BarChart3, Calendar } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { hasilService } from '../services/spkService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const HasilDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [hasil, setHasil] = useState(null)

  useEffect(() => {
    fetchHasil()
  }, [id])

  const fetchHasil = async () => {
    setLoading(true)
    const { data, error } = await hasilService.getById(id)
    if (data) {
      setHasil(data.data)
    } else {
      showError('Gagal mengambil data hasil SPK')
      navigate('/spk/hasil')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const siswaName = hasil.siswa?.nama || ''
    const label = `Hasil SPK "${siswaName}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await hasilService.delete(hasil.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/spk/hasil')
      } else {
        showError('Gagal menghapus hasil SPK')
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading || !hasil) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const rankBadgeColor = hasil.peringkat <= 3
    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/spk/hasil')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Hasil SPK</h1>
        </div>
        <div className="flex gap-3">
          <PermissionGuard permission="spk.delete">
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
                <Trophy size={48} className="text-yellow-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {hasil.siswa?.nama || '-'}
              </h2>
              <div className="flex justify-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${rankBadgeColor}`}>
                  Peringkat #{hasil.peringkat ?? '-'}
                </span>
              </div>
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{hasil.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Total Skor</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {hasil.total_skor != null ? Number(hasil.total_skor).toFixed(4) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Periode</span>
                  <span className="font-medium text-gray-900 dark:text-white">{hasil.periode || '-'}</span>
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
                    <p className="font-medium text-gray-900 dark:text-white">{hasil.siswa?.nama || '-'}</p>
                    {hasil.siswa?.nis && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">NIS: {hasil.siswa.nis}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kelas</p>
                    <p className="font-medium text-gray-900 dark:text-white">{hasil.siswa?.kelas?.nama_kelas || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Trophy size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Peringkat</p>
                    <div className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${rankBadgeColor}`}>
                        #{hasil.peringkat ?? '-'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Skor</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {hasil.total_skor != null ? Number(hasil.total_skor).toFixed(4) : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Periode</p>
                    <p className="font-medium text-gray-900 dark:text-white">{hasil.periode || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(hasil.created_at)}</p>
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

export default HasilDetail