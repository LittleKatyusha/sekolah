import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Hash, Target, BarChart3, Tag } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { kriteriaService } from '../services/spkService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import usePermission from '../../../hooks/usePermission'

const TIPE_MAP = {
  benefit: { label: 'Benefit', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cost: { label: 'Cost', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const KriteriaDetail = () => {
  const { can } = usePermission()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [kriteria, setKriteria] = useState(null)

  useEffect(() => {
    fetchKriteria()
  }, [id])

  const fetchKriteria = async () => {
    setLoading(true)
    const { data, error } = await kriteriaService.getById(id)
    if (data) {
      setKriteria(data.data)
    } else {
      showError('Gagal mengambil data kriteria')
      navigate('/spk/kriteria')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `Kriteria "${kriteria.nama_kriteria || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await kriteriaService.delete(kriteria.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/spk/kriteria')
      } else {
        showError('Gagal menghapus kriteria')
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const getTipeBadge = (tipe) => {
    if (!tipe) return '-'
    const tipeInfo = TIPE_MAP[tipe] || { label: tipe, bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${tipeInfo.bg}`}>
        {tipeInfo.label}
      </span>
    )
  }

  if (loading || !kriteria) {
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
          <Button variant="secondary" onClick={() => navigate('/spk/kriteria')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Kriteria</h1>
        </div>
        <div className="flex gap-3">
          {can('spk-kriteria.update') && (
            <Button variant="warning" onClick={() => navigate(`/spk/kriteria/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          )}
          {can('spk-kriteria.delete') && (
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
                <Target size={48} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {kriteria.nama_kriteria || '-'}
              </h2>
              <div className="flex justify-center gap-2 mb-2">
                {getTipeBadge(kriteria.tipe)}
              </div>
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{kriteria.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Kode</span>
                  <span className="font-medium text-gray-900 dark:text-white">{kriteria.kode_kriteria || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Bobot</span>
                  <span className="font-medium text-gray-900 dark:text-white">{kriteria.bobot ?? '-'}</span>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kode Kriteria</p>
                    <p className="font-medium text-gray-900 dark:text-white">{kriteria.kode_kriteria || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Tag size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama Kriteria</p>
                    <p className="font-medium text-gray-900 dark:text-white">{kriteria.nama_kriteria || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bobot</p>
                    <p className="font-medium text-gray-900 dark:text-white">{kriteria.bobot ?? '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tipe</p>
                    <div className="mt-1">{getTipeBadge(kriteria.tipe)}</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(kriteria.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(kriteria.updated_at)}</p>
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

export default KriteriaDetail