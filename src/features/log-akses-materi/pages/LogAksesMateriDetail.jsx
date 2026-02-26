import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Clock, Monitor, User, BookOpen } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { logAksesMateriService } from '../services/logAksesMateriService'
import { showError } from '../../../utils/sweetalert'

const LogAksesMateriDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    setLoading(true)
    const { data: res, error } = await logAksesMateriService.getById(id)
    if (res?.data) setData(res.data)
    else { showError('Gagal mengambil data log'); navigate('/akademik/log-akses-materi') }
    setLoading(false)
  }

  const formatDurasi = (detik) => {
    if (!detik) return '-'
    const h = Math.floor(detik / 3600)
    const m = Math.floor((detik % 3600) / 60)
    const s = detik % 60
    const parts = []
    if (h > 0) parts.push(`${h} jam`)
    if (m > 0) parts.push(`${m} menit`)
    if (s > 0) parts.push(`${s} detik`)
    return parts.join(' ') || '0 detik'
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  if (!data) return null

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      {Icon && <Icon size={18} className="text-gray-400 mt-0.5 shrink-0" />}
      <div><p className="text-sm text-gray-500 dark:text-gray-400">{label}</p><p className="text-sm font-medium text-gray-900 dark:text-white">{value || '-'}</p></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/log-akses-materi')}><ArrowLeft size={18} /></Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Log Akses #{data.id}</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informasi Akses</h2>
            <InfoRow label="ID" value={data.id} icon={FileText} />
            <InfoRow label="Materi" value={data.materi?.judul || data.mst_materi_id} icon={BookOpen} />
            <InfoRow label="Siswa" value={data.siswa?.nama_lengkap || data.mst_siswa_id} icon={User} />
            <InfoRow label="Waktu Akses" value={data.waktu_akses ? new Date(data.waktu_akses).toLocaleString('id-ID') : '-'} icon={Clock} />
            <InfoRow label="Durasi" value={formatDurasi(data.durasi_detik)} icon={Clock} />
            <InfoRow label="Perangkat" value={data.perangkat} icon={Monitor} />
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Metadata</h2>
            <InfoRow label="Materi ID" value={data.mst_materi_id} icon={FileText} />
            <InfoRow label="Siswa ID" value={data.mst_siswa_id} icon={FileText} />
            <InfoRow label="Dibuat" value={data.created_at ? new Date(data.created_at).toLocaleString('id-ID') : '-'} icon={Clock} />
            <InfoRow label="Diperbarui" value={data.updated_at ? new Date(data.updated_at).toLocaleString('id-ID') : '-'} icon={Clock} />
          </div>
        </Card>
      </div>
    </div>
  )
}

export default LogAksesMateriDetail