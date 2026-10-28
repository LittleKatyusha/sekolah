import { useMemo, useCallback } from 'react'
import {
  Clock,
  Calendar,
  MapPin,
  Search,
  ChevronRight,
  Sparkles,
  GraduationCap,
  X,
  Flame,
  RefreshCw,
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ActionsMenu from '../../../components/ui/ActionsMenu'

const HARI_MAP = {
  MON: 'Senin',
  TUE: 'Selasa',
  WED: 'Rabu',
  THU: 'Kamis',
  FRI: 'Jumat',
  SAT: 'Sabtu',
  SUN: 'Minggu',
}

const DAYS_LIST = [
  { key: 'MON', label: 'Senin' },
  { key: 'TUE', label: 'Selasa' },
  { key: 'WED', label: 'Rabu' },
  { key: 'THU', label: 'Kamis' },
  { key: 'FRI', label: 'Jumat' },
  { key: 'SAT', label: 'Sabtu' },
]

const JS_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const SUBJECT_THEMES = [
  {
    border: 'border-l-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    avatar: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    dot: 'bg-indigo-500 border-indigo-200 dark:border-indigo-900',
  },
  {
    border: 'border-l-blue-500',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    avatar: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    dot: 'bg-blue-500 border-blue-200 dark:border-blue-900',
  },
  {
    border: 'border-l-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    avatar: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    dot: 'bg-emerald-500 border-emerald-200 dark:border-emerald-900',
  },
  {
    border: 'border-l-amber-500',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    avatar: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    dot: 'bg-amber-500 border-amber-200 dark:border-amber-900',
  },
  {
    border: 'border-l-rose-500',
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    avatar: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    dot: 'bg-rose-500 border-rose-200 dark:border-rose-900',
  },
  {
    border: 'border-l-purple-500',
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    avatar: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    dot: 'bg-purple-500 border-purple-200 dark:border-purple-900',
  },
  {
    border: 'border-l-teal-500',
    badge: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    avatar: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
    dot: 'bg-teal-500 border-teal-200 dark:border-teal-900',
  },
]

const getSubjectTheme = (name = '') => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return SUBJECT_THEMES[Math.abs(hash) % SUBJECT_THEMES.length]
}

const formatTime = (timeStr) => {
  if (!timeStr) return '--:--'
  return String(timeStr).slice(0, 5)
}

const getDurationText = (jamMulai, jamSelesai) => {
  if (!jamMulai || !jamSelesai) return null
  const [sh, sm] = jamMulai.split(':').map(Number)
  const [eh, em] = jamSelesai.split(':').map(Number)
  const diff = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0))
  if (diff <= 0 || isNaN(diff)) return null
  const hours = Math.floor(diff / 60)
  const mins = diff % 60
  if (hours > 0 && mins > 0) return `${hours} jam ${mins} mnt`
  if (hours > 0) return `${hours} jam`
  return `${diff} mnt`
}

const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

const JadwalTimelineView = ({
  cardSchedules = [],
  kelasList = [],
  loading = false,
  selectedKelasId = 'all',
  setSelectedKelasId,
  activeDayTab = 'TODAY',
  setActiveDayTab,
  searchQuery = '',
  setSearchQuery,
  onDetail,
  onEdit,
  onDelete,
  isSiswa = false,
}) => {
  const todayDayKey = useMemo(() => JS_DAYS[new Date().getDay()] || 'MON', [])

  const dayCounts = useMemo(() => {
    const counts = { TOTAL: cardSchedules.length }
    DAYS_LIST.forEach((d) => {
      counts[d.key] = 0
    })
    counts.SUN = 0
    cardSchedules.forEach((item) => {
      if (item.hari) counts[item.hari] = (counts[item.hari] || 0) + 1
    })
    return counts
  }, [cardSchedules])

  const getSlotStatus = useCallback(
    (itemHari, jamMulai, jamSelesai) => {
      if (itemHari !== todayDayKey) return null
      if (!jamMulai || !jamSelesai) return null
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      const [sh, sm] = jamMulai.split(':').map(Number)
      const [eh, em] = jamSelesai.split(':').map(Number)
      const startMin = sh * 60 + (sm || 0)
      const endMin = eh * 60 + (em || 0)

      if (currentMinutes >= startMin && currentMinutes <= endMin) return 'active'
      if (currentMinutes < startMin) return 'upcoming'
      return 'passed'
    },
    [todayDayKey]
  )

  const filteredSchedules = useMemo(() => {
    return cardSchedules.filter((item) => {
      if (activeDayTab === 'TODAY') {
        if (item.hari !== todayDayKey) return false
      } else if (activeDayTab !== 'ALL') {
        if (item.hari !== activeDayTab) return false
      }

      if (selectedKelasId && selectedKelasId !== 'all') {
        const itemKelasId = item.kelas?.id ?? item.mst_kelas_id
        if (itemKelasId && String(itemKelasId) !== String(selectedKelasId)) return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const mapel = (item.guru_mapel?.mapel?.nama || item.guru_mapel?.mapel?.nama_mapel || '').toLowerCase()
        const guru = (item.guru_mapel?.guru?.nama || '').toLowerCase()
        const kelas = (item.kelas?.nama_kelas || '').toLowerCase()
        const ruangan = (item.ruangan || '').toLowerCase()
        if (!mapel.includes(q) && !guru.includes(q) && !kelas.includes(q) && !ruangan.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [cardSchedules, activeDayTab, todayDayKey, selectedKelasId, searchQuery])

  const groupedDays = useMemo(() => {
    const groups = {}
    filteredSchedules.forEach((item) => {
      const day = item.hari || 'OTHER'
      if (!groups[day]) groups[day] = []
      groups[day].push(item)
    })

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        const timeA = a.jam_mulai || '00:00'
        const timeB = b.jam_mulai || '00:00'
        return timeA.localeCompare(timeB)
      })
    })

    const ordered = []
    const canonicalOrder = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
    canonicalOrder.forEach((dayKey) => {
      if (groups[dayKey]?.length > 0) {
        ordered.push({
          dayKey,
          label: HARI_MAP[dayKey] || dayKey,
          items: groups[dayKey],
        })
      }
    })
    return ordered
  }, [filteredSchedules])

  const todayCount = dayCounts[todayDayKey] || 0
  const activeClassName = useMemo(() => {
    if (selectedKelasId === 'all') return 'Semua Kelas'
    const found = kelasList.find((k) => String(k.id) === String(selectedKelasId))
    return found?.nama_kelas || `Kelas #${selectedKelasId}`
  }, [selectedKelasId, kelasList])

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 text-white p-6 md:p-8 shadow-xl">
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white/90">
              <Sparkles size={14} className="text-yellow-300" />
              Hari ini: {HARI_MAP[todayDayKey] || 'Hari Ini'}
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {isSiswa ? `Jadwal Pelajaran ${activeClassName}` : 'Agenda Belajar Mengajar'}
            </h2>
            <p className="text-sm text-indigo-100 dark:text-indigo-200/80 max-w-xl">
              {todayCount > 0
                ? `Terdapat ${todayCount} sesi pelajaran aktif hari ini. Pantau jam mulai, ruangan, dan pengampu materi.`
                : 'Tidak ada sesi pelajaran yang terjadwal untuk hari ini. Selamat beristirahat atau belajar mandiri!'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
              <div className="text-2xl font-black">{todayCount}</div>
              <div className="text-xs text-indigo-100 font-medium mt-0.5">Hari Ini</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
              <div className="text-2xl font-black">{dayCounts.TOTAL}</div>
              <div className="text-xs text-indigo-100 font-medium mt-0.5">Total Slot</div>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 text-center">
              <div className="text-base font-bold truncate max-w-[120px] mx-auto">
                {activeClassName}
              </div>
              <div className="text-xs text-indigo-100 font-medium mt-0.5">Filter Kelas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar Filters */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Day Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveDayTab('TODAY')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeDayTab === 'TODAY'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Hari Ini ({HARI_MAP[todayDayKey]})
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeDayTab === 'TODAY'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {dayCounts[todayDayKey] || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDayTab('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeDayTab === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Semua Hari
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeDayTab === 'ALL'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {dayCounts.TOTAL}
              </span>
            </button>

            {DAYS_LIST.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setActiveDayTab(d.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeDayTab === d.key
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {d.label}
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeDayTab === d.key
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {dayCounts[d.key] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Kelas & Search Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative min-w-[170px]">
              <select
                aria-label="Filter Kelas"
                value={selectedKelasId}
                onChange={(e) => setSelectedKelasId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={String(k.id)}>
                    Kelas {k.nama_kelas}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative min-w-[220px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari mapel, guru, ruangan..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 dark:placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Hapus pencarian"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Content Area */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw size={28} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Memuat jadwal pelajaran...
          </p>
        </div>
      ) : groupedDays.length === 0 ? (
        <Card className="py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Tidak Ada Jadwal Pelajaran
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
            {searchQuery
              ? `Tidak ada pelajaran yang cocok dengan kata kunci "${searchQuery}".`
              : activeDayTab === 'TODAY'
              ? `Tidak ada jadwal pelajaran untuk hari ini (${HARI_MAP[todayDayKey] || 'Hari Ini'}).`
              : 'Belum ada slot jadwal pelajaran yang terdaftar untuk filter ini.'}
          </p>
          {(searchQuery || activeDayTab !== 'TODAY' || selectedKelasId !== 'all') && (
            <div className="mt-5">
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchQuery('')
                  setActiveDayTab('ALL')
                  setSelectedKelasId('all')
                }}
              >
                Reset Filter
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedDays.map((group) => (
            <div key={group.dayKey} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80">
                  <Calendar size={15} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                    {group.label}
                  </span>
                  {group.dayKey === todayDayKey && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white tracking-wider uppercase">
                      Hari Ini
                    </span>
                  )}
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-200 via-gray-200 to-transparent dark:from-gray-700 dark:via-gray-700" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {group.items.length} Pelajaran
                </span>
              </div>

              <div className="space-y-4 relative pl-1 sm:pl-2">
                {group.items.map((item) => {
                  const mapelNama =
                    item.guru_mapel?.mapel?.nama ||
                    item.guru_mapel?.mapel?.nama_mapel ||
                    'Mata Pelajaran'
                  const guruNama = item.guru_mapel?.guru?.nama || 'Guru Pengampu'
                  const guruNip = item.guru_mapel?.guru?.nip
                  const kelasNama =
                    item.kelas?.nama_kelas ||
                    (selectedKelasId !== 'all' ? activeClassName : null)
                  const theme = getSubjectTheme(mapelNama)
                  const duration = getDurationText(item.jam_mulai, item.jam_selesai)
                  const slotStatus = getSlotStatus(item.hari, item.jam_mulai, item.jam_selesai)

                  return (
                    <div
                      key={item.id}
                      className="relative flex flex-col md:flex-row gap-3 md:gap-6 group"
                    >
                      {/* Left Time Box */}
                      <div className="md:w-44 flex md:flex-col justify-between md:justify-start items-center md:items-end text-right shrink-0 pt-1.5">
                        <div className="flex items-center gap-1.5 text-sm md:text-base font-bold text-gray-900 dark:text-white">
                          <Clock size={15} className="text-gray-400 dark:text-gray-500 hidden md:inline" />
                          <span>
                            {formatTime(item.jam_mulai)} - {formatTime(item.jam_selesai)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {duration && (
                            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                              {duration}
                            </span>
                          )}
                          {slotStatus === 'active' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 ring-1 ring-emerald-500/30 animate-pulse">
                              <Flame size={12} className="text-emerald-600 dark:text-emerald-400" />
                              Sedang Berlangsung
                            </span>
                          )}
                          {slotStatus === 'upcoming' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                              Akan Datang
                            </span>
                          )}
                          {slotStatus === 'passed' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                              Selesai
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Desktop Node and Track */}
                      <div className="hidden md:flex flex-col items-center relative">
                        <div
                          className={`w-3.5 h-3.5 rounded-full border-2 ${
                            slotStatus === 'active'
                              ? 'bg-emerald-500 border-emerald-200 ring-4 ring-emerald-100 dark:ring-emerald-950'
                              : `${theme.dot} bg-white dark:bg-gray-900`
                          } z-10 mt-2`}
                        />
                        <div className="w-0.5 flex-1 bg-gradient-to-b from-gray-200 via-gray-200 to-transparent dark:from-gray-700 dark:via-gray-700 my-1" />
                      </div>

                      {/* Card Content */}
                      <div className="flex-1">
                        <div
                          className={`bg-white dark:bg-gray-800 rounded-2xl border-l-4 ${theme.border} border border-gray-100 dark:border-gray-700/60 p-5 shadow-sm hover:shadow-md transition-all duration-200`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${theme.badge} border`}
                                >
                                  {mapelNama}
                                </span>
                                {kelasNama && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700/60 dark:text-gray-300">
                                    <GraduationCap size={12} />
                                    Kelas {kelasNama}
                                  </span>
                                )}
                                {item.ruangan && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50">
                                    <MapPin size={12} />
                                    {item.ruangan}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white pt-1">
                                {mapelNama}
                              </h3>
                            </div>

                            <ActionsMenu
                              onDetail={() => onDetail?.(item)}
                              onEdit={() => onEdit?.(item)}
                              onDelete={() => onDelete?.(item)}
                              detailPermission="jadwal-pelajaran.view"
                              editPermission="jadwal-pelajaran.update"
                              deletePermission="jadwal-pelajaran.delete"
                            />
                          </div>

                          <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${theme.avatar} shadow-sm shrink-0`}
                              >
                                {getInitials(guruNama)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                  {guruNama}
                                </p>
                                {guruNip ? (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    NIP: {guruNip}
                                  </p>
                                ) : (
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    Guru Mata Pelajaran
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onDetail?.(item)}
                              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                            >
                              Detail
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default JadwalTimelineView
