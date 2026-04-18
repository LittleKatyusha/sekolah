import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  RefreshCw, AlertCircle, FileText, ClipboardCheck,
  BarChart3, Trophy, Percent,
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import statistikService from '../services/statistikService'
import useReferenceOptions from '../../../hooks/useReferenceOptions'

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

const UjianStats = ({ kelasOptions = [], mapelOptions = [] }) => {
  const { options: semesterOptions } = useReferenceOptions('kategori_semester')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    mst_kelas_id: '',
    mst_mapel_id: '',
    semester: '',
    kkm: '70',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = {}
    if (filters.mst_kelas_id) params.mst_kelas_id = filters.mst_kelas_id
    if (filters.mst_mapel_id) params.mst_mapel_id = filters.mst_mapel_id
    if (filters.semester) params.semester = filters.semester
    if (filters.kkm) params.kkm = filters.kkm

    const { data: res, error: err } = await statistikService.getUjian(params)
    if (res) {
      setData(res.data || res)
    } else {
      setError(err?.message || 'Gagal mengambil data ujian')
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
  const passRatePerMapel = data?.pass_rate_per_mapel?.chart || {}
  const distribusiNilai = data?.distribusi_nilai || {}
  const trenSemester = ensureArray(data?.tren_per_semester)
  const perbandinganKelas = data?.perbandingan_per_kelas?.chart || {}
  const top10 = ensureArray(data?.top_10_performers)

  // Transform pass_rate_per_mapel for stacked bar
  const passRateData = (passRatePerMapel.labels || []).map((label, i) => ({
    name: label,
    lulus: passRatePerMapel.lulus?.[i] ?? 0,
    tidak_lulus: passRatePerMapel.tidak_lulus?.[i] ?? 0,
    pass_rate: passRatePerMapel.pass_rate?.[i] ?? 0,
  }))

  // Transform distribusi_nilai for histogram
  const histogramData = (distribusiNilai.labels || []).map((label, i) => ({
    name: label,
    jumlah: distribusiNilai.data?.[i] ?? 0,
    color: distribusiNilai.colors?.[i] || COLORS[i % COLORS.length],
  }))

  // Transform tren_per_semester for line chart
  const trenData = trenSemester.map((item) => ({
    name: `Semester ${item.semester}`,
    rata_rata: item.rata_rata,
  }))

  // Transform perbandingan_per_kelas for horizontal bar
  const kelasCompData = (perbandinganKelas.labels || []).map((label, i) => ({
    name: label,
    rata_rata: perbandinganKelas.rata_rata?.[i] ?? 0,
    color: perbandinganKelas.colors?.[i] || COLORS[i % COLORS.length],
  }))

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
          <div className="w-full sm:w-56">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mata Pelajaran</label>
            <SearchableSelect
              name="mst_mapel_id"
              value={filters.mst_mapel_id}
              onChange={handleFilterChange}
              options={mapelOptions}
              placeholder="Semua Mapel"
            />
          </div>
          <div className="w-full sm:w-44">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semester</label>
            <SearchableSelect
              name="semester"
              value={filters.semester}
              onChange={handleFilterChange}
              options={semesterOptions}
              placeholder="Semua Semester"
            />
          </div>
          <div className="w-full sm:w-32">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">KKM</label>
            <input
              type="number"
              name="kkm"
              value={filters.kkm}
              onChange={handleFilterChange}
              min="0"
              max="100"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
              icon={FileText}
              label="Total Ujian"
              value={formatNumber(summary.total_ujian)}
              color="blue"
            />
            <SummaryCard
              icon={ClipboardCheck}
              label="Total Nilai Tercatat"
              value={formatNumber(summary.total_nilai_tercatat)}
              color="green"
            />
            <SummaryCard
              icon={BarChart3}
              label="Rata-rata Global"
              value={formatNumber(summary.rata_rata_global)}
              subValue={`KKM: ${summary.kkm || filters.kkm}`}
              color="purple"
            />
            <SummaryCard
              icon={Percent}
              label="Pass Rate"
              value={formatPercent(summary.pass_rate)}
              color={summary.pass_rate >= 70 ? 'green' : 'red'}
            />
          </div>

          {/* Row 1: Pass Rate per Mapel + Distribusi Nilai */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pass Rate per Mapel (Stacked Bar) */}
            <Card title="Pass Rate per Mata Pelajaran">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={passRateData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                    <Bar dataKey="lulus" name="Lulus" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="tidak_lulus" name="Tidak Lulus" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Distribusi Nilai (Histogram) */}
            <Card title="Distribusi Nilai">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="jumlah" name="Jumlah Siswa" radius={[4, 4, 0, 0]}>
                      {histogramData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Row 2: Tren per Semester + Perbandingan per Kelas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tren per Semester (Line) */}
            <Card title="Tren Rata-rata per Semester">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trenData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="rata_rata"
                      name="Rata-rata"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Perbandingan per Kelas (Horizontal Bar) */}
            <Card title="Perbandingan Rata-rata per Kelas">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kelasCompData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={55} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="rata_rata" name="Rata-rata" radius={[0, 4, 4, 0]}>
                      {kelasCompData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Top 10 Performers */}
          {top10.length > 0 && (
            <Card title="Top 10 Performers">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Rank</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Nama</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">NIS</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Kelas</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Rata-rata</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Ujian</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Lulus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top10.map((siswa, i) => (
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
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            {formatNumber(siswa.rata_rata)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                          {formatNumber(siswa.total_ujian)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                          {formatNumber(siswa.total_lulus)}
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

export default UjianStats