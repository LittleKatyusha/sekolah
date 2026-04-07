import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, RefreshCw, AlertTriangle, TrendingUp, TrendingDown,
  Minus, ShieldAlert, BookOpen, Clock, CreditCard, Activity,
  CheckCircle, XCircle, AlertCircle, BarChart2, Calendar,
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { siswaInsightService } from '../services/siswaInsightService'
import { showError, showSuccess } from '../../../utils/sweetalert'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RISK_COLOR = {
  low:      { bg: 'bg-green-100 dark:bg-green-900/30',  text: 'text-green-700 dark:text-green-400',  label: 'Rendah',   dot: 'bg-green-500' },
  medium:   { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Sedang',   dot: 'bg-yellow-500' },
  high:     { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: 'Tinggi',   dot: 'bg-orange-500' },
  critical: { bg: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-700 dark:text-red-400',       label: 'Kritis',   dot: 'bg-red-500' },
}

const STATUS_COLOR = {
  baik:             'text-green-600 dark:text-green-400',
  perlu_perhatian:  'text-yellow-600 dark:text-yellow-400',
  kritis:           'text-red-600 dark:text-red-400',
  aman:             'text-green-600 dark:text-green-400',
  lunas:            'text-green-600 dark:text-green-400',
}

const TREND_ICON = {
  naik:   <TrendingUp size={14} className="text-green-500" />,
  turun:  <TrendingDown size={14} className="text-red-500" />,
  stabil: <Minus size={14} className="text-gray-400" />,
}

const riskStyle = (cat) => RISK_COLOR[cat] ?? RISK_COLOR.low

const pct = (val) => `${val ?? 0}%`

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskGauge({ score, category }) {
  const style = riskStyle(category)
  const deg = Math.round((score / 100) * 180)
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-16 overflow-hidden">
        <div className="absolute inset-0 rounded-t-full border-8 border-gray-200 dark:border-gray-700" style={{ borderBottomColor: 'transparent' }} />
        <div
          className={`absolute inset-0 rounded-t-full border-8 ${style.text.replace('text-', 'border-')} transition-all duration-700`}
          style={{
            borderBottomColor: 'transparent',
            transform: `rotate(${deg - 90}deg)`,
            transformOrigin: '50% 100%',
            opacity: 0.8,
          }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <span className={`text-2xl font-bold ${style.text}`}>{score}</span>
        </div>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    </div>
  )
}

function DimensionBar({ label, score, max = 100 }) {
  const pctVal = Math.round((score / max) * 100)
  const color = pctVal >= 70 ? 'bg-green-500' : pctVal >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>{label}</span>
        <span className="font-medium">{score}/{max}</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pctVal}%` }} />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    green:  'bg-green-50 dark:bg-green-900/20 text-green-600',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600',
    red:    'bg-red-50 dark:bg-red-900/20 text-red-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
  }
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

function ActivityHeatmap({ heatmap }) {
  if (!heatmap || Object.keys(heatmap).length === 0) {
    return <p className="text-sm text-gray-400">Tidak ada data aktivitas.</p>
  }
  const entries = Object.entries(heatmap)
  const maxVal = Math.max(...entries.map(([, v]) => v), 1)
  const intensity = (v) => {
    if (v === 0) return 'bg-gray-100 dark:bg-gray-800'
    const r = v / maxVal
    if (r < 0.25) return 'bg-green-200 dark:bg-green-900/40'
    if (r < 0.5)  return 'bg-green-400 dark:bg-green-700/60'
    if (r < 0.75) return 'bg-green-600 dark:bg-green-600/80'
    return 'bg-green-700 dark:bg-green-500'
  }
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([date, val]) => (
        <div
          key={date}
          title={`${date}: ${val} aktivitas`}
          className={`w-4 h-4 rounded-sm ${intensity(val)} cursor-default transition-colors`}
        />
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const SiswaInsightPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [insight, setInsight]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchInsight = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true)
    else setLoading(true)

    const { data, error } = await siswaInsightService.getInsight(id, forceRefresh)

    if (data?.data) {
      setInsight(data.data)
    } else {
      showError(error?.message ?? 'Gagal mengambil insight siswa')
    }

    setLoading(false)
    setRefreshing(false)
  }, [id])

  useEffect(() => {
    fetchInsight()
  }, [fetchInsight])

  const handleRefresh = async () => {
    await fetchInsight(true)
    showSuccess('Insight berhasil diperbarui')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!insight) return null

  const { siswa, risk_profile, academic_progress, kehadiran_summary, tugas_summary, spp_summary, ews_summary, activity_heatmap } = insight
  const rp = risk_profile ?? {}
  const ap = academic_progress ?? {}
  const dims = rp.dimensions ?? {}

  const tabs = [
    { key: 'overview',  label: 'Overview',       icon: <Activity size={15} /> },
    { key: 'risk',      label: 'Profil Risiko',  icon: <ShieldAlert size={15} /> },
    { key: 'akademik',  label: 'Akademik',        icon: <BookOpen size={15} /> },
    { key: 'kehadiran', label: 'Kehadiran',       icon: <Clock size={15} /> },
    { key: 'keuangan',  label: 'Keuangan',        icon: <CreditCard size={15} /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate(`/siswa/${id}`)}>
            <ArrowLeft size={16} className="mr-1" /> Kembali
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Insight 360° — {siswa?.nama}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {siswa?.kelas} · NIS {siswa?.nis}
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={15} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Memperbarui...' : 'Refresh'}
        </Button>
      </div>

      {/* Risk badge hero */}
      <div className={`rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 ${riskStyle(rp.risk_category).bg}`}>
        <RiskGauge score={rp.risk_score ?? 0} category={rp.risk_category ?? 'low'} />
        <div className="flex-1 space-y-1 text-center sm:text-left">
          <p className={`font-semibold text-lg ${riskStyle(rp.risk_category).text}`}>
            Risiko {riskStyle(rp.risk_category).label}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Skor risiko holistik berdasarkan 5 dimensi: akademik, kehadiran, perilaku, keuangan, dan sosial.
          </p>
          {rp.recommendations?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {rp.recommendations.slice(0, 3).map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                  <AlertCircle size={13} className="mt-0.5 flex-shrink-0 text-orange-500" />
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === t.key
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Kehadiran */}
          <Card>
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Clock size={16} className="text-blue-500" /> Kehadiran (30 hari)
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{pct(kehadiran_summary?.pct_hadir)}</span>
                <span className={`text-sm font-medium ${STATUS_COLOR[kehadiran_summary?.status] ?? ''}`}>
                  {kehadiran_summary?.status?.replace('_', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  { label: 'Hadir', val: kehadiran_summary?.hadir, color: 'text-green-600' },
                  { label: 'Izin',  val: kehadiran_summary?.izin,  color: 'text-blue-600' },
                  { label: 'Sakit', val: kehadiran_summary?.sakit, color: 'text-yellow-600' },
                  { label: 'Alpha', val: kehadiran_summary?.alpha, color: 'text-red-600' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className={`font-bold text-lg ${s.color}`}>{s.val ?? 0}</p>
                    <p className="text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Tugas */}
          <Card>
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <BookOpen size={16} className="text-purple-500" /> Tugas (30 hari)
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{pct(tugas_summary?.pct_kumpul)}</span>
                <span className={`text-sm font-medium ${STATUS_COLOR[tugas_summary?.status] ?? ''}`}>
                  {tugas_summary?.status?.replace('_', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {[
                  { label: 'Kumpul',   val: tugas_summary?.dikumpulkan, color: 'text-green-600' },
                  { label: 'Terlambat',val: tugas_summary?.terlambat,   color: 'text-yellow-600' },
                  { label: 'Belum',    val: tugas_summary?.belum,       color: 'text-red-600' },
                ].map((s) => (
                  <div key={s.label}>
                    <p className={`font-bold text-lg ${s.color}`}>{s.val ?? 0}</p>
                    <p className="text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>
              {tugas_summary?.rata_nilai != null && (
                <p className="text-xs text-gray-500">Rata-rata nilai: <strong>{tugas_summary.rata_nilai}</strong></p>
              )}
            </div>
          </Card>

          {/* SPP */}
          <Card>
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <CreditCard size={16} className="text-green-500" /> SPP {spp_summary?.tahun}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{spp_summary?.lunas ?? 0}/{spp_summary?.bulan_berjalan ?? 0}</span>
                <span className={`text-sm font-medium ${STATUS_COLOR[spp_summary?.status] ?? ''}`}>
                  {spp_summary?.status}
                </span>
              </div>
              {spp_summary?.tunggakan > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                  <AlertTriangle size={14} />
                  Tunggakan {spp_summary.tunggakan} bulan
                </div>
              )}
              <p className="text-xs text-gray-500">
                Total dibayar: <strong>Rp {(spp_summary?.total_dibayar ?? 0).toLocaleString('id-ID')}</strong>
              </p>
            </div>
          </Card>

          {/* EWS */}
          <Card>
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-500" /> EWS Alerts
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{ews_summary?.total_aktif ?? 0}</span>
                <span className={`text-sm font-medium ${STATUS_COLOR[ews_summary?.status] ?? ''}`}>
                  {ews_summary?.status}
                </span>
              </div>
              {ews_summary?.aktif?.length > 0 ? (
                <ul className="space-y-1">
                  {ews_summary.aktif.map((a, i) => (
                    <li key={i} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${riskStyle(a.level).dot}`} />
                      {a.jenis} ({a.count}x)
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle size={14} /> Tidak ada alert aktif
                </div>
              )}
              <p className="text-xs text-gray-400">30 hari terakhir: {ews_summary?.historis_30_hari ?? 0} alert</p>
            </div>
          </Card>

          {/* Activity Heatmap */}
          <Card className="md:col-span-2">
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Calendar size={16} className="text-indigo-500" /> Aktivitas 30 Hari Terakhir
              </h3>
              <ActivityHeatmap heatmap={activity_heatmap} />
              <p className="text-xs text-gray-400">Setiap kotak = 1 hari. Warna lebih gelap = lebih banyak aktivitas (hadir + presensi + tugas).</p>
            </div>
          </Card>
        </div>
      )}

      {/* ── RISK PROFILE ── */}
      {activeTab === 'risk' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">Skor per Dimensi</h3>
              <DimensionBar label="Akademik"   score={dims.akademik?.score ?? 0} />
              <DimensionBar label="Kehadiran"  score={dims.kehadiran?.score ?? 0} />
              <DimensionBar label="Perilaku"   score={dims.perilaku?.score ?? 0} />
              <DimensionBar label="Keuangan"   score={dims.keuangan?.score ?? 0} />
              <DimensionBar label="Sosial"     score={dims.sosial?.score ?? 0} />
            </div>
          </Card>

          <Card>
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">Rekomendasi Tindakan</h3>
              {rp.recommendations?.length > 0 ? (
                <ul className="space-y-2">
                  {rp.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-orange-500" />
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={16} /> Tidak ada rekomendasi khusus
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Detail Dimensi</h4>
                {Object.entries(dims).map(([key, dim]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="capitalize text-gray-600 dark:text-gray-400">{key}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 dark:text-white">{dim.score}</span>
                      {dim.issues?.length > 0 && (
                        <span className="text-red-500">({dim.issues.length} isu)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── AKADEMIK ── */}
      {activeTab === 'akademik' && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={<BarChart2 size={18} />} label="Rata-rata Nilai" value={ap.rata_rata_keseluruhan ?? '-'} color="blue" />
            <StatCard icon={<TrendingUp size={18} />} label="Ranking Kelas" value={ap.ranking_kelas ? `#${ap.ranking_kelas}` : '-'} color="purple" />
            <StatCard icon={<BookOpen size={18} />} label="Mapel Dipantau" value={Object.keys(ap.per_mapel ?? {}).length} color="green" />
            <StatCard icon={<AlertTriangle size={18} />} label="Anomali Terdeteksi" value={ap.anomali?.length ?? 0} color="red" />
          </div>

          {/* Per mapel trends */}
          {Object.keys(ap.per_mapel ?? {}).length > 0 ? (
            <Card>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Tren Nilai per Mapel</h3>
                <div className="space-y-3">
                  {Object.entries(ap.per_mapel).map(([mapel, info]) => (
                    <div key={mapel} className="flex items-center gap-3">
                      <div className="w-32 text-sm text-gray-700 dark:text-gray-300 truncate">{mapel}</div>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(100, ((info.rata_rata ?? 0) / 100) * 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-1 w-20 justify-end">
                        <span className="text-sm font-medium text-gray-800 dark:text-white">{info.rata_rata ?? '-'}</span>
                        {TREND_ICON[info.tren] ?? TREND_ICON.stabil}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="p-8 text-center text-gray-400">
                <BookOpen size={40} className="mx-auto mb-2 opacity-40" />
                <p>Belum ada data nilai</p>
              </div>
            </Card>
          )}

          {/* Anomali */}
          {ap.anomali?.length > 0 && (
            <Card>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-500" /> Anomali Terdeteksi
                </h3>
                <ul className="space-y-2">
                  {ap.anomali.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <XCircle size={14} className="mt-0.5 text-red-500 flex-shrink-0" />
                      <span className="text-red-700 dark:text-red-300">{a.deskripsi ?? JSON.stringify(a)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── KEHADIRAN ── */}
      {activeTab === 'kehadiran' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">Ringkasan Kehadiran</h3>
              <div className="text-center py-4">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">{pct(kehadiran_summary?.pct_hadir)}</span>
                <p className="text-sm text-gray-500 mt-1">Tingkat Kehadiran</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={<CheckCircle size={16} />} label="Hadir"  value={kehadiran_summary?.hadir ?? 0}  color="green" />
                <StatCard icon={<AlertCircle size={16} />} label="Izin"   value={kehadiran_summary?.izin ?? 0}   color="blue" />
                <StatCard icon={<AlertCircle size={16} />} label="Sakit"  value={kehadiran_summary?.sakit ?? 0}  color="yellow" />
                <StatCard icon={<XCircle size={16} />}     label="Alpha"  value={kehadiran_summary?.alpha ?? 0}  color="red" />
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 dark:text-white">Aktivitas Harian</h3>
              <ActivityHeatmap heatmap={activity_heatmap} />
            </div>
          </Card>
        </div>
      )}

      {/* ── KEUANGAN ── */}
      {activeTab === 'keuangan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">Status SPP {spp_summary?.tahun}</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={<CheckCircle size={16} />} label="Bulan Lunas"    value={spp_summary?.lunas ?? 0}      color="green" />
                <StatCard icon={<XCircle size={16} />}     label="Tunggakan"      value={spp_summary?.tunggakan ?? 0}  color="red" />
                <StatCard icon={<CreditCard size={16} />}  label="Total Dibayar"
                  value={`Rp ${(spp_summary?.total_dibayar ?? 0).toLocaleString('id-ID')}`}
                  color="blue"
                />
                <StatCard icon={<Calendar size={16} />}    label="Bulan Berjalan" value={spp_summary?.bulan_berjalan ?? 0} color="purple" />
              </div>
              <div className={`p-3 rounded-lg ${spp_summary?.status === 'lunas' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <p className={`text-sm font-medium ${STATUS_COLOR[spp_summary?.status] ?? ''}`}>
                  {spp_summary?.status === 'lunas'
                    ? '✅ SPP tahun ini sudah lunas'
                    : `⚠️ Masih ada tunggakan ${spp_summary?.tunggakan} bulan`}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-4 space-y-3">
              <h3 className="font-semibold text-gray-800 dark:text-white">Dimensi Keuangan (Risk)</h3>
              <DimensionBar label="Skor Keuangan" score={dims.keuangan?.score ?? 0} />
              {dims.keuangan?.issues?.length > 0 && (
                <ul className="space-y-1 mt-2">
                  {dims.keuangan.issues.map((isu, i) => (
                    <li key={i} className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertCircle size={11} /> {isu}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Footer timestamp */}
      <p className="text-xs text-gray-400 text-right">
        Data dihitung pada: {insight.computed_at ? new Date(insight.computed_at).toLocaleString('id-ID') : '-'}
      </p>
    </div>
  )
}

export default SiswaInsightPage
