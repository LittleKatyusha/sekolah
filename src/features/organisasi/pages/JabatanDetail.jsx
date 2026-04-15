import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Briefcase, Hash, AlignLeft, ListOrdered } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { jabatanService } from '../services/organisasiService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const JabatanDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [jabatan, setJabatan] = useState(null)

  useEffect(() => {
    fetchJabatan()
  }, [id])

  const fetchJabatan = async () => {
    setLoading(true)
    const { data, error } = await jabatanService.getById(id)
    if (data) {
      setJabatan(data.data)
    } else {
      showError('Gagal mengambil data jabatan')
      navigate('/organisasi/jabatan')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `Jabatan "${jabatan.nama || jabatan.id}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await jabatanService.delete(jabatan.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/organisasi/jabatan')
      } else {
        showError('Gagal menghapus jabatan')
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading || !jabatan) {
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
          <Button variant="secondary" onClick={() => navigate('/organisasi/jabatan')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Jabatan Organisasi</h1>
        </div>
        <div className="flex gap-3">
          <PermissionGuard permission="organisasi.jabatan.manage">
            <Button variant="warning" onClick={() => navigate(`/organisasi/jabatan/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="organisasi.jabatan.manage">
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
                <Briefcase size={48} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {jabatan.nama || '-'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Urutan: {jabatan.urutan ?? '-'}</p>
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{jabatan.id}</span>
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
                    <Briefcase size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama Jabatan</p>
                    <p className="font-medium text-gray-900 dark:text-white">{jabatan.nama || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ListOrdered size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Urutan</p>
                    <p className="font-medium text-gray-900 dark:text-white">{jabatan.urutan ?? '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlignLeft size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Deskripsi</p>
                    <p className="font-medium text-gray-900 dark:text-white">{jabatan.deskripsi || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(jabatan.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-50 dark:bg-gray-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Diperbarui</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(jabatan.updated_at)}</p>
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

export default JabatanDetail
