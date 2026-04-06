import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, User, Target, Hash, Calendar } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { penilaianService } from '../services/spkService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const PenilaianDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [penilaian, setPenilaian] = useState(null)

  useEffect(() => {
    fetchPenilaian()
  }, [id])

  const fetchPenilaian = async () => {
    setLoading(true)
    const { data, error } = await penilaianService.getById(id)
    if (data) {
      setPenilaian(data.data)
    } else {
      showError('Gagal mengambil data penilaian')
      navigate('/spk/penilaian')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const siswaName = penilaian.siswa?.nama || ''
    const kriteriaName = penilaian.kriteria?.nama_kriteria || ''
    const label = `Penilaian "${siswaName} - ${kriteriaName}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await penilaianService.delete(penilaian.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/spk/penilaian')
      } else {
        showError('Gagal menghapus penilaian')
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading || !penilaian) {
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
          <Button variant="secondary" onClick={() => navigate('/spk/penilaian')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Penilaian</h1>
        </div>
        <div className="flex gap-3">
          <PermissionGuard permission="spk.edit">
            <Button variant="warning" onClick={() => navigate(`/spk/penilaian/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
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
                <Hash size={48} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {penilaian.siswa?.nama || '-'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {penilaian.kriteria?.nama_kriteria || '-'}
              </p>
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{penilaian.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Nilai</span>
                  <span className="font-medium text-gray-900 dark:text-white">{penilaian.nilai ?? '-'}</span>
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
                    <p className="font-medium text-gray-900 dark:text-white">{penilaian.siswa?.nama || '-'}</p>
                    {penilaian.siswa?.nis && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">NIS: {penilaian.siswa.nis}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kriteria</p>
                    <p className="font-medium text-gray-900 dark:text-white">{penilaian.kriteria?.nama_kriteria || '-'}</p>
                    {penilaian.kriteria?.kode_kriteria && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Kode: {penilaian.kriteria.kode_kriteria}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nilai</p>
                    <p className="font-medium text-gray-900 dark:text-white">{penilaian.nilai ?? '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tahun Ajaran</p>
                    <p className="font-medium text-gray-900 dark:text-white">{penilaian.tahun_ajaran || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(penilaian.created_at)}</p>
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

export default PenilaianDetail