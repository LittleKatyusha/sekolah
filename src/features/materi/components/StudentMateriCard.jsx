import { useMemo } from 'react'
import {
  BookOpen,
  FileText,
  ExternalLink,
  Calendar,
  ArrowRight,
  Play,
  Presentation,
  ClipboardList,
  CheckCircle2,
  Eye,
} from 'lucide-react'
import { openAttachment, getFileName } from '../../tugas/utils/tugasFileUtils'

const stripHtml = (html) => (html ? html.replace(/<[^>]*>?/gm, '').trim() : '')

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

const getInitials = (name) => {
  if (!name) return 'GP'
  const p = name.trim().split(/\s+/)
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

const getSubjectStyle = (name = '') => {
  const n = name.toLowerCase()
  if (n.includes('biologi')) return { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300', accent: 'from-emerald-500 to-teal-600', avatar: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' }
  if (n.includes('sosiologi')) return { badge: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300', accent: 'from-purple-500 to-indigo-600', avatar: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200' }
  if (n.includes('matematika')) return { badge: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300', accent: 'from-blue-500 to-cyan-600', avatar: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' }
  return { badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300', accent: 'from-indigo-500 to-violet-600', avatar: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200' }
}

export default function StudentMateriCard({
  materi,
  relatedTugasCount = 0,
  isAccessed = false,
  onOpen,
  onOpenTugas,
  onPreviewFile,
}) {
  const mapelNama = materi.guru_mapel?.mapel?.nama || 'Mata Pelajaran'
  const mapelKode = materi.guru_mapel?.mapel?.kode || ''
  const guruNama = materi.guru_mapel?.guru?.nama || 'Guru Pengampu'
  const plainDeskripsi = useMemo(() => stripHtml(materi.deskripsi), [materi.deskripsi])
  const style = useMemo(() => getSubjectStyle(mapelNama), [mapelNama])

  const isVideo = Boolean(materi.link_video && materi.link_video.trim())
  const isSlide = isVideo && materi.link_video.includes('docs.google.com/presentation')
  const hasFile = Boolean((materi.file_materi && materi.file_materi.trim()) || materi.file_url)

  const handleFilePreview = (e) => {
    e.stopPropagation()
    if (onPreviewFile) {
      onPreviewFile(
        materi.file_materi,
        materi.file_url,
        `Modul: ${materi.judul || 'Materi'}`,
        getFileName(materi.file_materi || materi.file_url)
      )
    } else {
      openAttachment(materi.file_materi, materi.file_url)
    }
  }

  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen?.() } }}
      className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500/40"
    >
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${style.accent}`} />
      <div>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${style.badge}`}>
            <BookOpen size={13} />
            <span>{mapelKode ? `${mapelKode} • ${mapelNama}` : mapelNama}</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {isAccessed && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60">
                <CheckCircle2 size={11} /> Dipelajari
              </span>
            )}
            {isSlide ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60">
                <Presentation size={11} /> Slide
              </span>
            ) : isVideo ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/60">
                <Play size={11} className="fill-current" /> Video
              </span>
            ) : null}
            {hasFile && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60">
                <FileText size={11} /> Modul
              </span>
            )}
          </div>
        </div>

        <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {materi.judul || 'Materi Tanpa Judul'}
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
          {plainDeskripsi || 'Klik untuk melihat detail materi ini.'}
        </p>

        {relatedTugasCount > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenTugas?.()
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 transition-colors"
              title="Lihat Tugas Terkait Mata Pelajaran Ini"
            >
              <ClipboardList size={11} />
              <span>{relatedTugasCount} Tugas Terkait</span>
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700/60 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${style.avatar}`}>
              {getInitials(guruNama)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate">{guruNama}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">Guru Pengampu</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 shrink-0">
            <Calendar size={12} />
            <span>{formatDate(materi.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpen?.() }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary-50 hover:bg-primary-600 text-primary-700 hover:text-white dark:bg-primary-950/40 dark:text-primary-300 dark:hover:bg-primary-600 dark:hover:text-white transition-all duration-200 group/btn"
          >
            <span>Pelajari Materi</span>
            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
          {isVideo && (
            <a
              href={materi.link_video}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={isSlide ? 'Buka Slide Presentasi' : 'Buka Video'}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          )}
          {hasFile && (
            <button
              type="button"
              onClick={handleFilePreview}
              title="Pratinjau / Buka Dokumen Modul"
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            >
              {onPreviewFile ? <Eye size={14} /> : <FileText size={14} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

