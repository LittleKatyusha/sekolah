import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Users, Building2, Briefcase, Calendar, Hash } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'
import { anggotaService } from '../services/organisasiService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const getLabel = (value, options) => {
  if (!value) return '-'
  const opt = options.find(o => o.value === String(value))
  return opt ? opt.label : value
}

const getStatusColorClass = (value) => {
  const lower = String(value ?? '').toLowerCase()
  if (lower === 'aktif') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}

const AnggotaDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const { options: statusOptions } = useReferenceOptions('status_organisasi')
  const [loading, setLoading] = useState(false)
  const [anggota, setAnggota] = useState(null)

  useEffect(() => {
    fetchAnggota()
  }, [id])

  const fetchAnggota = async () => {
    setLoading(true)
    const { data, error } = await anggotaService.getById(id)
    if (data) {
      setAnggota(data.data)
    } else {
      showError('Gagal mengambil data anggota')
      navigate('/organisasi/anggota')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const label = `Anggota #${anggota.id}`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await anggotaService.delete(anggota.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/organisasi/anggota')
      } else {
        showError('Gagal menghapus anggota')
      }
    }
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

  const getStatusBadge = (status) => {
    if (!status) return '-'
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColorClass(status)}`}>
        {getLabel(status, statusOptions)}
      </span>
    )
  }

  if (loading || !anggota) {
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
          <Button variant="secondary" onClick={() => navigate('/organisasi/anggota')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Anggota Organisasi</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="warning" onClick={() => navigate(`/organisasi/anggota/${id}/edit`)}>
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
        {/* Summary Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users size={48} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {anggota.siswa?.nama || '-'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {anggota.siswa?.nis || '-'}
              </p>
              <div className="flex justify-center gap-2 mb-2">
                {getStatusBadge(anggota.status)}
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{anggota.id}</span>
                </div>
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
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Siswa</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {anggota.siswa?.nama || '-'}
                    </p>
                    {anggota.siswa?.nis && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        NIS: {anggota.siswa.nis}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Organisasi</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {anggota.organisasi?.nama || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Jabatan</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {anggota.jabatan?.nama || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <div className="mt-1">{getStatusBadge(anggota.status)}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Mulai</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(anggota.tanggal_mulai)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-pink-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Selesai</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(anggota.tanggal_selesai)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(anggota.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(anggota.updated_at)}</p>
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

export default AnggotaDetail