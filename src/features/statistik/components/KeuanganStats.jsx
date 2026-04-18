import { useState, useEffect, useCallback } from 'react'
import {
  ComposedChart, BarChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  RefreshCw, AlertCircle, DollarSign, TrendingUp, TrendingDown,
  Wallet, PiggyBank, BarChart3,
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import statistikService from '../services/statistikService'
import { kelasService } from '../../kelas/services/kelasService'

const DONUT_COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6']
const PAYMENT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4']

const formatCurrency = (val) => {
  if (typeof val !== 'number') return val
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)}jt`
  if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)}rb`
  return `Rp ${val.toLocaleString('id-ID')}`
}

const formatCurrencyFull = (val) => {
  if (typeof val !== 'number') return val
  return `Rp ${val.toLocaleString('id-ID')}`
}

const formatPercent = (val) => {
  if (typeof val !== 'number') return val
  return `${val.toFixed(1)}%`
}

const formatNumber = (val) => {
  if (typeof val !== 'number') return val
  return val.toLocaleString('id-ID', { maximumFractionDigits: 1 })
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
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      {subValue && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subValue}</p>
      )}
    </div>
  )
}

const getCollectionColor = (rate) => {
  if (rate >= 80) return '#10B981'
  if (rate >= 50) return '#F59E0B'
  return '#EF4444'
}

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}))

const KeuanganStats = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ tahun: '', mst_kelas_id: '' })
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
    if (filters.tahun) params.tahun = filters.tahun
    if (filters.mst_kelas_id) params.mst_kelas_id = filters.mst_kelas_id

    const { data: res, error: err } = await statistikService.getKeuangan(params)
    if (res) {
      setData(res.data || res)
    } else {
      setError(err?.message || 'Gagal mengambil data keuangan')
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
  const trenPendapatan = ensureArray(data?.tren_pendapatan)
  const distribusiStatus = ensureArray(data?.distribusi_status)
  const collectionPerKelas = ensureArray(data?.collection_rate_per_kelas)
  const tunggakanPerBulan = ensureArray(data?.tunggakan_per_bulan)
  const distribusiMetode = ensureArray(data?.distribusi_metode)
  const siswaTunggakan = ensureArray(data?.siswa_tunggakan_terbanyak)

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
              icon={DollarSign}
              label="Total Pendapatan"
              value={formatCurrency(summary.total_pendapatan)}
              color="green"
            />
            <SummaryCard
              icon={Wallet}
              label="Rata-rata Bulanan"
              value={formatCurrency(summary.rata_rata_bulanan)}
              color="blue"
            />
            <SummaryCard
              icon={PiggyBank}
              label="Total Tunggakan"
              value={formatCurrency(summary.total_tunggakan)}
              color="red"
            />
            <SummaryCard
              icon={BarChart3}
              label="Collection Rate"
              value={formatPercent(summary.collection_rate)}
              color="purple"
            />
            <SummaryCard
              icon={summary.yoy_growth >= 0 ? TrendingUp : TrendingDown}
              label="YoY Growth"
              value={formatPercent(summary.yoy_growth)}
              color={summary.yoy_growth >= 0 ? 'green' : 'red'}
            />
          </div>

          {/* Row 1: Tren Pendapatan + Distribusi Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tren Pendapatan (Bar + Line) */}
            <Card title="Tren Pendapatan SPP">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trenPendapatan} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => formatCurrency(v)}
                    />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val, name) =>
                        name === 'Pendapatan' ? formatCurrencyFull(val) : formatNumber(val)
                      }
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                    <Bar yAxisId="left" dataKey="pendapatan" name="Pendapatan" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="jumlah_transaksi" name="Transaksi" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Distribusi Status (Donut) */}
            <Card title="Status Pembayaran">
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
                      {distribusiStatus.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => formatNumber(val)} />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Row 2: Collection Rate per Kelas + Tunggakan per Bulan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Collection Rate per Kelas */}
            <Card title="Collection Rate per Kelas">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={collectionPerKelas} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
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
                    <Bar dataKey="rate" name="Collection Rate" radius={[0, 4, 4, 0]}>
                      {collectionPerKelas.map((entry, i) => (
                        <Cell key={i} fill={getCollectionColor(entry.rate)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Tunggakan per Bulan */}
            <Card title="Tunggakan per Bulan">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tunggakanPerBulan} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip
                      formatter={(val) => formatCurrencyFull(val)}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                    />
                    <Bar dataKey="tunggakan" name="Tunggakan" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Row 3: Distribusi Metode + Siswa Tunggakan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribusi Metode Pembayaran */}
            <Card title="Metode Pembayaran">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribusiMetode}
                      dataKey="jumlah"
                      nameKey="metode"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {distribusiMetode.map((_, i) => (
                        <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => formatNumber(val)} />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Siswa Tunggakan Terbanyak */}
            {siswaTunggakan.length > 0 && (
              <Card title="Siswa Tunggakan Terbanyak">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">#</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Nama</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Kelas</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Tunggakan</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-600 dark:text-gray-400">Bulan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siswaTunggakan.map((siswa, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{i + 1}</td>
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{siswa.nama}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{siswa.kelas}</td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              {formatCurrencyFull(siswa.total_tunggakan)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                            {siswa.jumlah_bulan} bln
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default KeuanganStats