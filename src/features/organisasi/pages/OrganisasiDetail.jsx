import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Building2, User, Calendar, Hash, Users, Briefcase } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { organisasiService, anggotaService } from '../services/organisasiService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import usePermission from '../../../hooks/usePermission'

const STATUS_MAP = {
  aktif: { label: 'Aktif', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  nonaktif: { label: 'Nonaktif', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const OrganisasiDetail = () => {
  const { can } = usePermission()
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [organisasi, setOrganisasi] = useState(null)
  const [anggotaList, setAnggotaList] = useState([])

  useEffect(() => {
    fetchOrganisasi()
    fetchAnggota()
  }, [id])

  const fetchOrganisasi = async () => {
    setLoading(true)
    const { data, error } = await organisasiService.getById(id)
    if (data) {
      setOrganisasi(data.data)
    } else {
      showError('Gagal mengambil data organisasi')
      navigate('/organisasi')
    }
    setLoading(false)
  }

  const fetchAnggota = async () => {
    const { data } = await anggotaService.getByOrganisasi(id)
    if (data?.data) {
      setAnggotaList(data.data)
    }
  }

  const handleDelete = async () => {
    const label = `Organisasi "${organisasi.nama || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await organisasiService.delete(organisasi.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/organisasi')
      } else {
        showError('Gagal menghapus organisasi')
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
    const statusInfo = STATUS_MAP[status] || { label: status, bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg}`}>
        {statusInfo.label}
      </span>
    )
  }

  if (loading || !organisasi) {
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
          <Button variant="secondary" onClick={() => navigate('/organisasi')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Organisasi</h1>
        </div>
        <div className="flex gap-3">
          {can('organisasi.update') && (
            <Button variant="warning" onClick={() => navigate(`/organisasi/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          )}
          {can('organisasi.delete') && (
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Building2 size={48} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {organisasi.nama || '-'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{organisasi.kode || '-'}</p>
              <div className="flex justify-center gap-2 mb-2">
                {getStatusBadge(organisasi.status)}
              </div>

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">{organisasi.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Anggota</span>
                  <span className="font-medium text-gray-900 dark:text-white">{anggotaList.length}</span>
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
                    <Hash size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kode</p>
                    <p className="font-medium text-gray-900 dark:text-white">{organisasi.kode || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama</p>
                    <p className="font-medium text-gray-900 dark:text-white">{organisasi.nama || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pembina (Guru)</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {organisasi.pembina?.nama || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Periode</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {organisasi.periode_mulai
                        ? organisasi.periode_selesai
                          ? `${organisasi.periode_mulai} - ${organisasi.periode_selesai}`
                          : `${organisasi.periode_mulai} - ...`
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Hash size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                    <div className="mt-1">{getStatusBadge(organisasi.status)}</div>
                  </div>
                </div>
              </div>

              {/* Deskripsi */}
              {organisasi.deskripsi && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Deskripsi</h4>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{organisasi.deskripsi}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(organisasi.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                    <p className="text-gray-700 dark:text-gray-300">{formatDate(organisasi.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Anggota List */}
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Anggota</h3>
          </div>

          {anggotaList.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Belum ada anggota terdaftar</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Nama Siswa</th>
                    <th className="px-4 py-3">NIS</th>
                    <th className="px-4 py-3">Jabatan</th>
                    <th className="px-4 py-3">Tanggal Mulai</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {anggotaList.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{index + 1}</td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {item.siswa?.nama || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {item.siswa?.nis || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {item.jabatan?.nama || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {formatDate(item.tanggal_mulai)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(item.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default OrganisasiDetail