import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  RefreshCw, AlertCircle, Users, Activity, Trophy, Percent,
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import statistikService from '../services/statistikService'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']

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

const EkstrakurikulerStats = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [tahun, setTahun] = useState(currentYear)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = {}
    if (tahun) params.tahun = tahun

    const { data: res, error: err } = await statistikService.getEkstrakurikuler(params)
    if (res) {
      setData(res.data || res)
    } else {
      setError(err?.message || 'Gagal mengambil data Ekstrakurikuler')
    }
    setLoading(false)
  }, [tahun])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
  const ekskulDist = data?.distribusi_per_ekskul || {}
  const ekskulDetail = ensureArray(data?.distribusi_per_ekskul_detail)
  const trenPendaftaran = data?.tren_pendaftaran || {}
  const kelasDist = data?.distribusi_per_kelas || {}

  const ekskulData = (ekskulDist.labels || []).map((label, i) => ({
    name: label,
    value: ekskulDist.data?.[i] ?? 0,
    color: ekskulDist.colors?.[i] || COLORS[i % COLORS.length],
  }))

  const trenData = (trenPendaftaran.labels || []).map((label, i) => ({
    name: label,
    pendaftaran: trenPendaftaran.data?.[i] ?? 0,
  }))

  const kelasData = (kelasDist.labels || []).map((label, i) => ({
    name: label,
    jumlah: kelasDist.data?.[i] ?? 0,
    color: kelasDist.colors?.[i] || COLORS[i % COLORS.length],
  }))

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-full sm:w-44">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tahun</label>
            <input
              type="number"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={2020}
              max={2099}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              icon={Activity}
              label="Total Ekstrakurikuler"
              value={formatNumber(summary.total_ekstrakurikuler)}
              color="purple"
            />
            <SummaryCard
              icon={Users}
              label="Total Peserta"
              value={formatNumber(summary.total_peserta)}
              color="blue"
            />
            <SummaryCard
              icon={Percent}
              label="Partisipasi Rate"
              value={formatPercent(summary.partisipasi_rate)}
              color="green"
            />
          </div>

          {/* Row 1: Distribusi Ekskul (Pie) + Tren Pendaftaran (Bar) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Distribusi per Ekstrakurikuler">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ekskulData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {ekskulData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => formatNumber(val)} />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Tren Pendaftaran Bulanan">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trenData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="pendaftaran" name="Pendaftaran" fill={trenPendaftaran.color || '#8B5CF6'} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Row 2: Distribusi per Kelas */}
          <Card title="Distribusi Peserta per Kelas">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kelasData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="jumlah" name="Jumlah Peserta" radius={[4, 4, 0, 0]}>
                    {kelasData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Detail Table */}
          {ekskulDetail.length > 0 && (
            <Card title="Detail Peserta per Ekstrakurikuler">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Rank</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Nama Ekstrakurikuler</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Total Peserta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ekskulDetail.map((item, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {i < 3 ? (
                              <Trophy size={16} className={i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : 'text-amber-600'} />
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400 w-4 text-center">{i + 1}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{item.nama_ekstrakurikuler}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            {formatNumber(item.total_peserta)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default EkstrakurikulerStats