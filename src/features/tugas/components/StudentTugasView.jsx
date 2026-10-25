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
} from 'lucide-react'
import useAuthStore from '../../../store/useAuthStore'
import { tugasService, tugasSiswaService } from '../services/tugasService'
import StudentTugasCard from './StudentTugasCard'

export default function StudentTugasView() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [tugasList, setTugasList] = useState([])
  const [submissionMap, setSubmissionMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMapel, setSelectedMapel] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all') // 'all' | 'pending' | 'submitted' | 'graded'
  const [sortBy, setSortBy] = useState('deadline') // 'deadline' | 'newest' | 'title'

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

  const mapels = useMemo(() => {
    const counts = {}
    tugasList.forEach((t) => {
      const name = t.guru_mapel?.mapel?.nama
      if (name) {
        counts[name] = (counts[name] || 0) + 1
      }
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }, [tugasList])

  const stats = useMemo(() => {
    const total = tugasList.length
    const totalMapel = mapels.length
    let totalSubmitted = 0
    let totalGraded = 0
    let totalPending = 0

    tugasList.forEach((t) => {
      const sub = submissionMap[t.id]
      if (sub) {
        totalSubmitted += 1
        if (sub.nilai !== null && sub.nilai !== undefined) {
          totalGraded += 1
        }
      } else {
        totalPending += 1
      }
    })

    return { total, totalMapel, totalSubmitted, totalGraded, totalPending }
  }, [tugasList, mapels, submissionMap])

  const filteredTugas = useMemo(() => {
    return tugasList
      .filter((item) => {
        if (selectedMapel !== 'all') {
          const mapelNama = item.guru_mapel?.mapel?.nama || ''
          if (mapelNama.toLowerCase() !== selectedMapel.toLowerCase()) return false
        }

        const sub = submissionMap[item.id]
        if (selectedStatus === 'pending') {
          if (sub) return false
        } else if (selectedStatus === 'submitted') {
          if (!sub) return false
        } else if (selectedStatus === 'graded') {
          if (!sub || sub.nilai === null || sub.nilai === undefined) return false
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
        const timeA = a.tenggat_waktu ? new Date(a.tenggat_waktu).getTime() : Infinity
        const timeB = b.tenggat_waktu ? new Date(b.tenggat_waktu).getTime() : Infinity
        return timeA - timeB
      })
  }, [tugasList, submissionMap, selectedMapel, selectedStatus, searchQuery, sortBy])

  const handleResetFilters = () => {
    setSearchQuery('')
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
              Semua Mapel ({tugasList.length})
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
            { id: 'all', label: 'Semua', count: stats.total },
            { id: 'pending', label: '⏳ Belum Kumpul', count: stats.totalPending },
            { id: 'submitted', label: '✅ Sudah Kumpul', count: stats.totalSubmitted },
            { id: 'graded', label: '⭐ Sudah Dinilai', count: stats.totalGraded },
          ].map((s) => (
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
              {searchQuery || selectedMapel !== 'all' || selectedStatus !== 'all'
                ? 'Tugas Tidak Ditemukan'
                : 'Belum Ada Tugas'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || selectedMapel !== 'all' || selectedStatus !== 'all'
                ? 'Tidak ada tugas yang sesuai dengan kriteria pencarian atau filter yang dipilih.'
                : 'Bapak/ibu guru belum memberikan tugas untuk kelasmu saat ini.'}
            </p>
          </div>
          {(searchQuery || selectedMapel !== 'all' || selectedStatus !== 'all') && (
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
            />
          ))}
        </div>
      )}
    </div>
  )
}

