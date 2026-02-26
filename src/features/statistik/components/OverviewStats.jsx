import { useState, useEffect } from 'react'
import {
  LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import {
  BarChart3, Users, GraduationCap, BookOpen, Calendar,
  DollarSign, Shield, UserPlus, Library, FileText,
  Award, Building2, TrendingUp, TrendingDown, Minus,
  RefreshCw, AlertCircle,
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import statistikService from '../services/statistikService'

const ICON_MAP = {
  users: Users,
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  calendar: Calendar,
  'dollar-sign': DollarSign,
  shield: Shield,
  'user-plus': UserPlus,
  library: Library,
  'file-text': FileText,
  award: Award,
  'building-2': Building2,
  'bar-chart-3': BarChart3,
  'trending-up': TrendingUp,
}

const getTrendIcon = (trend) => {
  if (trend === 'up') return <TrendingUp size={14} className="text-green-500" />
  if (trend === 'down') return <TrendingDown size={14} className="text-red-500" />
  return <Minus size={14} className="text-gray-400" />
}

const getTrendColor = (trend) => {
  if (trend === 'up') return 'text-green-600 dark:text-green-400'
  if (trend === 'down') return 'text-red-600 dark:text-red-400'
  return 'text-gray-500 dark:text-gray-400'
}

const SPARKLINE_SERIES = [
  { key: 'kehadiran_siswa', label: 'Kehadiran Siswa', color: '#3B82F6' },
  { key: 'pendapatan_spp', label: 'Pendapatan SPP', color: '#10B981' },
  { key: 'kasus_bk', label: 'Kasus BK', color: '#F59E0B' },
]

const SkeletonCards = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      </div>
    ))}
  </div>
)

const OverviewStats = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    const { data: res, error: err } = await statistikService.getOverview()
    if (res) {
      setData(res.data || res)
    } else {
      setError(err?.message || 'Gagal mengambil data overview')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCards />
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={fetchData}>
            <RefreshCw size={18} className="mr-2" />
            Coba Lagi
          </Button>
        </div>
      </Card>
    )
  }

  const kpiCards = data?.kpi_cards || []
  const sparklineRaw = data?.sparkline_7_days || {}
  const meta = data?.meta || {}

  // Transform sparkline data for recharts
  const labels = sparklineRaw.labels || []
  const sparklineData = labels.map((label, i) => ({
    name: label,
    kehadiran_siswa: sparklineRaw.kehadiran_siswa?.[i] ?? 0,
    pendapatan_spp: sparklineRaw.pendapatan_spp?.[i] ?? 0,
    kasus_bk: sparklineRaw.kasus_bk?.[i] ?? 0,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Overview</h2>
          {meta.generated_at && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Terakhir diperbarui: {new Date(meta.generated_at).toLocaleString('id-ID')}
            </p>
          )}
        </div>
        <Button variant="secondary" size="sm" onClick={fetchData}>
          <RefreshCw size={16} className="mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      {kpiCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => {
            const IconComponent = ICON_MAP[card.icon] || BarChart3
            return (
              <div
                key={card.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: card.bg_color || '#EFF6FF',
                      color: card.color || '#2563EB',
                    }}
                  >
                    <IconComponent size={18} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {card.value}
                </p>
                <div className="flex items-center gap-1.5">
                  {getTrendIcon(card.trend)}
                  <span className={`text-xs font-medium ${getTrendColor(card.trend)}`}>
                    {card.trend_label || card.sub_value}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Sparkline Charts */}
      {sparklineData.length > 0 && (
        <Card title="Aktivitas 7 Hari Terakhir">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  className="text-gray-500 dark:text-gray-400"
                />
                <YAxis tick={{ fontSize: 12 }} className="text-gray-500 dark:text-gray-400" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #fff)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '13px' }} />
                {SPARKLINE_SERIES.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {kpiCards.length === 0 && sparklineData.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <BarChart3 size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Belum ada data statistik yang tersedia.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default OverviewStats