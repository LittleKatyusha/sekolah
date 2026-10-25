import { useMemo } from 'react'
import {
  BookOpen,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Award,
  Upload,
  ArrowRight,
  FileText,
  ExternalLink,
} from 'lucide-react'

const stripHtml = (html) => (html ? html.replace(/<[^>]*>?/gm, '').trim() : '')

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

const getRelativeTime = (dateStr, isSubmitted) => {
  if (isSubmitted) return 'Sudah Dikumpulkan'
  if (!dateStr) return 'Tanpa Tenggat'
  try {
    const deadline = new Date(dateStr)
    if (isNaN(deadline.getTime())) return '-'
    const now = new Date()
    const diffMs = deadline.getTime() - now.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.round(diffMs / (1000 * 60 * 60))

    if (diffMs < 0) {
      const pastDays = Math.abs(diffDays)
      return pastDays === 0 ? 'Lewat beberapa jam lalu' : `Terlewat ${pastDays} hari lalu`
    }
    if (diffHours < 24) {
      return diffHours <= 1 ? 'Kurang dari 1 jam lagi' : `${diffHours} jam lagi`
    }
    if (diffDays === 1) return 'Besok'
    return `${diffDays} hari lagi`
  } catch {
    return '-'
  }
}

const getInitials = (name) => {
  if (!name) return 'GP'
  const p = name.trim().split(/\s+/)
  return p.length === 1
    ? p[0].slice(0, 2).toUpperCase()
    : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

const getSubjectStyle = (name = '') => {
  const n = name.toLowerCase()
  if (n.includes('biologi')) {
    return {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300',
      accent: 'from-emerald-500 to-teal-600',
      avatar: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
    }
  }
  if (n.includes('sosiologi')) {
    return {
      badge: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300',
      accent: 'from-purple-500 to-indigo-600',
      avatar: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
    }
  }
  if (n.includes('matematika')) {
    return {
      badge: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300',
      accent: 'from-blue-500 to-cyan-600',
      avatar: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
    }
  }
  return {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300',
    accent: 'from-indigo-500 to-violet-600',
    avatar: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200',
  }
}

export default function StudentTugasCard({ tugas, submission, onOpen, onSubmit }) {
  const mapelNama = tugas.guru_mapel?.mapel?.nama || 'Mata Pelajaran'
  const mapelKode = tugas.guru_mapel?.mapel?.kode || ''
  const guruNama = tugas.guru_mapel?.guru?.nama || 'Guru Pengampu'
  const kelasNama = tugas.kelas?.nama_kelas || tugas.kelas?.nama || ''
  const plainDeskripsi = useMemo(() => stripHtml(tugas.deskripsi), [tugas.deskripsi])
  const style = useMemo(() => getSubjectStyle(mapelNama), [mapelNama])

  const fileLampiran = tugas.file_lampiran || tugas.file_path || ''
  const hasLampiran = Boolean(fileLampiran && fileLampiran.trim())
  const isLampiranUrl =
    hasLampiran && (fileLampiran.startsWith('http://') || fileLampiran.startsWith('https://'))

  const isSubmitted = Boolean(submission)
  const isGraded = isSubmitted && submission.nilai !== null && submission.nilai !== undefined

  const deadlineStatus = useMemo(() => {
    if (isSubmitted) return { type: 'submitted', label: 'Terkumpul' }
    if (!tugas.tenggat_waktu) return { type: 'none', label: 'Tanpa Tenggat' }
    const deadline = new Date(tugas.tenggat_waktu)
    if (isNaN(deadline.getTime())) return { type: 'none', label: '-' }
    const now = new Date()
    const diffMs = deadline.getTime() - now.getTime()
    if (diffMs < 0) return { type: 'overdue', label: 'Lewat Tenggat' }
    if (diffMs <= 24 * 60 * 60 * 1000) return { type: 'urgent', label: 'Segera Berakhir' }
    return { type: 'active', label: 'Aktif' }
  }, [isSubmitted, tugas.tenggat_waktu])

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen?.()
        }
      }}
      className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500/40"
    >
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${style.accent}`} />

      <div>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${style.badge}`}
          >
            <BookOpen size={13} />
            <span>{mapelKode ? `${mapelKode} • ${mapelNama}` : mapelNama}</span>
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {kelasNama && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border border-gray-200/70 dark:border-gray-600">
                Kelas {kelasNama}
              </span>
            )}

            {isGraded ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                <Award size={12} /> Nilai: {submission.nilai}
              </span>
            ) : isSubmitted ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                <CheckCircle2 size={12} /> Dikumpulkan
              </span>
            ) : deadlineStatus.type === 'overdue' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/60">
                <AlertCircle size={12} /> Lewat Tenggat
              </span>
            ) : deadlineStatus.type === 'urgent' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60">
                <Clock size={12} /> Segera Berakhir
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60">
                <Clock size={12} /> Aktif
              </span>
            )}
          </div>
        </div>

        <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {tugas.judul || 'Tugas Tanpa Judul'}
        </h3>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
          {plainDeskripsi || 'Klik untuk melihat petunjuk dan detail pengerjaan tugas ini.'}
        </p>

        <div className="mt-4 flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700/60 text-xs">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 min-w-0">
            <Calendar size={13} className="text-gray-400 shrink-0" />
            <span className="truncate">
              Tenggat:{' '}
              <strong className="font-semibold text-gray-900 dark:text-white">
                {formatDateTime(tugas.tenggat_waktu)}
              </strong>
            </span>
          </div>
          <span
            className={`text-[11px] font-medium shrink-0 ml-2 ${
              deadlineStatus.type === 'overdue'
                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                : deadlineStatus.type === 'urgent'
                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {getRelativeTime(tugas.tenggat_waktu, isSubmitted)}
          </span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/60 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${style.avatar}`}
            >
              {getInitials(guruNama)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate">{guruNama}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">Guru Pengampu</p>
            </div>
          </div>
          {hasLampiran && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/50 shrink-0">
              <FileText size={11} /> Lampiran
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          {isSubmitted ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpen?.()
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white transition-all duration-200 group/btn"
            >
              <span>{isGraded ? 'Lihat Nilai & Detail' : 'Lihat Pengumpulan'}</span>
              <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onSubmit ? onSubmit() : onOpen?.()
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-xs hover:shadow transition-all duration-200 group/btn"
              >
                <Upload size={14} />
                <span>Kumpulkan Tugas</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpen?.()
                }}
                title="Lihat Detail Tugas"
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors"
              >
                Detail
              </button>
            </>
          )}

          {isLampiranUrl && (
            <a
              href={fileLampiran}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Buka File Lampiran"
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

