import { useState, useEffect, useCallback } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { reportService } from '../services/reportService'
import { siswaService } from '../features/siswa/services/siswaService'
import { kelasService } from '../features/kelas/services/kelasService'
import { tahunAjaranService } from '../features/tahun-ajaran/services/tahunAjaranService'
import { gelombangService } from '../features/ppdb/services/ppdbService'
import { ekstrakurikulerService } from '../features/ekstrakurikuler/services/ekstrakurikulerService'
import { bkKategoriService, bkKasusService } from '../features/bk/services/bkService'
import { pembayaranSppService } from '../features/spp/services/sppService'
import { ujianService } from '../features/ujian/services/ujianService'
import { showSuccess, showError, showToast } from '../utils/sweetalert'
import { FileText, Download, Play, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'

// ── Static option sets ────────────────────────────────────────────────────────
const BULAN_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2000, i, 1).toLocaleString('id-ID', { month: 'long' }),
}))

const SEMESTER_OPTIONS = [
  { value: 1, label: 'Ganjil (1)' },
  { value: 2, label: 'Genap (2)' },
]

const PPDB_STATUS_OPTIONS = [
  { value: 'pendaftaran', label: 'Pendaftaran' },
  { value: 'diterima', label: 'Diterima' },
  { value: 'cadangan', label: 'Cadangan' },
  { value: 'ditolak', label: 'Ditolak' },
]

// Param types:
//   entity  → dropdown populated from a service (loaded on demand)
//   enum    → dropdown with static options
//   date | number | text → plain inputs
//
// IMPORTANT: `path` values must match the backend ReportService registry exactly.
const REPORT_MODULES = [
  {
    id: 'akademik',
    name: 'Rapor & Nilai',
    reports: [
      {
        path: '/reports/akademik/rapor_siswa',
        name: 'Rapor Siswa per Semester',
        formats: ['pdf'],
        params: [
          { key: 'siswa_id', label: 'Siswa', type: 'entity', entity: 'siswa', required: true },
          { key: 'semester', label: 'Semester', type: 'enum', options: SEMESTER_OPTIONS, required: true },
          { key: 'tahun_ajaran_id', label: 'Tahun Ajaran', type: 'entity', entity: 'tahun_ajaran', required: true },
        ],
      },
      {
        path: '/reports/akademik/rekap_nilai_kelas',
        name: 'Rekap Nilai Kelas',
        formats: ['pdf', 'xlsx'],
        params: [
          { key: 'kelas_id', label: 'Kelas', type: 'entity', entity: 'kelas', required: true },
          { key: 'semester', label: 'Semester', type: 'enum', options: SEMESTER_OPTIONS, required: true },
          { key: 'tahun_ajaran_id', label: 'Tahun Ajaran', type: 'entity', entity: 'tahun_ajaran', required: true },
        ],
      },
      {
        path: '/reports/akademik/ranking_kelas',
        name: 'Laporan Ranking Kelas',
        formats: ['pdf'],
        params: [
          { key: 'kelas_id', label: 'Kelas', type: 'entity', entity: 'kelas', required: true },
          { key: 'semester', label: 'Semester', type: 'enum', options: SEMESTER_OPTIONS, required: true },
          { key: 'tahun_ajaran_id', label: 'Tahun Ajaran', type: 'entity', entity: 'tahun_ajaran', required: true },
        ],
      },
    ],
  },
  {
    id: 'ujian',
    name: 'Ujian',
    reports: [
      {
        path: '/reports/ujian/hasil_ujian_siswa',
        name: 'Hasil Ujian Per Siswa',
        formats: ['pdf', 'xlsx'],
        params: [
          { key: 'ujian_id', label: 'Ujian', type: 'entity', entity: 'ujian', required: true },
          { key: 'siswa_id', label: 'Siswa', type: 'entity', entity: 'siswa', required: true },
        ],
      },
      {
        path: '/reports/ujian/rekap_ujian_kelas',
        name: 'Rekap Nilai Ujian Kelas',
        formats: ['pdf', 'xlsx'],
        params: [
          { key: 'ujian_id', label: 'Ujian', type: 'entity', entity: 'ujian', required: true },
          { key: 'kelas_id', label: 'Kelas', type: 'entity', entity: 'kelas', required: true },
        ],
      },
      {
        path: '/reports/ujian/daftar_peserta',
        name: 'Daftar Peserta Ujian',
        formats: ['pdf', 'xlsx'],
        params: [
          { key: 'ujian_id', label: 'Ujian', type: 'entity', entity: 'ujian', required: true },
        ],
      },
    ],
  },
  {
    id: 'ppdb',
    name: 'PPDB',
    reports: [
      {
        path: '/reports/ppdb/daftar_pendaftar',
        name: 'Daftar Pendaftar per Gelombang',
        formats: ['pdf'],
        params: [
          { key: 'ppdb_gelombang_id', label: 'Gelombang', type: 'entity', entity: 'ppdb_gelombang', required: true },
          { key: 'status_pendaftaran', label: 'Status', type: 'enum', options: PPDB_STATUS_OPTIONS, required: true },
        ],
      },
      {
        path: '/reports/ppdb/statistik_funnel',
        name: 'Statistik Funnel PPDB',
        formats: ['pdf'],
        params: [
          { key: 'tahun_ajaran_id', label: 'Tahun Ajaran', type: 'entity', entity: 'tahun_ajaran', required: true },
          { key: 'sekolah_id', label: 'Sekolah ID', type: 'number', required: false },
        ],
      },
      {
        path: '/reports/ppdb/surat_penerimaan',
        name: 'Surat Penerimaan Siswa',
        formats: ['pdf'],
        params: [
          { key: 'pendaftar_id', label: 'Pendaftar (Siswa)', type: 'entity', entity: 'siswa', required: true },
        ],
      },
    ],
  },
  {
    id: 'bk',
    name: 'Bimbingan Konseling (BK)',
    reports: [
      {
        path: '/reports/bk/laporan_kasus_siswa',
        name: 'Laporan Kasus BK per Siswa',
        formats: ['pdf'],
        params: [
          { key: 'siswa_id', label: 'Siswa', type: 'entity', entity: 'siswa', required: true },
          { key: 'tanggal_mulai', label: 'Tanggal Mulai', type: 'date', required: true },
          { key: 'tanggal_selesai', label: 'Tanggal Selesai', type: 'date', required: true },
        ],
      },
      {
        path: '/reports/bk/rekap_kasus_periode',
        name: 'Rekap Kasus BK per Periode',
        formats: ['pdf'],
        params: [
          { key: 'tanggal_mulai', label: 'Tanggal Mulai', type: 'date', required: true },
          { key: 'tanggal_selesai', label: 'Tanggal Selesai', type: 'date', required: true },
          { key: 'kategori_id', label: 'Kategori Kasus', type: 'entity', entity: 'bk_kategori', required: false },
        ],
      },
      {
        path: '/reports/bk/detail_kasus',
        name: 'Detail Kasus dan Penanganan',
        formats: ['pdf'],
        params: [
          { key: 'kasus_id', label: 'Kasus BK', type: 'entity', entity: 'bk_kasus', required: true },
        ],
      },
    ],
  },
  {
    id: 'spk',
    name: 'Sistem Pendukung Keputusan (SPK)',
    reports: [
      {
        path: '/reports/spk/hasil_ranking',
        name: 'Hasil Ranking SPK per Periode',
        formats: ['pdf', 'xlsx'],
        params: [
          { key: 'periode', label: 'Periode (YYYY-N, mis. 2026-1)', type: 'text', required: true },
          { key: 'tahun_ajaran_id', label: 'Tahun Ajaran', type: 'entity', entity: 'tahun_ajaran', required: true },
        ],
      },
      {
        path: '/reports/spk/detail_penilaian',
        name: 'Detail Penilaian Kriteria',
        formats: ['pdf', 'xlsx'],
        params: [
          { key: 'siswa_id', label: 'Siswa', type: 'entity', entity: 'siswa', required: true },
          { key: 'periode', label: 'Periode (YYYY-N)', type: 'text', required: true },
        ],
      },
      {
        path: '/reports/spk/rekap_kriteria',
        name: 'Rekap Kriteria dan Bobot',
        formats: ['pdf', 'xlsx'],
        params: [],
      },
    ],
  },
  {
    id: 'absensi',
    name: 'Absensi Siswa & Guru',
    reports: [
      {
        path: '/reports/absensi/rekap_siswa_bulanan',
        name: 'Rekap Absensi Siswa per Bulan',
        formats: ['pdf', 'xlsx'],
        params: [
          { key: 'kelas_id', label: 'Kelas', type: 'entity', entity: 'kelas', required: true },
          { key: 'bulan', label: 'Bulan', type: 'enum', options: BULAN_OPTIONS, required: true },
          { key: 'tahun', label: 'Tahun', type: 'number', required: true },
        ],
      },
      {
        path: '/reports/absensi/rekap_guru_bulanan',
        name: 'Rekap Absensi Guru per Bulan',
        formats: ['pdf', 'xlsx'],
        params: [
          { key: 'bulan', label: 'Bulan', type: 'enum', options: BULAN_OPTIONS, required: true },
          { key: 'tahun', label: 'Tahun', type: 'number', required: true },
        ],
      },
      {
        path: '/reports/absensi/kehadiran_siswa',
        name: 'Laporan Kehadiran Individual Siswa',
        formats: ['pdf', 'xlsx'],
        params: [
          { key: 'siswa_id', label: 'Siswa', type: 'entity', entity: 'siswa', required: true },
          { key: 'semester', label: 'Semester', type: 'enum', options: SEMESTER_OPTIONS, required: true },
          { key: 'tahun_ajaran_id', label: 'Tahun Ajaran', type: 'entity', entity: 'tahun_ajaran', required: true },
        ],
      },
      {
        path: '/reports/absensi/anomali_mapel',
        name: 'Anomali Absensi Harian & Presensi Mapel',
        formats: ['pdf', 'xlsx', 'csv'],
        params: [
          { key: 'tanggal_awal', label: 'Tanggal Awal', type: 'date', required: true },
          { key: 'tanggal_akhir', label: 'Tanggal Akhir', type: 'date', required: true },
          { key: 'kelas_id', label: 'Kelas (opsional)', type: 'entity', entity: 'kelas', required: false },
        ],
      },
    ],
  },
  {
    id: 'spp',
    name: 'SPP / Keuangan',
    reports: [
      {
        path: '/reports/spp/kuitansi_pembayaran',
        name: 'Kuitansi Pembayaran SPP',
        formats: ['pdf'],
        params: [
          { key: 'pembayaran_id', label: 'Transaksi Pembayaran', type: 'entity', entity: 'pembayaran_spp', required: true },
        ],
      },
      {
        path: '/reports/spp/rekap_bulanan',
        name: 'Rekap Pembayaran per Bulan',
        formats: ['pdf'],
        params: [
          { key: 'bulan', label: 'Bulan', type: 'enum', options: BULAN_OPTIONS, required: true },
          { key: 'tahun', label: 'Tahun', type: 'number', required: true },
          { key: 'kelas_id', label: 'Kelas', type: 'entity', entity: 'kelas', required: false },
        ],
      },
      {
        path: '/reports/spp/tunggakan',
        name: 'Laporan Tunggakan SPP',
        formats: ['pdf'],
        params: [
          { key: 'tahun_ajaran_id', label: 'Tahun Ajaran', type: 'entity', entity: 'tahun_ajaran', required: true },
          { key: 'kelas_id', label: 'Kelas', type: 'entity', entity: 'kelas', required: false },
        ],
      },
    ],
  },
  {
    id: 'perpustakaan',
    name: 'Perpustakaan',
    reports: [
      {
        path: '/reports/perpustakaan/peminjaman_aktif',
        name: 'Daftar Peminjaman Aktif',
        formats: ['pdf'],
        params: [],
      },
      {
        path: '/reports/perpustakaan/keterlambatan',
        name: 'Laporan Keterlambatan',
        formats: ['pdf'],
        params: [
          { key: 'tanggal', label: 'Per Tanggal', type: 'date', required: true },
        ],
      },
      {
        path: '/reports/perpustakaan/statistik',
        name: 'Statistik Peminjaman',
        formats: ['pdf'],
        params: [
          { key: 'bulan', label: 'Bulan', type: 'enum', options: BULAN_OPTIONS, required: true },
          { key: 'tahun', label: 'Tahun', type: 'number', required: true },
        ],
      },
    ],
  },
  {
    id: 'ekskul',
    name: 'Ekstrakurikuler',
    reports: [
      {
        path: '/reports/ekskul/daftar_anggota',
        name: 'Daftar Anggota Ekstrakurikuler',
        formats: ['pdf'],
        params: [
          { key: 'ekstrakurikuler_id', label: 'Ekstrakurikuler', type: 'entity', entity: 'ekskul', required: true },
        ],
      },
      {
        path: '/reports/ekskul/rekap_kehadiran',
        name: 'Rekap Kehadiran Latihan',
        formats: ['pdf'],
        params: [
          { key: 'ekstrakurikuler_id', label: 'Ekstrakurikuler', type: 'entity', entity: 'ekskul', required: true },
          { key: 'bulan', label: 'Bulan', type: 'enum', options: BULAN_OPTIONS, required: true },
          { key: 'tahun', label: 'Tahun', type: 'number', required: true },
        ],
      },
    ],
  },
  {
    id: 'statistik',
    name: 'Statistik (Dashboard)',
    reports: [
      {
        path: '/reports/statistik/akademik',
        name: 'Ringkasan Statistik Akademik',
        formats: ['pdf', 'xlsx'],
        params: [
          { key: 'tahun_ajaran_id', label: 'Tahun Ajaran', type: 'entity', entity: 'tahun_ajaran', required: true },
          { key: 'semester', label: 'Semester', type: 'enum', options: SEMESTER_OPTIONS, required: true },
        ],
      },
      {
        path: '/reports/statistik/kehadiran',
        name: 'Statistik Kehadiran Sekolah',
        formats: ['pdf', 'xlsx'],
        params: [
          { key: 'bulan', label: 'Bulan', type: 'enum', options: BULAN_OPTIONS, required: true },
          { key: 'tahun', label: 'Tahun', type: 'number', required: true },
        ],
      },
      {
        path: '/reports/statistik/keuangan',
        name: 'Statistik Keuangan SPP',
        formats: ['pdf', 'xlsx'],
        params: [
          { key: 'tahun_ajaran_id', label: 'Tahun Ajaran', type: 'entity', entity: 'tahun_ajaran', required: true },
        ],
      },
      {
        path: '/reports/statistik/ppdb',
        name: 'Statistik PPDB',
        formats: ['pdf', 'xlsx'],
        params: [
          { key: 'tahun_ajaran_id', label: 'Tahun Ajaran', type: 'entity', entity: 'tahun_ajaran', required: true },
        ],
      },
    ],
  },
]

// Maps an entity key → its loader + option mapper. Loaded on demand and cached.
const ENTITY_LOADERS = {
  siswa: {
    load: () => siswaService.getAll({ per_page: 500 }),
    map: (s) => ({ value: String(s.id), label: `${s.nis || '-'} - ${s.nama || s.nama_lengkap || `Siswa #${s.id}`}` }),
  },
  kelas: {
    load: () => kelasService.getAll({ per_page: 200 }),
    map: (k) => ({ value: String(k.id), label: k.nama_kelas || `Kelas #${k.id}` }),
  },
  tahun_ajaran: {
    load: () => tahunAjaranService.getAll({ per_page: 50 }),
    map: (ta) => ({ value: String(ta.id), label: ta.nama || ta.tahun_ajaran || `Tahun Ajaran #${ta.id}` }),
  },
  ujian: {
    load: () => ujianService.getAll({ per_page: 200 }),
    map: (u) => ({ value: String(u.id), label: `${u.nama || `Ujian #${u.id}`}${u.kelas?.nama_kelas ? ` — ${u.kelas.nama_kelas}` : ''}` }),
  },
  ppdb_gelombang: {
    load: () => gelombangService.getAll({ per_page: 50 }),
    map: (g) => ({ value: String(g.id), label: g.nama_gelombang || `Gelombang #${g.id}` }),
  },
  bk_kategori: {
    load: () => bkKategoriService.getAll({ per_page: 100 }),
    map: (c) => ({ value: String(c.id), label: c.nama || `Kategori #${c.id}` }),
  },
  bk_kasus: {
    load: () => bkKasusService.getAll({ per_page: 150 }),
    map: (c) => ({
      value: String(c.id),
      label: `${c.siswa?.nama || `Siswa #${c.siswa_id}`} — ${c.jenis?.nama || 'BK'} (${c.tanggal || '-'})`,
    }),
  },
  ekskul: {
    load: () => ekstrakurikulerService.getAll({ per_page: 100 }),
    map: (e) => ({ value: String(e.id), label: e.nama || `Ekskul #${e.id}` }),
  },
  pembayaran_spp: {
    load: () => pembayaranSppService.getAll({ per_page: 150 }),
    map: (p) => ({
      value: String(p.id),
      label: `#${p.nomor_transaksi || p.id} — ${p.siswa?.nama || `Siswa #${p.siswa_id}`}`,
    }),
  },
}

const buildDefaults = (report) => {
  const defaults = {}
  report.params.forEach((p) => {
    if (p.type === 'enum' && p.options?.length) {
      defaults[p.key] = p.options[0].value
    } else if (p.type === 'number' && p.key === 'tahun') {
      defaults[p.key] = new Date().getFullYear()
    } else if (p.type === 'date') {
      defaults[p.key] = ''
    } else {
      defaults[p.key] = ''
    }
  })
  return defaults
}

const Reports = () => {
  const [activeModule, setActiveModule] = useState(REPORT_MODULES[0])
  const [selectedReport, setSelectedReport] = useState(REPORT_MODULES[0].reports[0])
  const [format, setFormat] = useState(REPORT_MODULES[0].reports[0].formats[0])
  const [outputFilename, setOutputFilename] = useState('')
  const [paramValues, setParamValues] = useState(() => buildDefaults(REPORT_MODULES[0].reports[0]))

  const [entityOptions, setEntityOptions] = useState({})
  const [loadingEntities, setLoadingEntities] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [jobs, setJobs] = useState([])

  // Load only the entity dropdowns the selected report actually needs.
  useEffect(() => {
    const needed = selectedReport.params
      .filter((p) => p.type === 'entity' && p.entity)
      .map((p) => p.entity)

    const missing = needed.filter((e) => !entityOptions[e])
    if (missing.length === 0) return

    let cancelled = false
    const loadMissing = async () => {
      setLoadingEntities(true)
      const results = await Promise.all(
        missing.map(async (entity) => {
          const loader = ENTITY_LOADERS[entity]
          if (!loader) return [entity, []]
          try {
            const { data } = await loader.load()
            const rows = Array.isArray(data?.data) ? data.data : []
            return [entity, rows.map(loader.map)]
          } catch (err) {
            console.error(`Failed to load options for ${entity}:`, err)
            return [entity, []]
          }
        })
      )
      if (cancelled) return
      setEntityOptions((prev) => {
        const next = { ...prev }
        results.forEach(([entity, opts]) => {
          next[entity] = opts
        })
        return next
      })
      setLoadingEntities(false)
    }

    loadMissing()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport])

  const selectReport = (report) => {
    setSelectedReport(report)
    setFormat(report.formats[0])
    setOutputFilename('')
    setParamValues(buildDefaults(report))
  }

  const selectModule = (mod) => {
    setActiveModule(mod)
    selectReport(mod.reports[0])
  }

  const setParam = (key, value) => {
    setParamValues((prev) => ({ ...prev, [key]: value }))
  }

  // Validate required params + build a type-cast payload.
  const buildPayload = () => {
    for (const p of selectedReport.params) {
      const val = paramValues[p.key]
      if (p.required && (val === undefined || val === null || val === '')) {
        showError(`Parameter "${p.label}" wajib diisi.`)
        return null
      }
    }

    const parameters = {}
    selectedReport.params.forEach((p) => {
      const raw = paramValues[p.key]
      if (raw === undefined || raw === null || raw === '') {
        parameters[p.key] = null
        return
      }
      // IDs and numeric fields go over the wire as numbers.
      if (p.type === 'entity' || p.type === 'number' || (p.type === 'enum' && typeof p.options?.[0]?.value === 'number')) {
        parameters[p.key] = Number(raw)
      } else {
        parameters[p.key] = raw
      }
    })

    return {
      report_path: selectedReport.path,
      parameters,
      format,
      output_filename: outputFilename.trim() || null,
    }
  }

  const handleGenerateSync = async () => {
    const payload = buildPayload()
    if (!payload) return

    setGenerating(true)
    showToast('Laporan sedang dirender...', 'info')
    const { error } = await reportService.generateAndDownload(payload)
    setGenerating(false)

    if (error) {
      showError(error.message || 'Gagal menghasilkan laporan.')
    } else {
      showSuccess('Laporan berhasil diunduh.')
    }
  }

  const handleGenerateAsync = async () => {
    const payload = buildPayload()
    if (!payload) return

    setGenerating(true)
    const { data, error } = await reportService.generateAsync(payload)
    setGenerating(false)

    if (error || !data?.data?.job_id) {
      showError(error?.message || 'Gagal membuat job laporan.')
      return
    }

    const job = data.data
    setJobs((prev) => [
      {
        id: job.job_id,
        name: selectedReport.name,
        format,
        status: job.status || 'queued',
        createdAt: new Date().toLocaleTimeString(),
        downloadUrl: null,
        fileName: null,
      },
      ...prev,
    ])
    showSuccess(`Job masuk antrian (ID: ${job.job_id}). Pantau statusnya di bawah.`)
  }

  const checkJobStatus = useCallback(async (jobId) => {
    const { data, error } = await reportService.getJobStatus(jobId)
    if (error || !data?.data) {
      showError('Gagal mengambil status job.')
      return
    }
    const payload = data.data
    const exp = payload.exports?.[0]
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: payload.status || 'failed',
              downloadUrl: payload.download_url || exp?.download_url || null,
              fileName: payload.file_name || exp?.file_name || null,
            }
          : j
      )
    )
    if (payload.status === 'ready') showSuccess(`Job ${jobId} selesai dan siap diunduh.`)
    else if (payload.status === 'failed') showError(`Job ${jobId} gagal diproses.`)
    else showToast(`Status job: ${payload.status}`, 'info')
  }, [])

  const renderParam = (p) => {
    const val = paramValues[p.key] ?? ''

    if (p.type === 'entity') {
      const opts = entityOptions[p.entity] || []
      return (
        <div key={p.key} className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {p.label} {p.required ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal text-xs">(opsional)</span>}
          </label>
          <select
            value={val}
            onChange={(e) => setParam(p.key, e.target.value)}
            className="input-field"
            disabled={loadingEntities || generating}
          >
            <option value="">{loadingEntities ? 'Memuat data...' : `-- Pilih ${p.label} --`}</option>
            {opts.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )
    }

    if (p.type === 'enum') {
      return (
        <div key={p.key} className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {p.label} {p.required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={val}
            onChange={(e) => setParam(p.key, e.target.value)}
            className="input-field"
            disabled={generating}
          >
            {p.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )
    }

    if (p.type === 'date') {
      return (
        <div key={p.key} className="space-y-1.5">
          <Input
            label={`${p.label}${p.required ? ' *' : ''}`}
            type="date"
            value={val}
            onChange={(e) => setParam(p.key, e.target.value)}
            disabled={generating}
          />
        </div>
      )
    }

    return (
      <div key={p.key} className="space-y-1.5">
        <Input
          label={`${p.label}${p.required ? ' *' : ''}`}
          type={p.type === 'number' ? 'number' : 'text'}
          value={val}
          onChange={(e) => setParam(p.key, e.target.value)}
          placeholder={`Masukkan ${p.label}`}
          disabled={generating}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText size={26} className="text-primary-600" />
          Pusat Laporan
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Cetak dokumen resmi dan rekap data seluruh modul sekolah, langsung atau via antrian background.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Module list */}
        <div className="lg:col-span-1">
          <Card title="Modul">
            <nav className="flex flex-col space-y-1">
              {REPORT_MODULES.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => selectModule(mod)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
                    activeModule.id === mod.id
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <span>{mod.name}</span>
                  <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">
                    {mod.reports.length}
                  </span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Configurator */}
        <div className="lg:col-span-3 space-y-6">
          <Card title={`${activeModule.name} — Konfigurasi Laporan`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Template list */}
              <div className="md:col-span-1 md:border-r border-gray-100 dark:border-gray-800 md:pr-4 space-y-2">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Daftar Laporan
                </label>
                <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                  {activeModule.reports.map((rep) => (
                    <button
                      key={rep.path}
                      onClick={() => selectReport(rep)}
                      className={`w-full flex items-start gap-2 p-2.5 rounded-md text-left text-xs transition-colors border ${
                        selectedReport.path === rep.path
                          ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-900/40 dark:text-primary-400'
                          : 'border-transparent text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                    >
                      <FileText size={15} className="shrink-0 mt-0.5" />
                      <span className="font-medium leading-tight">{rep.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Params + actions */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-md border border-gray-100 dark:border-gray-800">
                  <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Template Path</span>
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">{selectedReport.path}</span>
                </div>

                {selectedReport.params.length === 0 ? (
                  <p className="text-xs text-gray-500 py-3 text-center italic">
                    Laporan ini tidak membutuhkan parameter input.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedReport.params.map(renderParam)}
                  </div>
                )}

                <hr className="border-gray-100 dark:border-gray-800" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Format</label>
                    <div className="flex gap-2">
                      {selectedReport.formats.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFormat(f)}
                          className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
                            format === f
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                          disabled={generating}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Input
                      label="Nama File Hasil (opsional)"
                      type="text"
                      value={outputFilename}
                      onChange={(e) => setOutputFilename(e.target.value)}
                      placeholder="Contoh: rekap_nilai_2026"
                      disabled={generating}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={handleGenerateAsync} disabled={generating || loadingEntities}>
                    <Play size={16} className="mr-2" />
                    Kirim ke Antrian
                  </Button>
                  <Button onClick={handleGenerateSync} loading={generating} disabled={generating || loadingEntities}>
                    <Download size={16} className="mr-2" />
                    Cetak & Unduh
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {jobs.length > 0 && (
            <Card title="Antrian Laporan (Background Job)">
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left py-2 px-3 text-gray-400 font-semibold uppercase">Laporan</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-semibold uppercase">Format</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-semibold uppercase">Waktu</th>
                      <th className="text-center py-2 px-3 text-gray-400 font-semibold uppercase">Status</th>
                      <th className="text-right py-2 px-3 text-gray-400 font-semibold uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-b border-gray-50 dark:border-gray-800/40">
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{job.name}</p>
                          <p className="text-[10px] font-mono text-gray-400 mt-0.5">{job.id}</p>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono uppercase">{job.format}</td>
                        <td className="py-2.5 px-3 text-center text-gray-500">{job.createdAt}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold uppercase ${
                            job.status === 'ready'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : job.status === 'failed'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {job.status === 'ready' && <CheckCircle size={10} />}
                            {job.status === 'failed' && <AlertTriangle size={10} />}
                            {job.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => checkJobStatus(job.id)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-400"
                              title="Perbarui status"
                            >
                              <RefreshCw size={13} />
                            </button>
                            {job.status === 'ready' && job.downloadUrl && (
                              <button
                                onClick={async () => {
                                  try {
                                    await reportService.triggerBrowserDownload(job.downloadUrl, job.fileName)
                                  } catch (error) {
                                    showError(error.response?.data?.message || 'Unduhan laporan gagal.')
                                  }
                                }}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-primary-600"
                                title="Unduh file"
                              >
                                <Download size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports
