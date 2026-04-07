import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Play, Eye, Lock, RotateCcw, ShieldAlert,
  CheckCircle, AlertCircle, Users, Award, TrendingUp, Loader
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { seleksiService, gelombangService, kriteriaSeleksiService, kuotaJurusanService } from '../services/ppdbService'
import { showSuccess, showError, showConfirm, showDeleteConfirm } from '../../../utils/sweetalert'

const STATUS_COLORS = {
  lolos: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cadangan: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  tidak_lolos: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  menunggu: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const STATUS_LABELS = {
  lolos: 'Lolos',
  cadangan: 'Cadangan',
  tidak_lolos: 'Tidak Lolos',
  menunggu: 'Menunggu',
}

const METODE_LABELS = {
  manual: 'Manual',
  saw: 'SAW (Simple Additive Weighting)',
  weighted_rank: 'Weighted Rank',
}

const SeleksiEngine = () => {
  const { gelombangId } = useParams()
  const navigate = useNavigate()

  const [gelombang, setGelombang] = useState(null)
  const [kriterias, setKriterias] = useState([])
  const [kuotaSummary, setKuotaSummary] = useState(null)
  const [hasil, setHasil] = useState([])
  const [previewData, setPreviewData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [runLoading, setRunLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [fraudLoading, setFraudLoading] = useState(false)
  const [finalizeLoading, setFinalizeLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'preview' | 'hasil'

  const [options, setOptions] = useState({
    with_fraud_scan: true,
    include_fraud_suspect: false,
    sync_status_pendaftaran: true,
  })

  useEffect(() => {
    fetchAll()
  }, [gelombangId])

  const fetchAll = async () => {
    setLoading(true)
    const [gelombangRes, kriteriaRes, kuotaRes, hasilRes] = await Promise.all([
      gelombangService.getById(gelombangId),
      kriteriaSeleksiService.getByGelombang(gelombangId),
      kuotaJurusanService.getSummary(gelombangId),
      seleksiService.getHasilByGelombang(gelombangId),
    ])
    if (gelombangRes.data) setGelombang(gelombangRes.data.data)
    if (kriteriaRes.data) {
      const d = kriteriaRes.data.data
      setKriterias(d?.data || d || [])
    }
    if (kuotaRes.data) setKuotaSummary(kuotaRes.data.data)
    if (hasilRes.data) setHasil(hasilRes.data.data || [])
    setLoading(false)
  }

  const totalBobot = kriterias.reduce((s, k) => s + parseFloat(k.bobot || 0), 0)
  const bobotValid = Math.abs(totalBobot - 100) <= 0.01
  const hasFinalized = hasil.some(h => h.is_finalized)
  const canRun = gelombang && gelombang.metode_seleksi !== 'manual' && bobotValid && !hasFinalized

  const handleRunSeleksi = async () => {
    if (!canRun) return
    const result = await showConfirm(
      `Seleksi akan dijalankan menggunakan metode ${METODE_LABELS[gelombang.metode_seleksi]}. ${options.with_fraud_scan ? 'Fraud scan akan dijalankan terlebih dahulu. ' : ''}Data yang ada akan ditimpa. Lanjutkan?`,
      'Jalankan Seleksi Otomatis'
    )
    if (!result.isConfirmed) return

    setRunLoading(true)
    const { data, error } = await seleksiService.jalankan(gelombangId, options)
    if (!error && data) {
      const r = data.data
      showSuccess(`Seleksi selesai! Lolos: ${r.ringkasan?.lolos ?? 0}, Cadangan: ${r.ringkasan?.cadangan ?? 0}, Tidak Lolos: ${r.ringkasan?.tidak_lolos ?? 0}`)
      setHasil(r.hasil || [])
      setActiveTab('hasil')
      fetchAll()
    } else {
      showError(error?.message || 'Gagal menjalankan seleksi')
    }
    setRunLoading(false)
  }

  const handlePreview = async () => {
    setPreviewLoading(true)
    const { data, error } = await seleksiService.simulasi(gelombangId, {
      include_fraud_suspect: options.include_fraud_suspect,
    })
    if (!error && data) {
      setPreviewData(data.data)
      setActiveTab('preview')
    } else {
      showError(error?.message || 'Gagal menjalankan simulasi')
    }
    setPreviewLoading(false)
  }

  const handleFraudScan = async () => {
    setFraudLoading(true)
    const { data, error } = await seleksiService.fraudScan(gelombangId)
    if (!error && data) {
      const r = data.data
      showSuccess(`Fraud scan selesai! Terflag: ${r.flagged}, Bersih: ${r.clean}`)
    } else {
      showError('Gagal menjalankan fraud scan')
    }
    setFraudLoading(false)
  }

  const handleFinalisasi = async () => {
    const result = await showConfirm(
      'Setelah difinalisasi, hasil tidak dapat diubah oleh sistem secara otomatis. Pastikan data sudah benar. Lanjutkan?',
      'Finalisasi Hasil Seleksi'
    )
    if (!result.isConfirmed) return

    setFinalizeLoading(true)
    const { data, error } = await seleksiService.finalisasi(gelombangId)
    if (!error) {
      showSuccess('Hasil seleksi berhasil difinalisasi!')
      fetchAll()
    } else {
      showError('Gagal finalisasi hasil seleksi')
    }
    setFinalizeLoading(false)
  }

  const handleReset = async () => {
    const result = await showDeleteConfirm('semua hasil seleksi gelombang ini')
    if (!result.isConfirmed) return

    setResetLoading(true)
    const { error } = await seleksiService.reset(gelombangId)
    if (!error) {
      showSuccess('Hasil seleksi berhasil direset!')
      setHasil([])
      setPreviewData(null)
      fetchAll()
    } else {
      showError(error?.message || 'Gagal mereset hasil seleksi')
    }
    setResetLoading(false)
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate(`/ppdb/gelombang/${gelombangId}`)}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Engine Seleksi</h1>
            {gelombang && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {gelombang.nama_gelombang} — {METODE_LABELS[gelombang.metode_seleksi] || gelombang.metode_seleksi}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleFraudScan} disabled={fraudLoading}>
            {fraudLoading ? <Loader size={18} className="mr-2 animate-spin" /> : <ShieldAlert size={18} className="mr-2" />}
            Fraud Scan
          </Button>

          <PermissionGuard permission="ppdb.seleksi.view">
            <Button variant="secondary" onClick={handlePreview} disabled={previewLoading || !canRun}>
              {previewLoading ? <Loader size={18} className="mr-2 animate-spin" /> : <Eye size={18} className="mr-2" />}
              Simulasi
            </Button>
          </PermissionGuard>

          <PermissionGuard permission="ppdb.seleksi.run">
            <Button onClick={handleRunSeleksi} disabled={runLoading || !canRun}>
              {runLoading ? <Loader size={18} className="mr-2 animate-spin" /> : <Play size={18} className="mr-2" />}
              {runLoading ? 'Menjalankan...' : 'Jalankan Seleksi'}
            </Button>
          </PermissionGuard>

          {hasil.length > 0 && !hasFinalized && (
            <PermissionGuard permission="ppdb.seleksi.finalize">
              <Button variant="warning" onClick={handleFinalisasi} disabled={finalizeLoading}>
                {finalizeLoading ? <Loader size={18} className="mr-2 animate-spin" /> : <Lock size={18} className="mr-2" />}
                Finalisasi
              </Button>
            </PermissionGuard>
          )}

          {hasil.length > 0 && !hasFinalized && (
            <PermissionGuard permission="ppdb.seleksi.reset">
              <Button variant="danger" onClick={handleReset} disabled={resetLoading}>
                {resetLoading ? <Loader size={18} className="mr-2 animate-spin" /> : <RotateCcw size={18} className="mr-2" />}
                Reset
              </Button>
            </PermissionGuard>
          )}
        </div>
      </div>

      {/* Validation warnings */}
      {gelombang?.metode_seleksi === 'manual' && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          Gelombang ini menggunakan metode seleksi <strong>Manual</strong>. Scoring otomatis tidak tersedia. Gunakan Batch Seleksi di halaman Pendaftaran.
        </div>
      )}
      {!bobotValid && gelombang?.metode_seleksi !== 'manual' && (
        <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          Total bobot kriteria {totalBobot.toFixed(1)}% — harus tepat 100% agar seleksi dapat dijalankan.
          <Button variant="secondary" size="sm" className="ml-2" onClick={() => navigate(`/ppdb/gelombang/${gelombangId}/kriteria`)}>
            Atur Kriteria
          </Button>
        </div>
      )}
      {hasFinalized && (
        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
          <CheckCircle size={16} className="flex-shrink-0" />
          Hasil seleksi telah <strong>difinalisasi</strong>. Tidak dapat diubah secara otomatis.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Kriteria Aktif', value: kriterias.length, icon: TrendingUp, color: 'blue', sublabel: bobotValid ? '✓ Bobot valid' : `${totalBobot.toFixed(1)}% dari 100%` },
          { label: 'Kuota Total', value: kuotaSummary?.total_kuota ?? gelombang?.kuota_total ?? 0, icon: Users, color: 'purple', sublabel: `Cadangan: ${kuotaSummary?.total_kuota_cadangan ?? 0}` },
          { label: 'Hasil Tersimpan', value: hasil.length, icon: Award, color: 'green', sublabel: hasFinalized ? 'Difinalisasi' : 'Belum final' },
          { label: 'Lolos', value: hasil.filter(h => h.status_seleksi === 'lolos').length, icon: CheckCircle, color: 'emerald', sublabel: `Cadangan: ${hasil.filter(h => h.status_seleksi === 'cadangan').length}` },
        ].map(item => (
          <Card key={item.label}>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 bg-${item.color}-50 dark:bg-${item.color}-900/20 rounded-lg flex items-center justify-center`}>
                  <item.icon size={18} className={`text-${item.color}-600`} />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
              </div>
              <div className={`text-3xl font-bold text-${item.color}-600 dark:text-${item.color}-400`}>
                {item.value}
              </div>
              <div className="text-xs text-gray-400 mt-1">{item.sublabel}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Options */}
      {gelombang?.metode_seleksi !== 'manual' && (
        <Card>
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Opsi Seleksi</h3>
            <div className="flex flex-wrap gap-6">
              {[
                { key: 'with_fraud_scan', label: 'Jalankan fraud scan sebelum seleksi' },
                { key: 'include_fraud_suspect', label: 'Sertakan pendaftar yang dicurigai fraud' },
                { key: 'sync_status_pendaftaran', label: 'Sinkron status_pendaftaran setelah seleksi' },
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options[opt.key]}
                    onChange={e => setOptions(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Ringkasan' },
            { id: 'preview', label: `Simulasi ${previewData ? `(${previewData.total ?? 0})` : ''}` },
            { id: 'hasil', label: `Hasil ${hasil.length > 0 ? `(${hasil.length})` : ''}` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kriteria */}
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Kriteria Seleksi</h3>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/ppdb/gelombang/${gelombangId}/kriteria`)}>
                  Kelola
                </Button>
              </div>
              {kriterias.length === 0 ? (
                <p className="text-sm text-gray-400">Belum ada kriteria.</p>
              ) : (
                <div className="space-y-2">
                  {kriterias.map(k => (
                    <div key={k.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{k.nama_kriteria}</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${k.tipe === 'benefit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {k.tipe}
                        </span>
                        <span className="font-bold text-primary-600 w-10 text-right">{k.bobot}%</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span className={bobotValid ? 'text-green-600' : 'text-yellow-600'}>{totalBobot.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Kuota */}
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Kuota Jurusan</h3>
                <Button variant="secondary" size="sm" onClick={() => navigate(`/ppdb/gelombang/${gelombangId}/kuota`)}>
                  Kelola
                </Button>
              </div>
              {kuotaSummary?.per_jurusan?.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Tidak ada kuota per jurusan. Menggunakan kuota global: <strong>{gelombang?.kuota_total ?? 0}</strong>
                </p>
              ) : (
                <div className="space-y-2">
                  {(kuotaSummary?.per_jurusan || []).map(k => (
                    <div key={k.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{k.nama_jurusan}</span>
                      <div className="text-right">
                        <span className="font-bold text-gray-900 dark:text-white">{k.terisi}/{k.kuota}</span>
                        <span className="text-gray-400 ml-1">({k.persentase_terisi}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'preview' && (
        <Card>
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Hasil Simulasi (tidak disimpan)
            </h3>
            {!previewData ? (
              <div className="text-center py-8 text-gray-400">
                <Eye size={36} className="mx-auto mb-3 opacity-50" />
                <p>Belum ada data simulasi. Klik tombol <strong>Simulasi</strong> untuk preview hasil.</p>
              </div>
            ) : (
              <PreviewTable data={previewData.preview || []} />
            )}
          </div>
        </Card>
      )}

      {activeTab === 'hasil' && (
        <Card>
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Hasil Seleksi Tersimpan
                {hasFinalized && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Final</span>
                )}
              </h3>
              {hasil.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/ppdb/gelombang/${gelombangId}/hasil-seleksi`)}
                >
                  Lihat Lengkap
                </Button>
              )}
            </div>
            {hasil.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Award size={36} className="mx-auto mb-3 opacity-50" />
                <p>Belum ada hasil seleksi. Jalankan seleksi terlebih dahulu.</p>
              </div>
            ) : (
              <HasilTable data={hasil} />
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const PreviewTable = ({ data }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left border-b border-gray-200 dark:border-gray-700">
          <th className="pb-3 pr-4 text-gray-500 font-medium">Peringkat</th>
          <th className="pb-3 pr-4 text-gray-500 font-medium">No. Pendaftaran</th>
          <th className="pb-3 pr-4 text-gray-500 font-medium">Nama</th>
          <th className="pb-3 pr-4 text-gray-500 font-medium">Skor</th>
          <th className="pb-3 text-gray-500 font-medium">Prediksi Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {data.map(row => (
          <tr key={row.pendaftar_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="py-2.5 pr-4">
              <span className={`font-bold ${row.peringkat <= 3 ? 'text-yellow-500' : 'text-gray-700 dark:text-gray-300'}`}>
                #{row.peringkat}
              </span>
            </td>
            <td className="py-2.5 pr-4 font-mono text-xs text-gray-500">{row.no_pendaftaran}</td>
            <td className="py-2.5 pr-4 font-medium text-gray-900 dark:text-white">{row.nama}</td>
            <td className="py-2.5 pr-4">
              <span className="font-bold text-primary-600">{(row.total_skor * 100).toFixed(2)}</span>
              <span className="text-gray-400 text-xs ml-1">/100</span>
            </td>
            <td className="py-2.5">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.status_prediksi] || STATUS_COLORS.menunggu}`}>
                {STATUS_LABELS[row.status_prediksi] || row.status_prediksi}
              </span>
              {row.tiebreaker_info && (
                <span className="ml-1 text-xs text-gray-400" title={row.tiebreaker_info}>⚡</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const HasilTable = ({ data }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left border-b border-gray-200 dark:border-gray-700">
          <th className="pb-3 pr-4 text-gray-500 font-medium">Peringkat</th>
          <th className="pb-3 pr-4 text-gray-500 font-medium">Nama</th>
          <th className="pb-3 pr-4 text-gray-500 font-medium">Jurusan</th>
          <th className="pb-3 pr-4 text-gray-500 font-medium">Skor</th>
          <th className="pb-3 pr-4 text-gray-500 font-medium">Status</th>
          <th className="pb-3 text-gray-500 font-medium">Final</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
        {data.slice(0, 50).map(row => (
          <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="py-2.5 pr-4">
              <span className={`font-bold ${row.peringkat <= 3 ? 'text-yellow-500' : 'text-gray-700 dark:text-gray-300'}`}>
                #{row.peringkat}
              </span>
            </td>
            <td className="py-2.5 pr-4">
              <div className="font-medium text-gray-900 dark:text-white">
                {row.pendaftaran?.nama_lengkap || '—'}
              </div>
              {row.pendaftaran?.is_suspect_fraud && (
                <span className="text-xs text-red-500 flex items-center gap-1">
                  <ShieldAlert size={10} /> Suspect Fraud
                </span>
              )}
            </td>
            <td className="py-2.5 pr-4 text-gray-500">{row.kuota_jurusan?.nama_jurusan || '—'}</td>
            <td className="py-2.5 pr-4">
              <span className="font-bold text-primary-600">{(parseFloat(row.total_skor) * 100).toFixed(2)}</span>
            </td>
            <td className="py-2.5 pr-4">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[row.status_seleksi?.value || row.status_seleksi] || STATUS_COLORS.menunggu}`}>
                {row.status_seleksi_label || STATUS_LABELS[row.status_seleksi] || row.status_seleksi}
              </span>
            </td>
            <td className="py-2.5">
              {row.is_finalized
                ? <Lock size={14} className="text-green-500" title="Difinalisasi" />
                : <span className="text-gray-300 text-xs">—</span>
              }
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    {data.length > 50 && (
      <p className="text-center text-sm text-gray-400 mt-4">
        Menampilkan 50 dari {data.length} hasil. Lihat halaman lengkap untuk semua data.
      </p>
    )}
  </div>
)

export default SeleksiEngine
