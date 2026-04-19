import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BookOpen, Clock, Calendar, User, Award, CheckCircle, XCircle, Play, MapPin } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { ujianUserService } from '../services/ujianUserService'
import { showConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_CONFIG = {
  0: {
    label: 'Belum Mulai',
    badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    iconBg: 'bg-gray-100 dark:bg-gray-700',
    iconColor: 'text-gray-600 dark:text-gray-400',
  },
  1: {
    label: 'Sedang Mengerjakan',
    badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  2: {
    label: 'Selesai',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  3: {
    label: 'Dinilai',
    badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '-'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours} jam ${minutes} menit`
  return `${minutes} menit`
}

const UjianUserSiswaDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [ujianUser, setUjianUser] = useState(null)

  useEffect(() => {
    fetchUjianUser()
  }, [id])

  const fetchUjianUser = async () => {
    setLoading(true)
    const { data, error } = await ujianUserService.getById(id)
    if (data) {
      setUjianUser(data.data)
    } else {
      showError('Gagal mengambil data ujian')
      navigate('/akademik/ujian-user')
    }
    setLoading(false)
  }

  const handleStart = async () => {
    const ujianName = ujianUser.ujian?.nama || `Ujian #${ujianUser.trx_ujian_id}`
    const result = await showConfirm(
      `Apakah Anda yakin ingin memulai ujian "${ujianName}"?\n\nPastikan Anda sudah siap mengerjakan ujian.`,
      'Konfirmasi Mulai Ujian'
    )
    if (result.isConfirmed) {
      const { error } = await ujianUserService.mulaiUjian(ujianUser.id)
      if (!error) {
        showSuccess('Ujian berhasil dimulai!')
        navigate(`/akademik/ujian-user/${ujianUser.id}/mulai`)
      } else {
        showError('Gagal memulai ujian')
      }
    }
  }

  const handleContinue = () => {
    navigate(`/akademik/ujian-user/${ujianUser.id}/mulai`)
  }

  if (loading || !ujianUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const status = ujianUser.status ?? 0
  const config = STATUS_CONFIG[status] || STATUS_CONFIG[0]
  const ujianName = ujianUser.ujian?.nama || `Ujian #${ujianUser.trx_ujian_id}`
  const mapelName = ujianUser.ujian?.mapel?.nama || '-'
  const kelasName = ujianUser.ujian?.kelas?.nama_kelas || '-'
  const canStart = status === 0
  const canContinue = status === 1
  const isCompleted = status === 2 || status === 3

  const nilaiAkhir = ujianUser.nilai_akhir
  const nilaiColorClass = nilaiAkhir !== null && nilaiAkhir !== undefined
    ? parseFloat(nilaiAkhir) >= 70
      ? 'text-green-600 dark:text-green-400'
      : parseFloat(nilaiAkhir) >= 60
        ? 'text-yellow-600 dark:text-yellow-400'
        : 'text-red-600 dark:text-red-400'
    : ''

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="secondary" onClick={() => navigate('/akademik/ujian-user')}>
        <ArrowLeft size={18} className="mr-2" />
        Kembali ke Daftar Ujian
      </Button>

      {/* Hero Card - Exam Info */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${status === 0 ? 'from-gray-50 to-white dark:from-gray-800 dark:to-gray-900' : status === 1 ? 'from-yellow-50 to-white dark:from-yellow-900/10 dark:to-gray-900' : status === 2 ? 'from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-900' : 'from-green-50 to-white dark:from-green-900/10 dark:to-gray-900'} border border-gray-200 dark:border-gray-700`}>
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              {/* Status Badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 ${config.badgeClass}`}>
                {config.label}
              </span>

              {/* Exam Name */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {ujianName}
              </h1>

              {/* Subject & Class */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <BookOpen size={16} className="shrink-0" />
                  {mapelName}
                </span>
                {kelasName !== '-' && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={16} className="shrink-0" />
                    {kelasName}
                  </span>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              {canStart && (
                <Button onClick={handleStart} className="bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/25">
                  <Play size={18} className="mr-2" />
                  Mulai Ujian
                </Button>
              )}
              {canContinue && (
                <Button onClick={handleContinue} className="bg-yellow-500 hover:bg-yellow-600 shadow-lg shadow-yellow-500/25">
                  <Play size={18} className="mr-2" />
                  Lanjutkan Ujian
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Card */}
        <Card>
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center shrink-0">
              <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Ujian</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {ujianUser.ujian?.tanggal ? formatDateTime(ujianUser.ujian.tanggal) : '-'}
              </p>
            </div>
          </div>
        </Card>

        {/* Duration Card */}
        <Card>
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center shrink-0">
              <Clock size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Sisa Waktu</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {canContinue ? `${formatDuration(ujianUser.sisa_waktu)} tersisa` : formatDuration(ujianUser.sisa_waktu)}
              </p>
            </div>
          </div>
        </Card>

        {/* Start Time Card */}
        <Card>
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center shrink-0">
              <Clock size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Waktu Mulai</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {formatDateTime(ujianUser.waktu_mulai)}
              </p>
            </div>
          </div>
        </Card>

        {/* End Time Card */}
        <Card>
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center shrink-0">
              <Clock size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Waktu Selesai</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {formatDateTime(ujianUser.waktu_selesai)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Results Section (only for completed/graded exams) */}
      {isCompleted && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Award size={20} className="text-yellow-600" />
              Hasil Ujian
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Score */}
              {status === 3 && nilaiAkhir !== null && nilaiAkhir !== undefined && (
                <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <Award size={32} className={`mx-auto mb-2 ${nilaiColorClass}`} />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nilai Akhir</p>
                  <p className={`text-5xl font-bold ${nilaiColorClass}`}>
                    {nilaiAkhir}
                  </p>
                </div>
              )}

              {/* Correct Answers */}
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Benar</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {ujianUser.total_benar ?? '-'}
                </p>
              </div>

              {/* Wrong Answers */}
              <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <XCircle size={32} className="mx-auto mb-2 text-red-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Salah</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {ujianUser.total_salah ?? '-'}
                </p>
              </div>
            </div>

            {/* Waiting for grading */}
            {status === 2 && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Ujian Anda sedang dalam proses penilaian. Hasil akan segera tersedia.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Student Info */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User size={20} className="text-primary-600" />
            Informasi Siswa
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center shrink-0">
                <User size={18} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nama Siswa</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {ujianUser.siswa?.nama || `Siswa #${ujianUser.mst_siswa_id}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">NIS</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">NIS</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {ujianUser.siswa?.nis || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Answers Section (if available) */}
      {ujianUser.jawaban && ujianUser.jawaban.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Daftar Jawaban
            </h3>
            <div className="space-y-2">
              {ujianUser.jawaban.map((jawaban, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Soal #{jawaban.soal_id || index + 1}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Jawaban: {jawaban.jawaban || '-'}
                      </p>
                    </div>
                  </div>
                  {jawaban.is_benar !== undefined && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      jawaban.is_benar
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {jawaban.is_benar ? 'Benar' : 'Salah'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {canStart && (
          <Button onClick={handleStart} className="flex-1 bg-primary-600 hover:bg-primary-700 shadow-sm">
            <Play size={18} className="mr-2" />
            Mulai Ujian
          </Button>
        )}
        {canContinue && (
          <Button onClick={handleContinue} className="flex-1 bg-yellow-500 hover:bg-yellow-600 shadow-sm">
            <Play size={18} className="mr-2" />
            Lanjutkan Ujian
          </Button>
        )}
        <Button variant="secondary" onClick={() => navigate('/akademik/ujian-user')} className="flex-1">
          Kembali ke Daftar Ujian
        </Button>
      </div>
    </div>
  )
}

export default UjianUserSiswaDetail