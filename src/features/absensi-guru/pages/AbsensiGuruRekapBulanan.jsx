import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Download } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { absensiGuruService } from '../services/absensiGuruService'
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

const now = new Date()

const StatusPill = ({ count, variant }) => {
  const styles = {
    hadir: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    izin: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    sakit: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    alpha: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }
  return (
    <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold ${styles[variant]}`}>
      {count}
    </span>
  )
}

const AbsensiGuruRekapBulanan = () => {
  const navigate = useNavigate()

  const [bulan, setBulan] = useState(now.getMonth() + 1)
  const [tahun, setTahun] = useState(now.getFullYear())
  const [loading, setLoading] = useState(false)
  const [rekap, setRekap] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!bulan || !tahun) {
      showError('Pilih bulan dan tahun terlebih dahulu')
      return
    }
    setLoading(true)
    setHasSearched(true)
    const { data, error } = await absensiGuruService.getRekapBulanan({
      bulan,
      tahun,
    })
    setLoading(false)
    if (error || !data) {
      showError('Gagal mengambil rekap absensi guru')
      setRekap(null)
      return
    }
    setRekap(data.data)
  }, [bulan, tahun])

  const handleExportCSV = useCallback(() => {
    if (!rekap?.rekap?.length) return
    const bulanLabel = BULAN_OPTIONS.find((b) => b.value === Number(bulan))?.label ?? bulan
    const headers = ['No', 'NIP', 'Nama Guru', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Total Hari']
    const rows = rekap.rekap.map((row, i) => [
      i + 1,
      row.nip,
      row.nama,
      row.hadir,
      row.izin,
      row.sakit,
      row.alpha,
      row.total_hari,
    ])
    const csvContent = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rekap-absensi-guru-${bulanLabel}-${tahun}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [rekap, bulan, tahun])

  const bulanLabel = BULAN_OPTIONS.find((b) => b.value === Number(bulan))?.label ?? bulan

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => navigate('/absensi-guru')}>
            <ArrowLeft size={16} className="mr-1" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rekap Absensi Guru Bulanan
          </h1>
        </div>
        {rekap?.rekap?.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Filter */}
      <Card title="Filter Periode">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-48">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bulan
            </label>
            <select
              value={bulan}
              onChange={(e) => setBulan(Number(e.target.value))}
              className="input-field"
            >
              {BULAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
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
          <div className="flex-shrink-0">
            <Button onClick={handleSearch} loading={loading} disabled={loading}>
              <Search size={16} className="mr-2" />
              Tampilkan
            </Button>
          </div>
        </div>
      </Card>

      {/* Result table */}
      {hasSearched && (
        <Card
          title={rekap ? `Rekap ${bulanLabel} ${tahun} — ${rekap.total} Guru` : 'Tidak ada data'}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : !rekap?.rekap?.length ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10">
              Tidak ada data absensi untuk periode ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-10">No</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">NIP</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Nama Guru</th>
                    <th className="text-center py-3 px-4 font-semibold text-green-700 dark:text-green-400">Hadir</th>
                    <th className="text-center py-3 px-4 font-semibold text-yellow-700 dark:text-yellow-400">Izin</th>
                    <th className="text-center py-3 px-4 font-semibold text-orange-700 dark:text-orange-400">Sakit</th>
                    <th className="text-center py-3 px-4 font-semibold text-red-700 dark:text-red-400">Alpha</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Total Hari</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">% Hadir</th>
                  </tr>
                </thead>
                <tbody>
                  {rekap.rekap.map((row, idx) => {
                    const pctHadir = row.total_hari > 0
                      ? Math.round((row.hadir / row.total_hari) * 100)
                      : 0
                    const pctColor =
                      pctHadir >= 90 ? 'text-green-600 dark:text-green-400'
                      : pctHadir >= 75 ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'

                    return (
                      <tr
                        key={row.guru_id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{idx + 1}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 font-mono text-xs">{row.nip || '-'}</td>
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{row.nama || '-'}</td>
                        <td className="py-3 px-4 text-center"><StatusPill count={row.hadir} variant="hadir" /></td>
                        <td className="py-3 px-4 text-center"><StatusPill count={row.izin} variant="izin" /></td>
                        <td className="py-3 px-4 text-center"><StatusPill count={row.sakit} variant="sakit" /></td>
                        <td className="py-3 px-4 text-center"><StatusPill count={row.alpha} variant="alpha" /></td>
                        <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300 font-medium">{row.total_hari}</td>
                        <td className={`py-3 px-4 text-center font-semibold ${pctColor}`}>{pctHadir}%</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/40">
                    <td colSpan={3} className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Total</td>
                    <td className="py-3 px-4 text-center font-bold text-green-700 dark:text-green-400">
                      {rekap.rekap.reduce((s, r) => s + r.hadir, 0)}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-yellow-700 dark:text-yellow-400">
                      {rekap.rekap.reduce((s, r) => s + r.izin, 0)}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-orange-700 dark:text-orange-400">
                      {rekap.rekap.reduce((s, r) => s + r.sakit, 0)}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-red-700 dark:text-red-400">
                      {rekap.rekap.reduce((s, r) => s + r.alpha, 0)}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-gray-700 dark:text-gray-300">
                      {rekap.rekap.reduce((s, r) => s + r.total_hari, 0)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default AbsensiGuruRekapBulanan
