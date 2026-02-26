import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  RefreshCw, AlertCircle, Shield, Clock, CheckCircle2,
  AlertTriangle, Trophy,
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
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
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}))

const BkStats = ({ kelasOptions = [] }) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ tahun: '', mst_kelas_id: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = {}
    if (filters.tahun) params.tahun = filters.tahun
    if (filters.mst_kelas_id) params.mst_kelas_id = filters.mst_kelas_id

    const { data: res, error: err } = await statistikService.getBk(params)
    if (res) {
      setData(res.data || res)
    } else {
      setError(err?.message || 'Gagal mengambil data BK')
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
  const trenKasus = data?.tren_kasus_bulanan || {}
  const statusDist = data?.status_distribution || {}
  const kategoriDist = data?.distribusi_kategori || {}
  const jenisDist = data?.distribusi_jenis || {}
  const kelasDist = data?.distribusi_per_kelas || {}
  const siswaKasus = ensureArray(data?.siswa_kasus_terbanyak)

  // Transform tren_kasus_bulanan for recharts
  const trenData = (trenKasus.labels || []).map((label, i) => ({
    name: label,
    kasus: trenKasus.data?.[i] ?? 0,
  }))

  // Transform pie/bar data
  const statusData = (statusDist.labels || []).map((label, i) => ({
    name: label,
    value: statusDist.data?.[i] ?? 0,
    color: statusDist.colors?.[i] || COLORS[i % COLORS.length],
  }))

  const kategoriData = (kategoriDist.labels || []).map((label, i) => ({
    name: label,
    value: kategoriDist.data?.[i] ?? 0,
    color: kategoriDist.colors?.[i] || COLORS[i % COLORS.length],
  }))

  const jenisData = (jenisDist.labels || []).map((label, i) => ({
    name: label,
    jumlah: jenisDist.data?.[i] ?? 0,
    color: jenisDist.colors?.[i] || COLORS[i % COLORS.length],
  }))

  const kelasData = (kelasDist.labels || []).map((label, i) => ({
    name: label,
    jumlah: kelasDist.data?.[i] ?? 0,
    color: kelasDist.colors?.[i] || COLORS[i % COLORS.length],
  }))

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
          <div className="w-full sm:w-56">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kelas</label>
            <SearchableSelect
              name="mst_kelas_id"
              value={filters.mst_kelas_id}
              onChange={handleFilterChange}
              options={kelasOptions}
              placeholder="Semua Kelas"
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
              icon={Shield}
              label="Total Kasus"
              value={formatNumber(summary.total_kasus)}
              color="red"
            />
            <SummaryCard
              icon={AlertTriangle}
              label="Kasus Proses"
              value={formatNumber(summary.kasus_proses)}
              color="yellow"
            />
            <SummaryCard
              icon={CheckCircle2}
              label="Kasus Selesai"
              value={formatNumber(summary.kasus_selesai)}
              color="green"
            />
            <SummaryCard
              icon={Trophy}
              label="Resolusi Rate"
              value={formatPercent(summary.resolusi_rate)}
              color="blue"
            />
            <SummaryCard
              icon={Clock}
              label="Avg Resolusi"
              value={`${formatNumber(summary.avg_resolusi_hari)} hari`}
              color="purple"
            />
          </div>

          {/* Row 1: Tren Kasus + Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tren Kasus Bulanan (Area) */}
            <Card title="Tren Kasus Bulanan">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trenData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="kasus"
                      name="Kasus"
                      stroke={trenKasus.color || '#EF4444'}
                      fill={trenKasus.color || '#EF4444'}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Status Distribution (Pie) */}
            <Card title="Distribusi Status">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
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
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => formatNumber(val)} />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Row 2: Kategori + Jenis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribusi Kategori (Pie) */}
            <Card title="Distribusi Kategori">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kategoriData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {kategoriData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => formatNumber(val)} />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Distribusi Jenis (Horizontal Bar) */}
            <Card title="Distribusi Jenis">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={jenisData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={75} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="jumlah" name="Jumlah" radius={[0, 4, 4, 0]}>
                      {jenisData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Row 3: Distribusi per Kelas */}
          <Card title="Distribusi Kasus per Kelas">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kelasData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="jumlah" name="Jumlah Kasus" radius={[4, 4, 0, 0]}>
                    {kelasData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Siswa Kasus Terbanyak */}
          {siswaKasus.length > 0 && (
            <Card title="Siswa Kasus Terbanyak">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Rank</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Nama</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">NIS</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Kelas</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Total Kasus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siswaKasus.map((siswa, i) => (
                      <tr key={siswa.id || i} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {i < 3 ? (
                              <Trophy size={16} className={i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : 'text-amber-600'} />
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400 w-4 text-center">{i + 1}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{siswa.nama}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{siswa.nis}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{siswa.nama_kelas}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            {formatNumber(siswa.total_kasus)}
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

export default BkStats