import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit, Trash2, Sliders, AlertCircle, CheckCircle } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { kriteriaSeleksiService, gelombangService } from '../services/ppdbService'
import { showDeleteConfirm, showSuccess, showError, showConfirm } from '../../../utils/sweetalert'

const TIPE_LABELS = {
  benefit: { label: 'Benefit', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cost: { label: 'Cost', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const KriteriaSeleksiList = () => {
  const { gelombangId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [kriterias, setKriterias] = useState([])
  const [totalBobot, setTotalBobot] = useState(0)
  const [gelombang, setGelombang] = useState(null)
  const [seedLoading, setSeedLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [gelombangId])

  const fetchData = async () => {
    setLoading(true)
    const [kriteriaRes, gelombangRes] = await Promise.all([
      kriteriaSeleksiService.getByGelombang(gelombangId),
      gelombangService.getById(gelombangId),
    ])
    if (kriteriaRes.data) {
      setKriterias(kriteriaRes.data.data?.data || kriteriaRes.data.data || [])
      setTotalBobot(kriteriaRes.data.data?.total_bobot ?? 0)
    }
    if (gelombangRes.data) setGelombang(gelombangRes.data.data)
    setLoading(false)
  }

  const handleDelete = async (kriteria) => {
    const result = await showDeleteConfirm(`Kriteria "${kriteria.nama_kriteria}"`)
    if (result.isConfirmed) {
      const { error } = await kriteriaSeleksiService.delete(kriteria.id)
      if (!error) {
        showSuccess('Kriteria berhasil dihapus!')
        fetchData()
      } else {
        showError('Gagal menghapus kriteria')
      }
    }
  }

  const handleSeedDefault = async () => {
    const result = await showConfirm(
      'Akan dibuat 4 kriteria default (Nilai Rapor, Prestasi, Perilaku, Matematika). Lanjutkan?',
      'Buat Kriteria Default'
    )
    if (result.isConfirmed) {
      setSeedLoading(true)
      const { error } = await kriteriaSeleksiService.seedDefault(gelombangId)
      if (!error) {
        showSuccess('Kriteria default berhasil dibuat!')
        fetchData()
      } else {
        showError('Gagal membuat kriteria default')
      }
      setSeedLoading(false)
    }
  }

  const bobotValid = Math.abs(totalBobot - 100) <= 0.01

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kriteria Seleksi</h1>
            {gelombang && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {gelombang.nama_gelombang}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {kriterias.length === 0 && (
            <PermissionGuard permission="ppdb.seleksi.manage">
              <Button variant="secondary" onClick={handleSeedDefault} disabled={seedLoading}>
                <Sliders size={18} className="mr-2" />
                {seedLoading ? 'Membuat...' : 'Template Default'}
              </Button>
            </PermissionGuard>
          )}
          <PermissionGuard permission="ppdb.seleksi.manage">
            <Button onClick={() => navigate(`/ppdb/gelombang/${gelombangId}/kriteria/create`)}>
              <Plus size={18} className="mr-2" />
              Tambah Kriteria
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Bobot indicator */}
      <Card>
        <div className="p-4 flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            ${bobotValid
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
            }`}>
            {bobotValid
              ? <CheckCircle size={16} />
              : <AlertCircle size={16} />
            }
            Total Bobot: <span className="font-bold ml-1">{Number(totalBobot).toFixed(1)}%</span>
            {!bobotValid && ' (harus 100%)'}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {kriterias.length} kriteria aktif terdaftar
          </p>
        </div>
      </Card>

      {/* Bobot progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${bobotValid ? 'bg-green-500' : 'bg-yellow-400'}`}
          style={{ width: `${Math.min(totalBobot, 100)}%` }}
        />
      </div>

      {kriterias.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <Sliders size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Belum ada kriteria seleksi
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Tambahkan kriteria atau gunakan template default untuk memulai.
            </p>
            <PermissionGuard permission="ppdb.seleksi.manage">
              <Button onClick={handleSeedDefault} disabled={seedLoading}>
                <Sliders size={18} className="mr-2" />
                Buat Template Default
              </Button>
            </PermissionGuard>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {kriterias.map((k, idx) => (
            <Card key={k.id}>
              <div className="p-5 flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white">{k.nama_kriteria}</span>
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                      {k.kode_kriteria}
                    </code>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIPE_LABELS[k.tipe]?.color}`}>
                      {TIPE_LABELS[k.tipe]?.label ?? k.tipe}
                    </span>
                    {!k.is_active && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  {k.deskripsi && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{k.deskripsi}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>Range: {k.nilai_min}–{k.nilai_max}</span>
                    {k.source_field && <span>Sumber: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{k.source_field}</code></span>}
                  </div>
                </div>

                {/* Bobot gauge */}
                <div className="flex-shrink-0 text-center w-16">
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {Number(k.bobot).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-400">%</div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <PermissionGuard permission="ppdb.seleksi.manage">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/ppdb/gelombang/${gelombangId}/kriteria/${k.id}/edit`)}
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
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default KriteriaSeleksiList
