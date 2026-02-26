import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2, User, BookOpen, Clock, CheckCircle, XCircle, Award, Calendar, Play } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { ujianUserService } from '../services/ujianUserService'
import { showDeleteConfirm, showSuccess, showError, showConfirm } from '../../../utils/sweetalert'

const UjianUserDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
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
      showError('Gagal mengambil data ujian user')
      navigate('/akademik/ujian-user')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const siswaName = ujianUser.siswa?.nama || 'Siswa'
    const ujianName = ujianUser.ujian?.nama || `Ujian #${ujianUser.trx_ujian_id}`
    const result = await showDeleteConfirm(`${siswaName} - ${ujianName}`)
    if (result.isConfirmed) {
      const { error } = await ujianUserService.delete(ujianUser.id)
      if (!error) {
        showSuccess(`Ujian user berhasil dihapus!`)
        navigate('/akademik/ujian-user')
      } else {
        showError('Gagal menghapus ujian user')
      }
    }
  }

  const handleMulai = async () => {
    const siswaName = ujianUser.siswa?.nama || 'Siswa'
    const ujianName = ujianUser.ujian?.nama || `Ujian #${ujianUser.trx_ujian_id}`
    const result = await showConfirm(
      `Apakah Anda yakin ingin memulai ujian ${ujianName} untuk ${siswaName}?`,
      'Konfirmasi Mulai Ujian'
    )
    if (result.isConfirmed) {
      const { data, error } = await ujianUserService.mulaiUjian(ujianUser.id)
      if (!error) {
        showSuccess('Ujian berhasil dimulai!')
        navigate(`/akademik/ujian-user/${ujianUser.id}/mulai`)
      } else {
        showError('Gagal memulai ujian')
      }
    }
  }

  const getStatusLabel = (value) => {
    if (value === null || value === undefined) return 'Belum Mulai'
    const statusMap = {
      0: 'Belum Mulai',
      1: 'Sedang Mengerjakan',
      2: 'Selesai',
      3: 'Dinilai',
    }
    return statusMap[value] || `Status ${value}`
  }

  const getStatusColorClass = (value) => {
    const colorMap = {
      0: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      1: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      3: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    }
    return colorMap[value] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '-'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}j ${minutes}m ${secs}d`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}d`
    } else {
      return `${secs}d`
    }
  }

  if (loading || !ujianUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const canStart = ujianUser.status === 0 || ujianUser.status === null
  const isCompleted = ujianUser.status === 2 || ujianUser.status === 3

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/akademik/ujian-user')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Ujian User</h1>
        </div>
        <div className="flex gap-3">
          {canStart && (
            <Button variant="success" onClick={handleMulai}>
              <Play size={18} className="mr-2" />
              Mulai Ujian
            </Button>
          )}
          <Button variant="warning" onClick={() => navigate(`/akademik/ujian-user/${id}/edit`)}>
            <Edit size={18} className="mr-2" />
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={18} className="mr-2" />
            Hapus
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-6 text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-4 ${getStatusColorClass(ujianUser.status)}`}>
                {getStatusLabel(ujianUser.status)}
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {ujianUser.ujian?.nama || `Ujian #${ujianUser.trx_ujian_id}`}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {ujianUser.siswa?.nama || 'Unknown Siswa'}
              </p>

              {isCompleted && ujianUser.nilai_akhir !== null && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Nilai Akhir</p>
                  <p className={`text-4xl font-bold ${
                    parseFloat(ujianUser.nilai_akhir) >= 70 ? 'text-green-600' : 
                    parseFloat(ujianUser.nilai_akhir) >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {ujianUser.nilai_akhir}
                  </p>
                </div>
              )}

              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <span className="font-medium text-gray-900 dark:text-white">#{ujianUser.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Sisa Waktu</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDuration(ujianUser.sisa_waktu)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Detail Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ujian Info */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <BookOpen size={20} className="text-blue-600" />
                Informasi Ujian
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama Ujian</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ujianUser.ujian?.nama || `Ujian #${ujianUser.trx_ujian_id}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Ujian</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ujianUser.ujian?.tanggal ? formatDateTime(ujianUser.ujian.tanggal).split(',')[0] : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 font-bold text-sm">M</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Mata Pelajaran</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ujianUser.ujian?.mapel?.nama || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-bold text-sm">K</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kelas</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ujianUser.ujian?.kelas?.nama_kelas || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Siswa Info */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <User size={20} className="text-green-600" />
                Informasi Siswa
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama Siswa</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ujianUser.siswa?.nama || `Siswa #${ujianUser.mst_siswa_id}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-xs">NIS</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">NIS</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ujianUser.siswa?.nis || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold text-xs">NISN</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">NISN</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ujianUser.siswa?.nisn || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-bold text-sm">K</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Kelas</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ujianUser.siswa?.kelas?.nama_kelas || '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Waktu & Hasil */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Clock size={20} className="text-orange-600" />
                Waktu & Hasil
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Waktu Mulai</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDateTime(ujianUser.waktu_mulai)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock size={20} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Waktu Selesai</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDateTime(ujianUser.waktu_selesai)}
                    </p>
                  </div>
                </div>

                {isCompleted && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={20} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Benar</p>
                        <p className="font-medium text-green-600">
                          {ujianUser.total_benar ?? '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <XCircle size={20} className="text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Salah</p>
                        <p className="font-medium text-red-600">
                          {ujianUser.total_salah ?? '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 md:col-span-2">
                      <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Award size={20} className="text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Nilai Akhir</p>
                        <p className={`font-bold text-2xl ${
                          parseFloat(ujianUser.nilai_akhir) >= 70 ? 'text-green-600' : 
                          parseFloat(ujianUser.nilai_akhir) >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {ujianUser.nilai_akhir ?? '-'}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Jawaban Section */}
          {ujianUser.jawaban && ujianUser.jawaban.length > 0 && (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Daftar Jawaban
                </h3>
                <div className="space-y-3">
                  {ujianUser.jawaban.map((jawaban, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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

          {/* Timestamps */}
          <Card>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Dibuat pada</p>
                  <p className="text-gray-700 dark:text-gray-300">{formatDateTime(ujianUser.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Terakhir diperbarui</p>
                  <p className="text-gray-700 dark:text-gray-300">{formatDateTime(ujianUser.updated_at)}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default UjianUserDetail