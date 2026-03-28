import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { ujianJawabanService } from '../services/ujianJawabanService'
import { showError } from '../../../utils/sweetalert'
import usePermission from '../../../hooks/usePermission'

const UjianJawabanDetail = () => {
  const { can } = usePermission()
  const navigate = useNavigate()
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    setLoading(true)
    const { data: res, error } = await ujianJawabanService.getById(id)
    if (res?.data) setData(res.data)
    else { showError('Gagal mengambil data jawaban'); navigate('/akademik/ujian-jawaban') }
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  if (!data) return null

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      {Icon && <Icon size={18} className="text-gray-400 mt-0.5 shrink-0" />}
      <div><p className="text-sm text-gray-500 dark:text-gray-400">{label}</p><p className="text-sm font-medium text-gray-900 dark:text-white">{value || '-'}</p></div>
    </div>
  )

  const BoolBadge = ({ value, trueLabel = 'Ya', falseLabel = 'Tidak', trueColor = 'green', falseColor = 'gray' }) => {
    if (value === null || value === undefined) return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">-</span>
    const color = value ? trueColor : falseColor
    return <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800 dark:bg-${color}-900/30 dark:text-${color}-400`}>{value ? trueLabel : falseLabel}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/akademik/ujian-jawaban')}><ArrowLeft size={18} /></Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Jawaban #{data.id}</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informasi Jawaban</h2>
            <InfoRow label="ID" value={data.id} icon={FileText} />
            <InfoRow label="Ujian User ID" value={data.trx_ujian_user_id} icon={FileText} />
            <InfoRow label="Soal ID" value={data.mst_soal_id} icon={FileText} />
            <InfoRow label="Opsi ID" value={data.mst_soal_opsi_id} icon={FileText} />
            <InfoRow label="Jawaban Teks" value={data.jawaban_teks} icon={FileText} />
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status</h2>
            <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700">
              <CheckCircle size={18} className="text-gray-400 mt-0.5 shrink-0" />
              <div><p className="text-sm text-gray-500 dark:text-gray-400">Benar</p><BoolBadge value={data.is_benar} trueColor="green" falseColor="red" /></div>
            </div>
            <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700">
              <HelpCircle size={18} className="text-gray-400 mt-0.5 shrink-0" />
              <div><p className="text-sm text-gray-500 dark:text-gray-400">Ragu-ragu</p><BoolBadge value={data.ragu_ragu} trueColor="yellow" falseColor="gray" /></div>
            </div>
            <InfoRow label="Dibuat" value={data.created_at ? new Date(data.created_at).toLocaleString('id-ID') : '-'} icon={FileText} />
            <InfoRow label="Diperbarui" value={data.updated_at ? new Date(data.updated_at).toLocaleString('id-ID') : '-'} icon={FileText} />
          </div>
        </Card>
      </div>
    </div>
  )
}

export default UjianJawabanDetail