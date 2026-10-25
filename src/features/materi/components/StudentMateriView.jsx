import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Search,
  X,
  RefreshCw,
  BookOpen,
  GraduationCap,
  Play,
  FileText,
  Filter,
  ArrowUpDown
} from 'lucide-react'
import useAuthStore from '../../../store/useAuthStore'
import { materiService } from '../services/materiService'
import StudentMateriCard from './StudentMateriCard'

export default function StudentMateriView() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [materiList, setMateriList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMapel, setSelectedMapel] = useState('all')
  const [selectedType, setSelectedType] = useState('all') // 'all' | 'video' | 'file'
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'title'

  const studentName = user?.name || user?.profile?.nama || 'Siswa'

  const fetchMateri = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await materiService.getAll({
      per_page: 100,
      sort_by: 'id',
      sort_dir: 'desc'
    })

    if (!err && data) {
      const items = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : [])
      setMateriList(items)
    } else {
      setError(err?.message || 'Gagal memuat daftar materi pelajaran.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMateri()
  }, [fetchMateri])

  const mapels = useMemo(() => {
    const counts = {}
    materiList.forEach((m) => {
      const name = m.guru_mapel?.mapel?.nama
      if (name) {
        counts[name] = (counts[name] || 0) + 1
      }
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }, [materiList])

  const stats = useMemo(() => {
    const total = materiList.length
    const totalMapel = mapels.length
    const totalVideo = materiList.filter((m) => Boolean(m.link_video && m.link_video.trim())).length
    const totalFile = materiList.filter((m) => Boolean(m.file_materi && m.file_materi.trim())).length
    return { total, totalMapel, totalVideo, totalFile }
  }, [materiList, mapels])

  const filteredMateri = useMemo(() => {
    return materiList
      .filter((item) => {
        if (selectedMapel !== 'all') {
          const mapelNama = item.guru_mapel?.mapel?.nama || ''
          if (mapelNama.toLowerCase() !== selectedMapel.toLowerCase()) return false
        }
        if (selectedType === 'video') {
          if (!item.link_video || !item.link_video.trim()) return false
        } else if (selectedType === 'file') {
          if (!item.file_materi || !item.file_materi.trim()) return false
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const judul = (item.judul || '').toLowerCase()
          const mapel = (item.guru_mapel?.mapel?.nama || '').toLowerCase()
          const guru = (item.guru_mapel?.guru?.nama || '').toLowerCase()
          const desk = (item.deskripsi || '').toLowerCase()
          if (!judul.includes(q) && !mapel.includes(q) && !guru.includes(q) && !desk.includes(q)) {
            return false
          }
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'title') {
          return (a.judul || '').localeCompare(b.judul || '')
        }
        return (b.id || 0) - (a.id || 0)
      })
  }, [materiList, selectedMapel, selectedType, searchQuery, sortBy])

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedMapel('all')
    setSelectedType('all')
    setSortBy('newest')
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
              <Sparkles size={14} className="text-amber-300" />
              <span>Ruang Belajar Mandiri</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Halo, {studentName}! 👋
            </h1>
            <p className="text-sm md:text-base text-indigo-100/90 leading-relaxed max-w-xl">
              Jelajahi materi pelajaran, video penjelasan, dan modul belajar yang disiapkan bapak/ibu guru untuk menunjang belajarmu.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <p className="text-xl md:text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-indigo-200 mt-0.5">Total Materi</p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <p className="text-xl md:text-2xl font-bold">{stats.totalMapel}</p>
              <p className="text-xs text-indigo-200 mt-0.5">Mata Pelajaran</p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <p className="text-xl md:text-2xl font-bold">{stats.totalVideo}</p>
              <p className="text-xs text-indigo-200 mt-0.5">Video Belajar</p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <p className="text-xl md:text-2xl font-bold">{stats.totalFile}</p>
              <p className="text-xs text-indigo-200 mt-0.5">Modul & Dokumen</p>
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
              placeholder="Cari materi, judul, guru, atau mata pelajaran..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs transition-all"
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
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-xs"
            >
              <option value="newest">Terbaru</option>
              <option value="title">Judul (A-Z)</option>
            </select>

            <button
              type="button"
              onClick={fetchMateri}
              title="Perbarui Data"
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-xs transition-colors"
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
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Semua Mapel ({materiList.length})
            </button>
            {mapels.map((m) => (
              <button
                key={m.name}
                type="button"
                onClick={() => setSelectedMapel(m.name)}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
                  selectedMapel === m.name
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {m.name} ({m.count})
              </button>
            ))}
          </div>
        )}

        {/* Media Type Filter Pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Tipe:</span>
          {[
            { id: 'all', label: 'Semua' },
            { id: 'video', label: '🎬 Video', count: stats.totalVideo },
            { id: 'file', label: '📄 Dokumen & Slide', count: stats.totalFile }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedType === t.id
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>


      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 p-5 space-y-4">
              <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
                <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
              </div>
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
            onClick={fetchMateri}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700"
          >
            <RefreshCw size={14} />
            <span>Coba Lagi</span>
          </button>
        </div>
      ) : filteredMateri.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <BookOpen size={28} />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {searchQuery || selectedMapel !== 'all' || selectedType !== 'all'
                ? 'Materi Tidak Ditemukan'
                : 'Belum Ada Materi'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || selectedMapel !== 'all' || selectedType !== 'all'
                ? 'Tidak ada materi yang sesuai dengan pencarian atau filter yang dipilih.'
                : 'Bapak/ibu guru belum mengunggah materi pelajaran untuk saat ini.'}
            </p>
          </div>
          {(searchQuery || selectedMapel !== 'all' || selectedType !== 'all') && (
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
          {filteredMateri.map((materi) => (
            <StudentMateriCard
              key={materi.id}
              materi={materi}
              onOpen={() => navigate(`/akademik/materi/${materi.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
