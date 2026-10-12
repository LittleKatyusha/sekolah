import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, Calendar, Clock, MapPin, Award, User, Users, FileText } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { eksKegiatanService, eksSiswaService } from '../services/ekstrakurikulerService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_MAP = {
  dijadwalkan: { label: 'Dijadwalkan', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  terlaksana: { label: 'Terlaksana', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  dibatalkan: { label: 'Dibatalkan', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const EksKegiatanDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [kegiatan, setKegiatan] = useState(null)
  const [peserta, setPeserta] = useState([])

  useEffect(() => {
    setLoading(true)
    eksKegiatanService.getById(id).then(async (res) => {
      if (res.data?.data) {
        const k = res.data.data
        setKegiatan(k)
        if (k.ekstrakurikuler_id) {
          const resPeserta = await eksSiswaService.getByEkstrakurikuler(k.ekstrakurikuler_id)
          if (resPeserta.data?.data) setPeserta(resPeserta.data.data)
        }
      } else {
        showError('Data kegiatan tidak ditemukan')
        navigate('/ekstrakurikuler/kegiatan')
      }
    }).finally(() => setLoadingInFalse())
  }, [id, navigate])

  const setLoadingInFalse = () => setLoading(false)

  const handleDelete = async () => {
    const label = `Kegiatan "${kegiatan?.nama_kegiatan || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await eksKegiatanService.delete(id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        navigate('/ekstrakurikuler/kegiatan')
      } else {
        showError('Gagal menghapus kegiatan')
  if (loading || !kegiatan) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const statusInfo = STATUS_MAP[kegiatan.status] || { label: kegiatan.status, bg: 'bg-gray-100 text-gray-800' }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/ekstrakurikuler/kegiatan')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Kegiatan Ekstrakurikuler</h1>
        </div>
        <div className="flex gap-3">
          <PermissionGuard permission="ekstrakurikuler.kegiatan.manage">
            <Button variant="warning" onClick={() => navigate(`/ekstrakurikuler/kegiatan/${id}/edit`)}>
              <Edit size={18} className="mr-2" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="ekstrakurikuler.kegiatan.manage">
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={18} className="mr-2" />
              Hapus
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                    {kegiatan.ekstrakurikuler?.nama || 'Ekstrakurikuler'}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                    {kegiatan.nama_kegiatan}
                  </h2>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bg}`}>
                  {statusInfo.label}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <Calendar size={18} className="text-primary-600" />
                  <div>
                    <p className="text-xs text-gray-400">Tanggal Pelaksanaan</p>
                    <p className="font-medium">{kegiatan.tanggal ? new Date(kegiatan.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <Clock size={18} className="text-primary-600" />
                  <div>
                    <p className="text-xs text-gray-400">Waktu / Jam</p>
                    <p className="font-medium">{kegiatan.jadwal_waktu || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <MapPin size={18} className="text-primary-600" />
                  <div>
                    <p className="text-xs text-gray-400">Lokasi</p>
                    <p className="font-medium">{kegiatan.lokasi || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <User size={18} className="text-primary-600" />
                  <div>
                    <p className="text-xs text-gray-400">Pembina / Pendamping</p>
                    <p className="font-medium">{kegiatan.pembina?.nama || kegiatan.ekstrakurikuler?.pembina?.nama || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText size={18} className="text-primary-600" />
                Deskripsi & Agenda Kegiatan
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {kegiatan.deskripsi || 'Tidak ada deskripsi tambahan untuk kegiatan ini.'}
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users size={18} className="text-primary-600" />
                Anggota Terdaftar ({peserta.length})
              </h3>
              {peserta.length === 0 ? (
                <p className="text-sm text-gray-400">Belum ada anggota terdaftar di ekskul ini.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {peserta.map((p) => (
                    <div key={p.id} className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm flex items-center justify-between">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{p.siswa?.nama || `Siswa #${p.siswa_id}`}</span>
                      <span className="text-xs text-gray-400">{p.siswa?.nis || '-'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )

      }
    }
  }
}

export default EksKegiatanDetail
