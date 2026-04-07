import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, ShieldAlert, Lock } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { seleksiService, gelombangService } from '../services/ppdbService'
import { showError } from '../../../utils/sweetalert'

const STATUS_COLORS = {
  lolos: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cadangan: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  tidak_lolos: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  menunggu: 'bg-gray-100 text-gray-600',
}
const STATUS_LABELS = { lolos: 'Lolos', cadangan: 'Cadangan', tidak_lolos: 'Tidak Lolos', menunggu: 'Menunggu' }

const HasilSeleksiList = () => {
  const { gelombangId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [hasil, setHasil] = useState([])
  const [gelombang, setGelombang] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    fetchData()
  }, [gelombangId])

  const fetchData = async () => {
    setLoading(true)
    const [hasilRes, gelombangRes] = await Promise.all([
      seleksiService.getHasilByGelombang(gelombangId),
      gelombangService.getById(gelombangId),
    ])
    if (hasilRes.data) setHasil(hasilRes.data.data || [])
    else showError('Gagal mengambil hasil seleksi')
    if (gelombangRes.data) setGelombang(gelombangRes.data.data)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    if (!filterStatus) return hasil
    return hasil.filter(h => {
      const s = h.status_seleksi?.value || h.status_seleksi
      return s === filterStatus
    })
  }, [hasil, filterStatus])

  const counts = useMemo(() => ({
    all: hasil.length,
    lolos: hasil.filter(h => (h.status_seleksi?.value || h.status_seleksi) === 'lolos').length,
    cadangan: hasil.filter(h => (h.status_seleksi?.value || h.status_seleksi) === 'cadangan').length,
    tidak_lolos: hasil.filter(h => (h.status_seleksi?.value || h.status_seleksi) === 'tidak_lolos').length,
  }), [hasil])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate(`/ppdb/gelombang/${gelombangId}/seleksi`)}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hasil Seleksi Lengkap</h1>
            {gelombang && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{gelombang.nama_gelombang}</p>
            )}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: '', label: `Semua (${counts.all})` },
          { value: 'lolos', label: `Lolos (${counts.lolos})` },
          { value: 'cadangan', label: `Cadangan (${counts.cadangan})` },
          { value: 'tidak_lolos', label: `Tidak Lolos (${counts.tidak_lolos})` },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilterStatus(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === opt.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="p-12 text-center text-gray-400">
            Tidak ada data untuk filter ini.
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(row => {
            const statusKey = row.status_seleksi?.value || row.status_seleksi
            const isExpanded = expandedId === row.id
            return (
              <Card key={row.id}>
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : row.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                      ${row.peringkat <= 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                      #{row.peringkat}
                    </div>

                    {/* Name & info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {row.pendaftaran?.nama_lengkap || `Pendaftar #${row.ppdb_pendaftar_id}`}
                        </span>
                        {row.pendaftaran?.is_suspect_fraud && (
                          <span className="flex items-center gap-1 text-xs text-red-500">
                            <ShieldAlert size={10} /> Suspect Fraud
                          </span>
                        )}
                        {row.is_finalized && (
                          <span className="flex items-center gap-1 text-xs text-green-500">
                            <Lock size={10} /> Final
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                        {row.kuota_jurusan && <span>Jurusan: {row.kuota_jurusan.nama_jurusan}</span>}
                        {row.peringkat_jurusan > 0 && <span>Peringkat Jurusan: #{row.peringkat_jurusan}</span>}
                        {row.tiebreaker_info && <span title={row.tiebreaker_info}>⚡ Tiebreaker</span>}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex-shrink-0 text-center">
                      <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
                        {(parseFloat(row.total_skor) * 100).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400">/100</div>
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[statusKey] || STATUS_COLORS.menunggu}`}>
                        {row.status_seleksi_label || STATUS_LABELS[statusKey] || statusKey}
                      </span>
                    </div>

                    {/* Expand toggle */}
                    <div className="flex-shrink-0 text-gray-400">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Expanded: score breakdown */}
                {isExpanded && row.skor_detail && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-3 mb-2 uppercase tracking-wide">
                      Breakdown Skor Per Kriteria
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(row.skor_detail).map(([kode, detail]) => (
                        <div key={kode} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                          <div>
                            <div className="font-medium text-gray-800 dark:text-gray-200">{detail.nama || kode}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              Nilai: <strong>{detail.nilai_raw}</strong>
                              {' → '}Normalized: <strong>{detail.nilai_normalized?.toFixed(4)}</strong>
                              {' × '}Bobot: <strong>{detail.bobot}%</strong>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary-600">
                              {((detail.nilai_weighted || 0) * 100).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-400">pts</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {row.catatan_seleksi && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                        {row.catatan_seleksi}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default HasilSeleksiList
