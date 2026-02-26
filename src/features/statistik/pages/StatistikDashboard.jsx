import { useState, useEffect } from 'react'
import {
  BarChart3, Users, GraduationCap, BookOpen, Calendar,
  DollarSign, Shield, UserPlus, Library, FileText,
  Award, Building2, TrendingUp, TrendingDown, Minus,
  RefreshCw, AlertCircle,
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { statistikService } from '../services/statistikService'
import { usePageTitle } from '../../../hooks/usePageTitle'

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

const StatistikDashboard = () => {
  usePageTitle('Statistik')

  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOverview()
  }, [])

  const fetchOverview = async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await statistikService.getOverview()
    if (data) {
      setOverview(data.data || data)
    } else {
      setError(err?.message || 'Gagal mengambil data statistik')
    }
    setLoading(false)
  }

  const kpiCards = overview?.kpi_cards || []
  const sparkline = overview?.sparkline_7_days || []
  const meta = overview?.meta || {}

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistik</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistik</h1>
        <Card>
          <div className="p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <Button onClick={fetchOverview}>
              <RefreshCw size={18} className="mr-2" />
              Coba Lagi
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistik</h1>
          {meta.generated_at && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Terakhir diperbarui: {new Date(meta.generated_at).toLocaleString('id-ID')}
            </p>
          )}
        </div>
        <Button variant="secondary" onClick={fetchOverview}>
          <RefreshCw size={18} className="mr-2" />
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

      {/* Sparkline / Activity Summary */}
      {sparkline.length > 0 && (
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Aktivitas 7 Hari Terakhir
            </h2>
            <div className="grid grid-cols-7 gap-2">
              {sparkline.map((day, index) => {
                const maxVal = Math.max(...sparkline.map(d => d.value || 0), 1)
                const heightPercent = ((day.value || 0) / maxVal) * 100
                return (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div className="w-full h-24 flex items-end justify-center">
                      <div
                        className="w-8 bg-primary-500 dark:bg-primary-400 rounded-t-md transition-all min-h-[4px]"
                        style={{ height: `${Math.max(heightPercent, 3)}%` }}
                        title={`${day.label || ''}: ${day.value || 0}`}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center">
                      {day.label || `Day ${index + 1}`}
                    </span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {day.value || 0}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {kpiCards.length === 0 && sparkline.length === 0 && (
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

export default StatistikDashboard