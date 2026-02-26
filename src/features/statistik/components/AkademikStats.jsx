import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { RefreshCw, AlertCircle, GraduationCap, Trophy } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import statistikService from '../services/statistikService'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']
const GENDER_COLORS = { 'Laki-laki': '#3B82F6', 'Perempuan': '#EC4899' }
const HISTOGRAM_COLORS = {
  '0-20': '#EF4444', '21-40': '#F97316', '41-60': '#F59E0B', '61-80': '#3B82F6', '81-100': '#10B981',
}

const SkeletonChart = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
    <div className="h-56 bg-gray-200 dark:bg-gray-700 rounded" />
  </div>
)

const formatNumber = (val) => {
  if (typeof val !== 'number') return val
  return val.toLocaleString('id-ID', { maximumFractionDigits: 1 })
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

const renderPieLabel = ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`

const AkademikStats = ({ tahunAjaranOptions = [], kelasOptions = [] }) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ tahun_ajaran_id: '', mst_kelas_id: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = {}
    if (filters.tahun_ajaran_id) params.tahun_ajaran_id = filters.tahun_ajaran_id
    if (filters.mst_kelas_id) params.mst_kelas_id = filters.mst_kelas_id

    const { data: res, error: err } = await statistikService.getAkademik(params)
    if (res) {
      setData(res.data || res)
    } else {
      setError(err?.message || 'Gagal mengambil data akademik')
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

  // Helper: safely ensure value is an array
  const ensureArray = (val) => Array.isArray(val) ? val : []

  // Transform {labels, data, colors} chart objects into recharts-compatible arrays
  const distribusiKelasRaw = data?.distribusi_siswa_per_kelas || {}
  const distribusiKelas = Array.isArray(distribusiKelasRaw)
    ? distribusiKelasRaw
    : (distribusiKelasRaw.labels || []).map((label, i) => ({
        kelas: label,
        jumlah: distribusiKelasRaw.data?.[i] ?? 0,
      }))

  const distribusiTingkatRaw = data?.distribusi_siswa_per_tingkat || {}
  const distribusiTingkat = Array.isArray(distribusiTingkatRaw)
    ? distribusiTingkatRaw
    : (distribusiTingkatRaw.labels || []).map((label, i) => ({
        tingkat: label,
        jumlah: distribusiTingkatRaw.data?.[i] ?? 0,
        color: distribusiTingkatRaw.colors?.[i] || COLORS[i % COLORS.length],
      }))

  const distribusiGenderRaw = data?.distribusi_gender || {}
  const distribusiGender = Array.isArray(distribusiGenderRaw)
    ? distribusiGenderRaw
    : (distribusiGenderRaw.labels || []).map((label, i) => ({
        gender: label,
        jumlah: distribusiGenderRaw.data?.[i] ?? 0,
      }))

  const nilaiPerMapelRaw = data?.rata_rata_nilai_per_mapel || {}
  const nilaiPerMapel = Array.isArray(nilaiPerMapelRaw)
    ? nilaiPerMapelRaw
    : (nilaiPerMapelRaw.labels || []).map((label, i) => ({
        mapel: label,
        avg: nilaiPerMapelRaw.avg?.[i] ?? nilaiPerMapelRaw.data?.[i] ?? 0,
        max: nilaiPerMapelRaw.max?.[i] ?? 0,
        min: nilaiPerMapelRaw.min?.[i] ?? 0,
      }))

  const distribusiNilaiRaw = data?.distribusi_nilai || {}
  const distribusiNilai = Array.isArray(distribusiNilaiRaw)
    ? distribusiNilaiRaw
    : (distribusiNilaiRaw.labels || []).map((label, i) => ({
        range: label,
        jumlah: distribusiNilaiRaw.data?.[i] ?? 0,
        color: distribusiNilaiRaw.colors?.[i] || HISTOGRAM_COLORS[label] || COLORS[i % COLORS.length],
      }))

  const nilaiPerKelasRaw = data?.rata_rata_nilai_per_kelas || {}
  const nilaiPerKelas = Array.isArray(nilaiPerKelasRaw)
    ? nilaiPerKelasRaw
    : (nilaiPerKelasRaw.labels || []).map((label, i) => ({
        kelas: label,
        avg: nilaiPerKelasRaw.avg?.[i] ?? nilaiPerKelasRaw.data?.[i] ?? 0,
      }))

  const top10 = ensureArray(data?.top_10_siswa_berprestasi)

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-56">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tahun Ajaran</label>
            <SearchableSelect
              name="tahun_ajaran_id"
              value={filters.tahun_ajaran_id}
              onChange={handleFilterChange}
              options={tahunAjaranOptions}
              placeholder="Semua Tahun Ajaran"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => <Card key={i}><SkeletonChart /></Card>)}
        </div>
      ) : (
        <>
          {/* Row 1: Distribusi Siswa per Kelas + per Tingkat */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribusi per Kelas */}
            <Card title="Distribusi Siswa per Kelas">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribusiKelas} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="kelas" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="jumlah" name="Jumlah Siswa" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Distribusi per Tingkat */}
            <Card title="Distribusi Siswa per Tingkat">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribusiTingkat}
                      dataKey="jumlah"
                      nameKey="tingkat"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={renderPieLabel}
                      labelLine={false}
                    >
                      {distribusiTingkat.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Row 2: Gender + Nilai per Mapel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribusi Gender */}
            <Card title="Distribusi Gender">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribusiGender}
                      dataKey="jumlah"
                      nameKey="gender"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={renderPieLabel}
                      labelLine={false}
                    >
                      {distribusiGender.map((entry, i) => (
                        <Cell key={i} fill={GENDER_COLORS[entry.gender] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Rata-rata Nilai per Mapel */}
            <Card title="Rata-rata Nilai per Mata Pelajaran">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={nilaiPerMapel} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="mapel" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                    <Bar dataKey="avg" name="Rata-rata" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="max" name="Tertinggi" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="min" name="Terendah" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Row 3: Histogram + Nilai per Kelas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribusi Nilai (Histogram) */}
            <Card title="Distribusi Nilai (Histogram)">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribusiNilai} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="jumlah" name="Jumlah Siswa" radius={[4, 4, 0, 0]}>
                      {distribusiNilai.map((entry, i) => (
                        <Cell key={i} fill={entry.color || HISTOGRAM_COLORS[entry.range] || COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Rata-rata Nilai per Kelas (Horizontal) */}
            <Card title="Rata-rata Nilai per Kelas">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={nilaiPerKelas} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <YAxis type="category" dataKey="kelas" tick={{ fontSize: 11 }} width={55} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avg" name="Rata-rata" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Top 10 Siswa Berprestasi */}
          {top10.length > 0 && (
            <Card title="Top 10 Siswa Berprestasi">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Rank</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Nama</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">NIS</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Kelas</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Rata-rata</th>
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
                              <span className="text-gray-500 dark:text-gray-400 w-4 text-center">{siswa.rank || i + 1}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{siswa.nama}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{siswa.nis}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{siswa.kelas}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            {formatNumber(siswa.rata_rata)}
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

export default AkademikStats