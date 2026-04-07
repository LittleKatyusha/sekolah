import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit, Trash2, Users } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { kuotaJurusanService, gelombangService } from '../services/ppdbService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const KuotaJurusanList = () => {
  const { gelombangId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [kuotas, setKuotas] = useState([])
  const [summary, setSummary] = useState(null)
  const [gelombang, setGelombang] = useState(null)

  useEffect(() => {
    fetchData()
  }, [gelombangId])

  const fetchData = async () => {
    setLoading(true)
    const [kuotaRes, summaryRes, gelombangRes] = await Promise.all([
      kuotaJurusanService.getByGelombang(gelombangId),
      kuotaJurusanService.getSummary(gelombangId),
      gelombangService.getById(gelombangId),
    ])
    if (kuotaRes.data) setKuotas(kuotaRes.data.data || [])
    if (summaryRes.data) setSummary(summaryRes.data.data)
    if (gelombangRes.data) setGelombang(gelombangRes.data.data)
    setLoading(false)
  }

  const handleDelete = async (kuota) => {
    const result = await showDeleteConfirm(`Kuota jurusan "${kuota.nama_jurusan}"`)
    if (result.isConfirmed) {
      const { error } = await kuotaJurusanService.delete(kuota.id)
      if (!error) {
        showSuccess('Kuota jurusan berhasil dihapus!')
        fetchData()
      } else {
        showError('Gagal menghapus kuota jurusan')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate(`/ppdb/gelombang/${gelombangId}`)}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kuota Jurusan</h1>
            {gelombang && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{gelombang.nama_gelombang}</p>
            )}
          </div>
        </div>
        <PermissionGuard permission="ppdb.seleksi.manage">
          <Button onClick={() => navigate(`/ppdb/gelombang/${gelombangId}/kuota/create`)}>
            <Plus size={18} className="mr-2" />
            Tambah Kuota
          </Button>
        </PermissionGuard>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Kuota', value: summary.total_kuota, color: 'blue' },
            { label: 'Total Terisi', value: summary.total_terisi, color: 'green' },
            { label: 'Sisa Kuota', value: summary.total_sisa, color: 'yellow' },
            { label: 'Cadangan Terisi', value: summary.total_terisi_cadangan, color: 'purple' },
          ].map(item => (
            <Card key={item.label}>
              <div className="p-4 text-center">
                <div className={`text-3xl font-bold text-${item.color}-600 dark:text-${item.color}-400`}>
                  {item.value}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.label}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {kuotas.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Belum ada kuota jurusan
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Tambahkan kuota per jurusan, atau biarkan kosong untuk kuota global dari gelombang.
            </p>
            <PermissionGuard permission="ppdb.seleksi.manage">
              <Button onClick={() => navigate(`/ppdb/gelombang/${gelombangId}/kuota/create`)}>
                <Plus size={18} className="mr-2" />
                Tambah Kuota Jurusan
              </Button>
            </PermissionGuard>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {(summary?.per_jurusan || kuotas).map((k) => {
            const persen = k.persentase_terisi ?? (k.kuota > 0 ? Math.round((k.terisi / k.kuota) * 100) : 0)
            return (
              <Card key={k.id}>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{k.nama_jurusan}</h3>
                      {k.jurusan_id && (
                        <span className="text-xs text-gray-400">ID Jurusan: {k.jurusan_id}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <PermissionGuard permission="ppdb.seleksi.manage">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/ppdb/gelombang/${gelombangId}/kuota/${k.id}/edit`)}
                        >
                          <Edit size={14} />
                        </Button>
                      </PermissionGuard>
                      <PermissionGuard permission="ppdb.seleksi.manage">
                        <Button variant="danger" size="sm" onClick={() => handleDelete(k)}>
                          <Trash2 size={14} />
                        </Button>
                      </PermissionGuard>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all ${persen >= 100 ? 'bg-red-500' : persen >= 80 ? 'bg-yellow-400' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(persen, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex gap-4">
                      <span>Kuota: <strong className="text-gray-900 dark:text-white">{k.kuota}</strong></span>
                      <span>Terisi: <strong className="text-green-600">{k.terisi ?? 0}</strong></span>
                      <span>Sisa: <strong className="text-blue-600">{k.sisa_kuota ?? (k.kuota - (k.terisi || 0))}</strong></span>
                    </div>
                    <div className="flex gap-4">
                      <span>Cadangan: <strong className="text-purple-600">{k.kuota_cadangan}</strong></span>
                      <span className={`font-bold ${persen >= 100 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                        {persen}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default KuotaJurusanList
