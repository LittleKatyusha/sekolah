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
  MessageSquare,
  Hourglass,
  Eye,
  Users,
  Link2,
  RotateCcw,
} from 'lucide-react'
import {
  hasAttachment,
  getAttachmentPath,
  getFileName,
  openAttachment,
  isSubmissionGraded,
  getSubmissionScore,
  getSubmissionLink,
  getLinkProviderLabel,
  isGroupSubmission,
  getGroupMembers,
  isRevisionRequested,
} from '../utils/tugasFileUtils'

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

export default function StudentTugasCard({
  tugas,
  submission,
  onOpen,
  onSubmit,
  onRevise,
  onPreviewAttachment,
}) {
  const mapelNama = tugas.guru_mapel?.mapel?.nama || 'Mata Pelajaran'
  const mapelKode = tugas.guru_mapel?.mapel?.kode || ''
  const guruNama = tugas.guru_mapel?.guru?.nama || 'Guru Pengampu'
  const kelasNama = tugas.kelas?.nama_kelas || tugas.kelas?.nama || ''
  const plainDeskripsi = useMemo(() => stripHtml(tugas.deskripsi), [tugas.deskripsi])
  const style = useMemo(() => getSubjectStyle(mapelNama), [mapelNama])

  const fileLampiran = getAttachmentPath(tugas)
  const hasLampiran = hasAttachment(tugas)
  const lampiranName = getFileName(fileLampiran || tugas.file_url)

  const isSubmitted = Boolean(submission)
  const isGraded = useMemo(() => isSubmissionGraded(submission), [submission])
  const scoreValue = useMemo(() => getSubmissionScore(submission), [submission])
  const needsRevision = useMemo(() => isRevisionRequested(submission), [submission])
  const submissionLink = useMemo(() => getSubmissionLink(submission), [submission])
  const isGroup = useMemo(() => isGroupSubmission(submission), [submission])
  const groupMembers = useMemo(() => getGroupMembers(submission), [submission])
  const groupName =
    submission?.nama_kelompok ||
    submission?.metadata?.nama_kelompok ||
    (isGroup ? 'Tugas Kelompok' : '')
  const isTaskGroupHint = useMemo(() => {
    const text = `${tugas.judul || ''} ${plainDeskripsi || ''}`.toLowerCase()
    return text.includes('kelompok')
  }, [tugas.judul, plainDeskripsi])
  const teacherNote = submission?.catatan_guru || submission?.catatan || ''

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

  const handleLampiranClick = (e) => {
    e.stopPropagation()
    if (onPreviewAttachment) {
      onPreviewAttachment(
        fileLampiran,
        tugas.file_url,
        `Lampiran: ${tugas.judul || 'Tugas'}`,
        lampiranName
      )
    } else {
      openAttachment(fileLampiran, tugas.file_url)
    }
  }

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

            {needsRevision ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200/70 dark:border-orange-800/60">
                <RotateCcw size={11} /> Perlu Revisi
              </span>
            ) : isGraded ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                <Award size={12} /> Nilai: {scoreValue}
              </span>
            ) : isSubmitted ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60">
                <Hourglass size={11} /> Menunggu Koreksi
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

        {(isGroup || isTaskGroupHint || submissionLink) && (
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            {isGroup ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200/70 dark:border-violet-800/60">
                <Users size={11} />
                <span>
                  {groupName}
                  {groupMembers.length > 0 ? ` (${groupMembers.length} anggota)` : ''}
                </span>
              </span>
            ) : (
              isTaskGroupHint && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-violet-50/70 text-violet-600 dark:bg-violet-950/30 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/40">
                  <Users size={11} />
                  <span>Tugas Kelompok</span>
                </span>
              )
            )}
            {submissionLink && (
              <a
                href={submissionLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/60 transition-colors"
                title={submissionLink}
              >
                <Link2 size={11} />
                <span>{getLinkProviderLabel(submissionLink)}</span>
              </a>
            )}
          </div>
        )}

        {teacherNote && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-200">
            <MessageSquare size={13} className="shrink-0 mt-0.5 text-blue-500" />
            <p className="line-clamp-2">
              <span className="font-semibold">Catatan Guru:</span> {teacherNote}
            </p>
          </div>
        )}

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
            className={`text-[11px] font-medium shrink-0 ml-2 inline-flex items-center gap-1 ${
              isSubmitted
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                : deadlineStatus.type === 'overdue'
                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                : deadlineStatus.type === 'urgent'
                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {isSubmitted && <CheckCircle2 size={12} />}
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
            <button
              type="button"
              onClick={handleLampiranClick}
              title={`Pratinjau Lampiran (${lampiranName})`}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/50 shrink-0 transition-colors"
            >
              <FileText size={11} /> Lampiran
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          {needsRevision ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRevise ? onRevise() : onOpen?.()
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-xs hover:shadow transition-all duration-200 group/btn"
            >
              <RotateCcw size={14} />
              <span>Revisi Tugas</span>
            </button>
          ) : isSubmitted ? (
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
                className={`flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-xs hover:shadow transition-all duration-200 group/btn ${
                  deadlineStatus.type === 'overdue'
                    ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                <Upload size={14} />
                <span>
                  {deadlineStatus.type === 'overdue'
                    ? 'Kumpulkan Tugas (Terlambat)'
                    : 'Kumpulkan Tugas'}
                </span>
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

          {hasLampiran && (
            <button
              type="button"
              onClick={handleLampiranClick}
              title="Pratinjau / Buka File Lampiran"
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            >
              {onPreviewAttachment ? <Eye size={14} /> : <ExternalLink size={14} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

