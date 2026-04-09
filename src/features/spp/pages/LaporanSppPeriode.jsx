import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Download, TrendingUp, DollarSign, CheckCircle, XCircle } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { pembayaranSppService } from '../services/sppService'
import { kelasService } from '../../kelas/services/kelasService'
import { tahunAjaranService } from '../../tahun-ajaran/services/tahunAjaranService'
import { showError } from '../../../utils/sweetalert'

const BULAN_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
]

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

const now = new Date()

const SummaryCard = ({ icon: Icon, title, value, color }) => (
  <div className={`flex items-center gap-4 p-4 rounded-xl border ${color.border} ${color.bg}`}>
    <div className={`p-3 rounded-full ${color.iconBg}`}>
      <Icon size={22} className={color.icon} />
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className={`text-xl font-bold ${color.text}`}>{value}</p>
    </div>
  </div>
)

const LaporanSppPeriode = () => {
  const navigate = useNavigate()

  const [tahun, setTahun] = useState(now.getFullYear())
  const [bulanDari, setBulanDari] = useState(1)
  const [bulanSampai, setBulanSampai] = useState(12)
  const [kelasId, setKelasId] = useState('')
  const [tahunAjaranId, setTahunAjaranId] = useState('')

  const [kelasOptions, setKelasOptions] = useState([])
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [laporan, setLaporan] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Load filter options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      const [kelasRes, tahunRes] = await Promise.all([
        kelasService.getAll({ per_page: 200 }),
        tahunAjaranService.getAll({ per_page: 50 }),
      ])
      if (kelasRes.data?.data) {
        setKelasOptions(kelasRes.data.data.map((k) => ({ value: String(k.id), label: k.nama_kelas })))
      }
      if (tahunRes.data?.data) {
        setTahunAjaranOptions(tahunRes.data.data.map((t) => ({ value: String(t.id), label: t.nama })))
      }
    }
    fetchOptions()
  }, [])

  const handleSearch = useCallback(async () => {
    if (bulanDari > bulanSampai) {
      showError('Bulan dari tidak boleh lebih besar dari bulan sampai')
      return
    }
    setLoading(true)
    setHasSearched(true)

    const params = { tahun, bulan_dari: bulanDari, bulan_sampai: bulanSampai }
    if (kelasId) params.mst_kelas_id = kelasId
    if (tahunAjaranId) params.tahun_ajaran_id = tahunAjaranId

    const { data, error } = await pembayaranSppService.getLaporanPeriode(params)
    setLoading(false)

    if (error || !data) {
      showError('Gagal mengambil laporan keuangan SPP')
      setLaporan(null)
      return
    }
    setLaporan(data.data)
  }, [tahun, bulanDari, bulanSampai, kelasId, tahunAjaranId])

  const handleExportCSV = useCallback(() => {
    if (!laporan) return

    const bulanDariLabel = BULAN_OPTIONS.find((b) => b.value === Number(laporan.filter.bulan_dari))?.label ?? laporan.filter.bulan_dari
    const bulanSampaiLabel = BULAN_OPTIONS.find((b) => b.value === Number(laporan.filter.bulan_sampai))?.label ?? laporan.filter.bulan_sampai

    const rows = []

    rows.push([`Laporan Keuangan SPP — ${bulanDariLabel} s/d ${bulanSampaiLabel} ${laporan.filter.tahun}`])
    rows.push([])
    rows.push(['RINGKASAN'])
    rows.push(['Total Pendapatan', formatCurrency(laporan.ringkasan.total_pendapatan)])
    rows.push(['Total Transaksi', laporan.ringkasan.total_transaksi])
    rows.push(['Rata-rata per Bulan', formatCurrency(laporan.ringkasan.rata_rata_per_bulan)])
    rows.push([])

    rows.push(['PER BULAN'])
    rows.push(['Bulan', 'Tahun', 'Lunas', 'Belum Lunas', 'Total Transaksi', 'Total Pendapatan'])
    laporan.per_bulan.forEach((row) => {
      rows.push([row.nama_bulan, row.tahun, row.jumlah_lunas, row.jumlah_belum_lunas, row.total_transaksi, row.total_pendapatan])
    })
    rows.push([])

    rows.push(['PER KELAS'])
    rows.push(['Kelas', 'Jumlah Siswa', 'Lunas', 'Belum Lunas', 'Total Transaksi', 'Total Pendapatan'])
    laporan.per_kelas.forEach((row) => {
      rows.push([row.nama_kelas, row.jumlah_siswa, row.jumlah_lunas, row.jumlah_belum_lunas, row.total_transaksi, row.total_pendapatan])
    })

    const csvContent = rows
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-spp-${laporan.filter.tahun}-${laporan.filter.bulan_dari}-${laporan.filter.bulan_sampai}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [laporan])

  const periodeLabel = laporan
    ? `${laporan.filter.nama_bulan_dari} – ${laporan.filter.nama_bulan_sampai} ${laporan.filter.tahun}`
    : ''

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => navigate('/keuangan/pembayaran-spp')}>
            <ArrowLeft size={16} className="mr-1" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Laporan Keuangan SPP
          </h1>
        </div>
        {laporan && (
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Filter */}
      <Card title="Filter Periode">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
            <div className="w-full sm:w-36">
              <Input
                label="Tahun"
                type="number"
                min={2000}
                max={2100}
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
              />
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dari Bulan
              </label>
              <select
                value={bulanDari}
                onChange={(e) => setBulanDari(Number(e.target.value))}
                className="input-field"
              >
                {BULAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sampai Bulan
              </label>
              <select
                value={bulanSampai}
                onChange={(e) => setBulanSampai(Number(e.target.value))}
                className="input-field"
              >
                {BULAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-56">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kelas <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <select
                value={kelasId}
                onChange={(e) => setKelasId(e.target.value)}
                className="input-field"
              >
                <option value="">Semua Kelas</option>
                {kelasOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-56">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tahun Ajaran <span className="text-gray-400 font-normal">(opsional)</span>
              </label>
              <select
                value={tahunAjaranId}
                onChange={(e) => setTahunAjaranId(e.target.value)}
                className="input-field"
              >
                <option value="">Semua Tahun Ajaran</option>
                {tahunAjaranOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex-shrink-0">
              <Button onClick={handleSearch} loading={loading} disabled={loading}>
                <Search size={16} className="mr-2" />
                Tampilkan
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && laporan && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SummaryCard
              icon={DollarSign}
              title="Total Pendapatan"
              value={formatCurrency(laporan.ringkasan.total_pendapatan)}
              color={{
                border: 'border-green-200 dark:border-green-800',
                bg: 'bg-green-50 dark:bg-green-900/20',
                iconBg: 'bg-green-100 dark:bg-green-900/40',
                icon: 'text-green-600 dark:text-green-400',
                text: 'text-green-700 dark:text-green-300',
              }}
            />
            <SummaryCard
              icon={CheckCircle}
              title="Total Transaksi Lunas"
              value={laporan.ringkasan.total_transaksi.toLocaleString('id-ID')}
              color={{
                border: 'border-blue-200 dark:border-blue-800',
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                iconBg: 'bg-blue-100 dark:bg-blue-900/40',
                icon: 'text-blue-600 dark:text-blue-400',
                text: 'text-blue-700 dark:text-blue-300',
              }}
            />
            <SummaryCard
              icon={TrendingUp}
              title="Rata-rata per Bulan"
              value={formatCurrency(laporan.ringkasan.rata_rata_per_bulan)}
              color={{
                border: 'border-purple-200 dark:border-purple-800',
                bg: 'bg-purple-50 dark:bg-purple-900/20',
                iconBg: 'bg-purple-100 dark:bg-purple-900/40',
                icon: 'text-purple-600 dark:text-purple-400',
                text: 'text-purple-700 dark:text-purple-300',
              }}
            />
          </div>

          {/* Per Bulan Table */}
          <Card title={`Rincian per Bulan — ${periodeLabel}`}>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">Bulan</th>
                    <th className="text-center py-3 px-3 font-semibold text-green-700 dark:text-green-400">Lunas</th>
                    <th className="text-center py-3 px-3 font-semibold text-red-700 dark:text-red-400">Belum Lunas</th>
                    <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">Total Transaksi</th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">Total Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  {laporan.per_bulan.map((row) => (
                    <tr
                      key={row.bulan}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">
                        {row.nama_bulan} {row.tahun}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {row.jumlah_lunas}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {row.jumlah_belum_lunas > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            {row.jumlah_belum_lunas}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-gray-700 dark:text-gray-300">
                        {row.total_transaksi}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(row.total_pendapatan)}
                      </td>
                    </tr>
                  ))}
                  {/* Subtotal row */}
                  <tr className="bg-gray-50 dark:bg-gray-800/60 border-t-2 border-gray-300 dark:border-gray-600">
                    <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">Total</td>
                    <td className="py-3 px-3 text-center font-bold text-green-700 dark:text-green-400">
                      {laporan.per_bulan.reduce((s, r) => s + r.jumlah_lunas, 0)}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-red-700 dark:text-red-400">
                      {laporan.per_bulan.reduce((s, r) => s + r.jumlah_belum_lunas, 0)}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-gray-700 dark:text-gray-300">
                      {laporan.per_bulan.reduce((s, r) => s + r.total_transaksi, 0)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-white">
                      {formatCurrency(laporan.ringkasan.total_pendapatan)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Per Kelas Table */}
          {laporan.per_kelas.length > 0 && (
            <Card title="Rincian per Kelas">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">Kelas</th>
                      <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">Jumlah Siswa</th>
                      <th className="text-center py-3 px-3 font-semibold text-green-700 dark:text-green-400">Lunas</th>
                      <th className="text-center py-3 px-3 font-semibold text-red-700 dark:text-red-400">Belum Lunas</th>
                      <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">Total Transaksi</th>
                      <th className="text-right py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">Total Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laporan.per_kelas.map((row) => (
                      <tr
                        key={row.kelas_id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-3 font-medium text-gray-900 dark:text-white">{row.nama_kelas}</td>
                        <td className="py-3 px-3 text-center text-gray-700 dark:text-gray-300">{row.jumlah_siswa}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            {row.jumlah_lunas}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {row.jumlah_belum_lunas > 0 ? (
                            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              {row.jumlah_belum_lunas}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-gray-700 dark:text-gray-300">{row.total_transaksi}</td>
                        <td className="py-3 px-3 text-right font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(row.total_pendapatan)}
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

      {!loading && hasSearched && !laporan && (
        <Card>
          <p className="text-center text-gray-500 dark:text-gray-400 py-10">
            Tidak ada data untuk periode yang dipilih.
          </p>
        </Card>
      )}
    </div>
  )
}

export default LaporanSppPeriode
