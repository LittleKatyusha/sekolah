import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  RefreshCw, AlertCircle, UserPlus, UserCheck, UserX,
  TrendingUp, TrendingDown, Percent,
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import statistikService from '../services/statistikService'

const formatNumber = (val) => {
  if (typeof val !== 'number') return val
  return val.toLocaleString('id-ID', { maximumFractionDigits: 1 })
}

const formatPercent = (val) => {
  if (typeof val !== 'number') return val
  return `${val.toFixed(1)}%`
}

const SkeletonChart = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
    <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded" />
  </div>
)

const SummaryCard = ({ icon: Icon, label, value, subValue, color = 'blue' }) => {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    pink: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  }
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon size={18} />
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {subValue && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subValue}</p>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-medium text-gray-900 dark:text-white mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {formatNumber(entry.value)}
        </p>
      ))}
    </div>
  )
}

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}))

const PpdbStats = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ tahun: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = {}
    if (filters.tahun) params.tahun = filters.tahun

    const { data: res, error: err } = await statistikService.getPpdb(params)
    if (res) {
      setData(res.data || res)
    } else {
      setError(err?.message || 'Gagal mengambil data PPDB')
    }
    setLoading(false)
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }))
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

  const summary = data?.summary || {}
  const ensureArray = (val) => Array.isArray(val) ? val : []
  const funnel = ensureArray(data?.funnel)
  const trenPendaftaran = data?.tren_pendaftaran || {}
  const distribusiGelombang = data?.distribusi_gelombang || {}

  // Transform tren_pendaftaran for recharts
  const trenData = (trenPendaftaran.labels || []).map((label, i) => ({
    name: label,
    pendaftar: trenPendaftaran.data?.[i] ?? 0,
  }))

  // Transform distribusi_gelombang for grouped bar
  const gelombangData = (distribusiGelombang.labels || []).map((label, i) => ({
    name: label,
    pendaftar: distribusiGelombang.total_pendaftar?.[i] ?? 0,
    diterima: distribusiGelombang.total_diterima?.[i] ?? 0,
    acceptance_rate: distribusiGelombang.acceptance_rate?.[i] ?? 0,
  }))

  // Find max funnel value for width calculation
  const maxFunnel = Math.max(...funnel.map((f) => f.total), 1)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-44">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tahun</label>
            <SearchableSelect
              name="tahun"
              value={filters.tahun}
              onChange={handleFilterChange}
              options={yearOptions}
              placeholder="Tahun Berjalan"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <Card key={i}><SkeletonChart /></Card>)}
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <SummaryCard
              icon={UserPlus}
              label="Total Pendaftar"
              value={formatNumber(summary.total_pendaftar)}
              color="blue"
            />
            <SummaryCard
              icon={UserCheck}
              label="Total Diterima"
              value={formatNumber(summary.total_diterima)}
              color="green"
            />
            <SummaryCard
              icon={UserX}
              label="Total Ditolak"
              value={formatNumber(summary.total_ditolak)}
              color="red"
            />
            <SummaryCard
              icon={Percent}
              label="Acceptance Rate"
              value={formatPercent(summary.acceptance_rate)}
              color="purple"
            />
            <SummaryCard
              icon={summary.yoy_growth_pct >= 0 ? TrendingUp : TrendingDown}
              label="YoY Growth"
              value={formatPercent(summary.yoy_growth_pct)}
              subValue={summary.prev_year_total ? `Tahun lalu: ${formatNumber(summary.prev_year_total)} pendaftar` : undefined}
              color={summary.yoy_growth_pct >= 0 ? 'green' : 'red'}
            />
          </div>

          {/* Funnel Visualization */}
          {funnel.length > 0 && (
            <Card title="Funnel Pendaftaran">
              <div className="space-y-3 py-2">
                {funnel.map((stage, i) => {
                  const widthPct = Math.max((stage.total / maxFunnel) * 100, 8)
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 text-right shrink-0">
                        {stage.stage}
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <div
                          className="h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold transition-all"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: stage.color || '#3B82F6',
                            minWidth: '60px',
                          }}
                        >
                          {formatNumber(stage.total)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Row 1: Tren Pendaftaran + Distribusi Gelombang */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tren Pendaftaran (Bar) */}
            <Card title="Tren Pendaftaran Bulanan">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trenData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="pendaftar"
                      name="Pendaftar"
                      fill={trenPendaftaran.color || '#EC4899'}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Distribusi Gelombang (Grouped Bar) */}
            <Card title="Distribusi per Gelombang">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gelombangData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                    <Bar dataKey="pendaftar" name="Pendaftar" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="diterima" name="Diterima" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* YoY Comparison */}
          {(summary.prev_year_total || summary.prev_year_diterima) && (
            <Card title="Perbandingan Year-over-Year">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pendaftar</h4>
                  <div className="flex items-end gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tahun Ini</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(summary.total_pendaftar)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tahun Lalu</p>
                      <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">{formatNumber(summary.prev_year_total)}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${summary.yoy_growth_pct >= 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {summary.yoy_growth_pct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {formatPercent(summary.yoy_growth_pct)}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Diterima</h4>
                  <div className="flex items-end gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tahun Ini</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatNumber(summary.total_diterima)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tahun Lalu</p>
                      <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">{formatNumber(summary.prev_year_diterima)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default PpdbStats