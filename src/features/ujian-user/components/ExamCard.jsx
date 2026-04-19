import { Clock, PlayCircle, CheckCircle, Award, BookOpen, Calendar, ArrowRight, Timer } from 'lucide-react'

const STATUS_CONFIG = {
  0: {
    label: 'Belum Mulai',
    icon: Clock,
    badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    borderAccent: 'border-l-gray-400 dark:border-l-gray-500',
    iconColor: 'text-gray-500 dark:text-gray-400',
    bgGradient: 'from-gray-50 to-white dark:from-gray-800 dark:to-gray-800',
  },
  1: {
    label: 'Sedang Mengerjakan',
    icon: PlayCircle,
    badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    borderAccent: 'border-l-yellow-400 dark:border-l-yellow-500',
    iconColor: 'text-yellow-500 dark:text-yellow-400',
    bgGradient: 'from-yellow-50 to-white dark:from-yellow-900/10 dark:to-gray-800',
  },
  2: {
    label: 'Selesai',
    icon: CheckCircle,
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    borderAccent: 'border-l-blue-400 dark:border-l-blue-500',
    iconColor: 'text-blue-500 dark:text-blue-400',
    bgGradient: 'from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-800',
  },
  3: {
    label: 'Dinilai',
    icon: Award,
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    borderAccent: 'border-l-green-400 dark:border-l-green-500',
    iconColor: 'text-green-500 dark:text-green-400',
    bgGradient: 'from-green-50 to-white dark:from-green-900/10 dark:to-gray-800',
  },
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '-'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}j ${minutes}m`
  return `${minutes} menit`
}

const ExamCard = ({ data, onStart, onContinue, onViewDetail }) => {
  const status = data?.status ?? 0
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[0]
  const StatusIcon = config.icon

  const ujianName = data.ujian?.nama || `Ujian #${data.trx_ujian_id}`
  const mapelName = data.ujian?.mapel?.nama || '-'
  const kelasName = data.ujian?.kelas?.nama_kelas || '-'

  const getActionLabel = () => {
    switch (status) {
      case 0: return 'Mulai Ujian'
      case 1: return 'Lanjutkan'
      case 2: return 'Lihat Detail'
      case 3: return 'Lihat Hasil'
      default: return 'Lihat Detail'
    }
  }

  const getActionVariant = () => {
    switch (status) {
      case 0: return 'primary'
      case 1: return 'warning'
      case 2: return 'secondary'
      case 3: return 'success'
      default: return 'secondary'
    }
  }

  const handleAction = () => {
    switch (status) {
      case 0: return onStart?.()
      case 1: return onContinue?.()
      default: return onViewDetail?.()
    }
  }

  const nilaiAkhir = data.nilai_akhir
  const nilaiColorClass = nilaiAkhir !== null && nilaiAkhir !== undefined
    ? parseFloat(nilaiAkhir) >= 70
      ? 'text-green-600 dark:text-green-400'
      : parseFloat(nilaiAkhir) >= 60
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400'
    : ''

  return (
    <div
      className={`
        group relative bg-gradient-to-br ${config.bgGradient}
        rounded-xl border border-gray-200 dark:border-gray-700
        border-l-4 ${config.borderAccent}
        p-5 hover:shadow-lg hover:-translate-y-0.5
        transition-all duration-200 cursor-pointer
        flex flex-col justify-between min-h-[220px]
      `}
      onClick={handleAction}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAction() } }}
    >
      {/* Header: Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.badgeClass}`}>
          <StatusIcon size={14} />
          {config.label}
        </span>
        <StatusIcon size={20} className={`${config.iconColor} opacity-40 group-hover:opacity-70 transition-opacity`} />
      </div>

      {/* Body: Exam Info */}
      <div className="flex-1">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 leading-snug">
          {ujianName}
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
          <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {mapelName}{kelasName !== '-' ? ` • ${kelasName}` : ''}
          </span>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
        {data.ujian?.tanggal && (
          <span className="flex items-center gap-1">
            <Calendar size={13} className="shrink-0" />
            {formatDateTime(data.ujian.tanggal)}
          </span>
        )}
        {data.sisa_waktu > 0 && status === 1 && (
          <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-medium">
            <Timer size={13} className="shrink-0" />
            {formatDuration(data.sisa_waktu)} tersisa
          </span>
        )}
        {(!data.sisa_waktu || data.sisa_waktu <= 0 || status !== 1) && data.waktu_selesai && (
          <span className="flex items-center gap-1">
            <Clock size={13} className="shrink-0" />
            Selesai {formatDateTime(data.waktu_selesai)}
          </span>
        )}
      </div>

      {/* Results (for Dinilai status) */}
      {status === 3 && nilaiAkhir !== null && nilaiAkhir !== undefined && (
        <div className="flex items-center gap-3 mb-4 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <Award size={18} className={nilaiColorClass} />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Nilai Akhir</p>
            <p className={`text-xl font-bold ${nilaiColorClass}`}>
              {nilaiAkhir}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {data.total_benar != null && (
              <span className="text-green-600 dark:text-green-400">✓ {data.total_benar}</span>
            )}
            {data.total_salah != null && (
              <span className="text-red-500 dark:text-red-400">✗ {data.total_salah}</span>
            )}
          </div>
        </div>
      )}

      {/* Selesai but not yet graded */}
      {status === 2 && (
        <div className="flex items-center gap-2 mb-4 p-2.5 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-sm text-blue-600 dark:text-blue-400">
          <CheckCircle size={16} />
          <span>Menunggu penilaian</span>
        </div>
      )}

      {/* Action Button */}
      <button
        className={`
          w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
          text-sm font-semibold transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500
          ${status === 0
            ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'
            : status === 1
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm'
              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
          }
        `}
        onClick={(e) => { e.stopPropagation(); handleAction() }}
      >
        {getActionLabel()}
        <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  )
}

export default ExamCard
