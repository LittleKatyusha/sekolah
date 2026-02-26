import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  RefreshCw, AlertCircle, Library, BookOpen, BookX,
  BarChart3, Trophy,
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

const SummaryCard = ({ icon: Icon, label, value, color = 'blue' }) => {
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

const PerpustakaanStats = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ tahun: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = {}
    if (filters.tahun) params.tahun = filters.tahun

    const { data: res, error: err } = await statistikService.getPerpustakaan(params)
    if (res) {
      setData(res.data || res)
    } else {
      setError(err?.message || 'Gagal mengambil data perpustakaan')
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
  const trenPeminjaman = data?.tren_peminjaman || {}
  const topBuku = ensureArray(data?.top_buku_diminati)
  const distribusiStatus = ensureArray(data?.distribusi_status)
  const siswaAktif = ensureArray(data?.siswa_aktif_pinjam)

  // Transform tren_peminjaman for recharts (multi-line)
  const trenLabels = trenPeminjaman.labels || []
  const trenDatasets = trenPeminjaman.datasets || []
  const trenData = trenLabels.map((label, i) => {
    const point = { name: label }
    trenDatasets.forEach((ds) => {
      point[ds.label] = ds.data?.[i] ?? 0
    })
    return point
  })

  // Transform top_buku for horizontal bar
  const topBukuData = topBuku.slice(0, 10).map((b) => ({
    name: b.judul?.length > 25 ? b.judul.substring(0, 25) + '...' : b.judul,
    fullName: b.judul,
    penulis: b.penulis,
    total: b.total_dipinjam,
  }))

  // Status colors
  const statusColorMap = {
    Tersedia: '#10B981',
    Dipinjam: '#3B82F6',
    Rusak: '#EF4444',
    Hilang: '#F59E0B',
  }

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={Library}
              label="Total Judul Buku"
              value={formatNumber(summary.total_judul_buku)}
              color="blue"
            />
            <SummaryCard
              icon={BookOpen}
              label="Sedang Dipinjam"
              value={formatNumber(summary.sedang_dipinjam)}
              color="green"
            />
            <SummaryCard
              icon={BookX}
              label="Overdue"
              value={formatNumber(summary.overdue)}
              color="red"
            />
            <SummaryCard
              icon={BarChart3}
              label="Utilization Rate"
              value={formatPercent(summary.utilization_rate)}
              color="purple"
            />
          </div>

          {/* Row 1: Tren Peminjaman + Distribusi Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tren Peminjaman (Multi-Line) */}
            <Card title="Tren Peminjaman">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trenData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                    {trenDatasets.map((ds, i) => (
                      <Line
                        key={ds.label}
                        type="monotone"
                        dataKey={ds.label}
                        name={ds.label}
                        stroke={ds.color || COLORS[i % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Distribusi Status Buku */}
            <Card title="Distribusi Status Buku">
              <div className="space-y-3 py-2">
                {distribusiStatus.map((item, i) => {
                  const total = distribusiStatus.reduce((sum, s) => sum + (s.total || 0), 0)
                  const pct = total > 0 ? ((item.total / total) * 100) : 0
                  const color = statusColorMap[item.status] || COLORS[i % COLORS.length]
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{item.status}</span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatNumber(item.total)} ({pct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Top Buku Diminati (Horizontal Bar) */}
          {topBukuData.length > 0 && (
            <Card title="Top 10 Buku Diminati">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topBukuData} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={115} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm">
                            <p className="font-medium text-gray-900 dark:text-white mb-1">{d.fullName}</p>
                            <p className="text-gray-600 dark:text-gray-400">Penulis: {d.penulis}</p>
                            <p style={{ color: '#3B82F6' }}>Total Dipinjam: {formatNumber(d.total)}</p>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="total" name="Total Dipinjam" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Siswa Aktif Pinjam */}
          {siswaAktif.length > 0 && (
            <Card title="Siswa Aktif Peminjam">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Rank</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Nama</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">NIS</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Kelas</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Total Pinjam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siswaAktif.map((siswa, i) => (
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
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{siswa.nama}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{siswa.nis}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{siswa.nama_kelas}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {formatNumber(siswa.total_pinjam)}
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

export default PerpustakaanStats