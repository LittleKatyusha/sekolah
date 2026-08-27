import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  RefreshCw, AlertCircle, UserCheck, Users, UserX, Clock,
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import statistikService from '../services/statistikService'
import { kelasService } from '../../kelas/services/kelasService'

const STATUS_COLORS = {
  Hadir: '#10B981',
  Izin: '#3B82F6',
  Sakit: '#F59E0B',
  Alpha: '#EF4444',
}

const DONUT_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']

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

const getHeatmapColor = (value) => {
  if (value >= 90) return 'bg-green-500 text-white'
  if (value >= 75) return 'bg-green-300 text-green-900'
  if (value >= 60) return 'bg-yellow-300 text-yellow-900'
  if (value >= 40) return 'bg-orange-300 text-orange-900'
  return 'bg-red-400 text-white'
}

const KehadiranStats = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    mst_kelas_id: '',
    start_date: '',
    end_date: '',
  })
  const [kelasOptions, setKelasOptions] = useState([])

  // Fetch dropdown options
  useEffect(() => {
    const fetchOptions = async () => {
      const { data: res } = await kelasService.getAll({ per_page: 100 })
      if (res?.data) {
        const kelasList = Array.isArray(res.data) ? res.data : res.data?.data || []
        setKelasOptions(kelasList.map(item => ({
          value: String(item.id),
          label: item.nama_kelas || `Kelas #${item.id}`,
        })))
      }
    }
    fetchOptions()
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = {}
    if (filters.mst_kelas_id) params.mst_kelas_id = filters.mst_kelas_id
    if (filters.start_date) params.start_date = filters.start_date
    if (filters.end_date) params.end_date = filters.end_date

    const { data: res, error: err } = await statistikService.getKehadiran(params)
    if (res) {
      setData(res.data || res)
    } else {
      setError(err?.message || 'Gagal mengambil data kehadiran')
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
  const indicators = data?.indicators || {}
  const ensureArray = (val) => Array.isArray(val) ? val : []
  const trenKehadiran = ensureArray(data?.tren_kehadiran)
  const distribusiStatus = ensureArray(data?.distribusi_status)
  const kehadiranPerKelas = ensureArray(data?.kehadiran_per_kelas)
  const heatmapHari = ensureArray(data?.heatmap_hari)
  const siswaAlpha = ensureArray(data?.siswa_alpha_terbanyak)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
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
          <div className="w-full sm:w-44">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Mulai</label>
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="w-full sm:w-44">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Akhir</label>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
              icon={UserCheck}
              label="Tingkat Kehadiran Siswa"
              value={formatPercent(summary.tingkat_kehadiran_siswa)}
              color="green"
            />
            <SummaryCard
              icon={Users}
              label="Total Hadir"
              value={formatNumber(summary.total_hadir)}
              color="blue"
            />
            <SummaryCard
              icon={Clock}
              label="Tingkat Kehadiran Guru"
              value={formatPercent(summary.tingkat_kehadiran_guru)}
              color="yellow"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Indikator presensi terpisah">
            <SummaryCard icon={UserX} label="Ketidakhadiran Mapel" value={formatNumber(indicators.ketidakhadiran_mapel ?? 0)} color="red" />
            <SummaryCard icon={Clock} label="Terlambat Datang" value={formatNumber(indicators.terlambat_datang ?? 0)} color="yellow" />
            <SummaryCard icon={AlertCircle} label="Hadir Mapel Tanpa Check-in" value={formatNumber(indicators.hadir_mapel_tanpa_check_in ?? 0)} color="red" />
            <SummaryCard icon={AlertCircle} label="Hadir Mapel Setelah Check-out" value={formatNumber(indicators.hadir_mapel_setelah_check_out ?? 0)} color="red" />
          </div>

          {/* Row 1: Tren Kehadiran + Distribusi Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tren Kehadiran (Stacked Area) */}
            <Card title="Tren Kehadiran">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trenKehadiran} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                    {Object.entries(STATUS_COLORS).map(([key, color]) => (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key.toLowerCase()}
                        name={key}
                        stackId="1"
                        stroke={color}
                        fill={color}
                        fillOpacity={0.4}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Distribusi Status (Donut) */}
            <Card title="Distribusi Status Kehadiran">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribusiStatus}
                      dataKey="jumlah"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={3}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {distribusiStatus.map((entry, i) => (
                        <Cell key={i} fill={STATUS_COLORS[entry.status] || DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Row 2: Kehadiran per Kelas + Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Kehadiran per Kelas (Horizontal Bar) */}
            <Card title="Kehadiran per Kelas">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kehadiranPerKelas} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
                    <YAxis type="category" dataKey="kelas" tick={{ fontSize: 11 }} width={55} />
                    <Tooltip
                      formatter={(val) => `${formatNumber(val)}%`}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                    <Bar dataKey="persentase" name="Kehadiran %" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Heatmap Hari */}
            <Card title="Heatmap Kehadiran per Hari">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Hari</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Hadir</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Izin</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Sakit</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Alpha</th>
                      <th className="text-center py-2 px-3 font-semibold text-gray-600 dark:text-gray-400">Total %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapHari.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">{row.hari}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            {formatNumber(row.hadir)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {formatNumber(row.izin)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            {formatNumber(row.sakit)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            {formatNumber(row.alpha)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${getHeatmapColor(row.persentase_hadir)}`}>
                            {formatPercent(row.persentase_hadir)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Siswa Alpha Terbanyak */}
          {siswaAlpha.length > 0 && (
            <Card title="Siswa Alpha Terbanyak">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">#</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Nama</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">NIS</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Kelas</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Jumlah Alpha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siswaAlpha.map((siswa, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{i + 1}</td>
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{siswa.nama}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{siswa.nis}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{siswa.kelas}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            {siswa.jumlah_alpha}
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

export default KehadiranStats