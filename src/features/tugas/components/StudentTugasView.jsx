import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  Clock,
  BookOpen,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react'
import useAuthStore from '../../../store/useAuthStore'
import { tugasService, tugasSiswaService } from '../services/tugasService'
import {
  isSubmissionGraded,
  deduplicateTugasList,
  getFileName,
} from '../utils/tugasFileUtils'
import StudentTugasCard from './StudentTugasCard'
import TugasFilePreviewModal from './TugasFilePreviewModal'

export default function StudentTugasView() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const studentKelasNama =
    user?.profile?.kelas?.nama_kelas ||
    user?.profile?.kelas?.nama ||
    user?.siswa?.kelas?.nama_kelas ||
    user?.siswa?.kelas?.nama ||
    user?.kelas?.nama_kelas ||
    user?.kelas?.nama ||
    ''

  const [tugasList, setTugasList] = useState([])
  const [submissionMap, setSubmissionMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKelas, setSelectedKelas] = useState('all')
  const [selectedMapel, setSelectedMapel] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all') // 'all' | 'pending' | 'overdue' | 'submitted' | 'waiting_grade' | 'graded'
  const [sortBy, setSortBy] = useState('deadline') // 'deadline' | 'newest' | 'title'
  const [previewModal, setPreviewModal] = useState({
    open: false,
    filePath: '',
    fileUrl: '',
    title: '',
    subtitle: '',
  })

  const currentSiswaId =
    user?.profile?.id ??
    user?.profile?.mst_siswa_id ??
    user?.profile?.siswa_id ??
    user?.mst_siswa_id ??
    user?.siswa?.id ??
    ''
  const studentName = user?.profile?.nama || user?.siswa?.nama || user?.name || 'Siswa'

  const fetchTugasData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const tugasPromise = tugasService.getAll({
        per_page: 100,
        sort_by: 'id',
        sort_dir: 'desc',
      })
      const subPromise = currentSiswaId
        ? tugasSiswaService.getBySiswa(currentSiswaId)
        : Promise.resolve({ data: null, error: null })

      const [tugasRes, subRes] = await Promise.allSettled([tugasPromise, subPromise])

      if (tugasRes.status === 'fulfilled' && !tugasRes.value.error && tugasRes.value.data) {
        const raw = tugasRes.value.data
        const items = Array.isArray(raw.data) ? raw.data : Array.isArray(raw) ? raw : []
        setTugasList(items)
      } else {
        const errMsg =
          tugasRes.status === 'fulfilled' ? tugasRes.value.error?.message : 'Gagal memuat tugas.'
        setError(errMsg || 'Gagal memuat daftar tugas.')
      }

      if (subRes.status === 'fulfilled' && !subRes.value.error && subRes.value.data) {
        const rawSubs = subRes.value.data
        const subs = Array.isArray(rawSubs.data) ? rawSubs.data : Array.isArray(rawSubs) ? rawSubs : []
        const map = {}
        subs.forEach((s) => {
          const tId = s.tugas_id ?? s.mst_tugas_id ?? s.tugas?.id
          if (tId) {
            map[tId] = s
          }
        })
        setSubmissionMap(map)
      }
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat memuat data.')
    } finally {
      setLoading(false)
    }
  }, [currentSiswaId])

  useEffect(() => {
    fetchTugasData()
  }, [fetchTugasData])

  // Deduplicate identical tasks (e.g. accidental double-created tasks)
  const dedupedTugasList = useMemo(
    () => deduplicateTugasList(tugasList, submissionMap),
    [tugasList, submissionMap]
  )

  // Distinct classes present in the assignment list
  const kelasList = useMemo(() => {
    const counts = {}
    dedupedTugasList.forEach((t) => {
      const kName = t.kelas?.nama_kelas || t.kelas?.nama
      if (kName) {
        counts[kName] = (counts[kName] || 0) + 1
      }
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }, [dedupedTugasList])

  // Auto-select student's active class if multiple classes exist and student's class is known
  useEffect(() => {
    if (
      studentKelasNama &&
      kelasList.length > 1 &&
      kelasList.some((k) => k.name.toLowerCase() === studentKelasNama.toLowerCase())
    ) {
      setSelectedKelas(studentKelasNama)
    }
  }, [studentKelasNama, kelasList])

  // Base list scoped by selected class
  const classScopedTugasList = useMemo(() => {
    if (selectedKelas === 'all') return dedupedTugasList
    return dedupedTugasList.filter((t) => {
      const kName = t.kelas?.nama_kelas || t.kelas?.nama || ''
      return kName.toLowerCase() === selectedKelas.toLowerCase()
    })
  }, [dedupedTugasList, selectedKelas])

  const mapels = useMemo(() => {
    const counts = {}
    classScopedTugasList.forEach((t) => {
      const name = t.guru_mapel?.mapel?.nama
      if (name) {
        counts[name] = (counts[name] || 0) + 1
      }
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }, [classScopedTugasList])

  const stats = useMemo(() => {
    const total = classScopedTugasList.length
    const totalMapel = mapels.length
    let totalSubmitted = 0
    let totalGraded = 0
    let totalWaitingGrade = 0
    let totalPending = 0
    let totalOverdue = 0
    const now = Date.now()

    classScopedTugasList.forEach((t) => {
      const sub = submissionMap[t.id]
      if (sub) {
        totalSubmitted += 1
        if (isSubmissionGraded(sub)) {
          totalGraded += 1
        } else {
          totalWaitingGrade += 1
        }
      } else {
        totalPending += 1
        if (t.tenggat_waktu) {
          const dl = new Date(t.tenggat_waktu).getTime()
          if (!isNaN(dl) && dl < now) {
            totalOverdue += 1
          }
        }
      }
    })

    return {
      total,
      totalMapel,
      totalSubmitted,
      totalGraded,
      totalWaitingGrade,
      totalPending,
      totalOverdue,
    }
  }, [classScopedTugasList, mapels, submissionMap])

  const filteredTugas = useMemo(() => {
    const now = Date.now()
    return classScopedTugasList
      .filter((item) => {
        if (selectedMapel !== 'all') {
          const mapelNama = item.guru_mapel?.mapel?.nama || ''
          if (mapelNama.toLowerCase() !== selectedMapel.toLowerCase()) return false
        }

        const sub = submissionMap[item.id]
        const graded = isSubmissionGraded(sub)

        if (selectedStatus === 'pending') {
          if (sub) return false
        } else if (selectedStatus === 'overdue') {
          if (sub) return false
          const dl = item.tenggat_waktu ? new Date(item.tenggat_waktu).getTime() : Infinity
          if (isNaN(dl) || dl >= now) return false
        } else if (selectedStatus === 'submitted') {
          if (!sub) return false
        } else if (selectedStatus === 'waiting_grade') {
          if (!sub || graded) return false
        } else if (selectedStatus === 'graded') {
          if (!sub || !graded) return false
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const judul = (item.judul || '').toLowerCase()
          const mapel = (item.guru_mapel?.mapel?.nama || '').toLowerCase()
          const guru = (item.guru_mapel?.guru?.nama || '').toLowerCase()
          const desk = (item.deskripsi || '').toLowerCase()
          const kelas = (item.kelas?.nama_kelas || item.kelas?.nama || '').toLowerCase()
          if (
            !judul.includes(q) &&
            !mapel.includes(q) &&
            !guru.includes(q) &&
            !desk.includes(q) &&
            !kelas.includes(q)
          ) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'title') {
          return (a.judul || '').localeCompare(b.judul || '')
        }
        if (sortBy === 'newest') {
          return (b.id || 0) - (a.id || 0)
        }
        // Prioritas Pengerjaan & Tenggat Terdekat:
        // Unsubmitted tasks come first so students immediately see what needs to be done
        const subA = Boolean(submissionMap[a.id])
        const subB = Boolean(submissionMap[b.id])
        if (subA !== subB) {
          return subA ? 1 : -1
        }
        const timeA = a.tenggat_waktu ? new Date(a.tenggat_waktu).getTime() : Infinity
        const timeB = b.tenggat_waktu ? new Date(b.tenggat_waktu).getTime() : Infinity
        return timeA - timeB
      })
  }, [classScopedTugasList, submissionMap, selectedMapel, selectedStatus, searchQuery, sortBy])

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedKelas('all')
    setSelectedMapel('all')
    setSelectedStatus('all')
    setSortBy('deadline')
  }

  const handleOpenDetail = (id) => {
    navigate(`/akademik/tugas/${id}`)
  }

  const handleSubmitTugas = (tugas) => {
    navigate('/akademik/tugas-siswa/create', { state: { mst_tugas_id: String(tugas.id) } })
  }

  const handleOpenPreview = useCallback((rawPath, directUrl, title, subtitle) => {
    setPreviewModal({
      open: true,
      filePath: rawPath,
      fileUrl: directUrl,
      title: title || 'Pratinjau Lampiran Tugas',
      subtitle: subtitle || getFileName(rawPath || directUrl),
    })
  }, [])

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 text-white p-6 md:p-8 shadow-xl">
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase text-indigo-100 border border-white/20">
              <ClipboardList size={14} className="text-amber-300" />
              <span>Pusat Tugas Siswa</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Halo, {studentName}! 👋
            </h1>
            <p className="text-sm md:text-base text-indigo-100/90 leading-relaxed max-w-xl">
              Pantau tugas sekolah, perhatikan batas tenggat waktu, dan kumpulkan tugas tepat waktu.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-indigo-200 mt-0.5">Total Tugas</p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <p className="text-xl md:text-2xl font-bold">{stats.totalMapel}</p>
              <p className="text-xs text-indigo-200 mt-0.5">Mata Pelajaran</p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <p className="text-xl md:text-2xl font-bold text-amber-200">{stats.totalPending}</p>
              <p className="text-xs text-indigo-200 mt-0.5">Belum Kumpul</p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <p className="text-xl md:text-2xl font-bold text-emerald-200">{stats.totalSubmitted}</p>
              <p className="text-xs text-indigo-200 mt-0.5">Terkumpul</p>
            </div>
          </div>
        </div>
      </div>
      {/* Overdue Alert Banner */}
      {!loading && stats.totalOverdue > 0 && selectedStatus !== 'overdue' && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/50 text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
            <span>
              Kamu memiliki <strong>{stats.totalOverdue} tugas</strong> yang sudah melewati batas tenggat waktu dan belum dikumpulkan.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedStatus('overdue')}
            className="self-start sm:self-auto shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
          >
            Lihat Tugas Terlewat
          </button>
        </div>
      )}

      {/* Controls: Search, Filters & Refresh */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tugas, judul, guru, atau mata pelajaran..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {kelasList.length > 1 && (
              <div className="relative flex items-center">
                <GraduationCap
                  size={15}
                  className="absolute left-3 text-gray-400 pointer-events-none"
                />
                <select
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  aria-label="Filter Kelas"
                  className="pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
                >
                  <option value="all">Semua Kelas ({dedupedTugasList.length})</option>
                  {kelasList.map((k) => (
                    <option key={k.name} value={k.name}>
                      Kelas {k.name} ({k.count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
            >
              <option value="deadline">Tenggat Terdekat</option>
              <option value="newest">Terbaru Dibuat</option>
              <option value="title">Judul (A-Z)</option>
            </select>

            <button
              type="button"
              onClick={fetchTugasData}
              title="Perbarui Data"
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-2xs transition-colors"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin text-primary-600' : ''} />
            </button>
          </div>
        </div>

        {/* Mapel Filter Chips */}
        {mapels.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedMapel('all')}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
                selectedMapel === 'all'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Semua Mapel ({classScopedTugasList.length})
            </button>
            {mapels.map((m) => (
              <button
                key={m.name}
                type="button"
                onClick={() => setSelectedMapel(m.name)}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
                  selectedMapel === m.name
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {m.name} ({m.count})
              </button>
            ))}
          </div>
        )}

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Status:</span>
          {[
            { id: 'all', label: 'Semua', count: stats.total, show: true },
            { id: 'pending', label: '⏳ Belum Kumpul', count: stats.totalPending, show: true },
            {
              id: 'overdue',
              label: '⚠️ Lewat Tenggat',
              count: stats.totalOverdue,
              show: stats.totalOverdue > 0 || selectedStatus === 'overdue',
            },
            { id: 'submitted', label: '✅ Sudah Kumpul', count: stats.totalSubmitted, show: true },
            {
              id: 'waiting_grade',
              label: '🕐 Menunggu Koreksi',
              count: stats.totalWaitingGrade,
              show: stats.totalWaitingGrade > 0 || selectedStatus === 'waiting_grade',
            },
            { id: 'graded', label: '⭐ Sudah Dinilai', count: stats.totalGraded, show: true },
          ]
            .filter((s) => s.show)
            .map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStatus(s.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedStatus === s.id
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {s.label} ({s.count})
              </button>
            ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 p-5 space-y-4"
            >
              <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
                <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
              </div>
              <div className="h-9 w-full bg-gray-100 dark:bg-gray-700/50 rounded-xl" />
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="space-y-1">
                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-2.5 w-14 bg-gray-100 dark:bg-gray-700/50 rounded" />
                  </div>
                </div>
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900/30 p-8 space-y-3">
          <BookOpen size={48} className="mx-auto text-red-400" />
          <p className="text-base font-semibold text-gray-900 dark:text-white">{error}</p>
          <button
            type="button"
            onClick={fetchTugasData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 shadow-xs"
          >
            <RefreshCw size={14} />
            <span>Coba Lagi</span>
          </button>
        </div>
      ) : filteredTugas.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <ClipboardList size={28} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {searchQuery || selectedKelas !== 'all' || selectedMapel !== 'all' || selectedStatus !== 'all'
                ? 'Tugas Tidak Ditemukan'
                : 'Belum Ada Tugas'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || selectedKelas !== 'all' || selectedMapel !== 'all' || selectedStatus !== 'all'
                ? 'Tidak ada tugas yang sesuai dengan kriteria pencarian atau filter yang dipilih.'
                : 'Bapak/ibu guru belum memberikan tugas untuk kelasmu saat ini.'}
            </p>
          </div>
          {(searchQuery || selectedKelas !== 'all' || selectedMapel !== 'all' || selectedStatus !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors"
            >
              <X size={14} />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTugas.map((tugas) => (
            <StudentTugasCard
              key={tugas.id}
              tugas={tugas}
              submission={submissionMap[tugas.id]}
              onOpen={() => handleOpenDetail(tugas.id)}
              onSubmit={() => handleSubmitTugas(tugas)}
              onPreviewAttachment={handleOpenPreview}
            />
          ))}
        </div>
      )}

      <TugasFilePreviewModal
        isOpen={previewModal.open}
        onClose={() => setPreviewModal((prev) => ({ ...prev, open: false }))}
        filePath={previewModal.filePath}
        fileUrl={previewModal.fileUrl}
        title={previewModal.title}
        subtitle={previewModal.subtitle}
      />
    </div>
  )
}

