import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, AlertCircle, ChevronLeft, ChevronRight, Flag, Send, BookOpen, User } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { ujianUserService } from '../services/ujianUserService'
import { ujianJawabanService } from '../../ujian-jawaban/services/ujianJawabanService'
import { listSoals } from '../../soal/services/soalService'
import { showSuccess, showError, showConfirm, showWarning } from '../../../utils/sweetalert'

const UjianUserMulai = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [ujianUser, setUjianUser] = useState(null)
  const [soalList, setSoalList] = useState([])
  const [currentSoalIndex, setCurrentSoalIndex] = useState(0)
  const [jawaban, setJawaban] = useState({})
  const [sisaWaktu, setSisaWaktu] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // Fetch ujian user data and soal
  useEffect(() => {
    fetchUjianUserData()
  }, [id])

  const fetchUjianUserData = async () => {
    setLoading(true)
    const { data, error } = await ujianUserService.getById(id)
    if (data) {
      const ujianUserData = data.data
      setUjianUser(ujianUserData)

      // Set sisa waktu from API or default to 3600 seconds (1 hour)
      const initialSisaWaktu = ujianUserData.sisa_waktu || 3600
      setSisaWaktu(initialSisaWaktu > 0 ? initialSisaWaktu : 3600)
      // Only run timer when status === 2 (STATUS_MENGERJAKAN)
      setIsTimerRunning(ujianUserData.status === 2)

      // Initialize jawaban from existing jawaban records
      if (ujianUserData.jawaban && ujianUserData.jawaban.length > 0) {
        const initialJawaban = {}
        ujianUserData.jawaban.forEach(j => {
          if (j.mst_soal_opsi_id) {
            initialJawaban[j.mst_soal_id] = j.mst_soal_opsi_id
          } else if (j.jawaban_teks) {
            initialJawaban[j.mst_soal_id] = j.jawaban_teks
          }
        })
        setJawaban(initialJawaban)
      }

      // Fetch soal by mapel_id from the ujian
      const mapelId = ujianUserData.ujian?.mst_mapel_id
      if (mapelId) {
        const { data: soalData } = await listSoals({ mapel_id: mapelId, per_page: 100 })
        if (soalData?.data && soalData.data.length > 0) {
          setSoalList(soalData.data)
        } else {
          showError('Tidak ada soal untuk ujian ini')
          navigate('/akademik/ujian-user')
        }
      } else {
        showError('Tidak dapat memuat soal: ujian tidak memiliki mata pelajaran')
        navigate('/akademik/ujian-user')
      }
    } else {
      showError('Gagal mengambil data ujian')
      navigate('/akademik/ujian-user')
    }
    setLoading(false)
  }

  // Timer countdown
  useEffect(() => {
    let interval
    if (isTimerRunning && sisaWaktu > 0) {
      interval = setInterval(() => {
        setSisaWaktu(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, sisaWaktu])

  const handleTimeUp = async () => {
    showWarning('Waktu ujian telah habis! Jawaban akan dikirim otomatis.', 'Waktu Habis')
    await handleSubmitUjian(true)
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColorClass = () => {
    if (sisaWaktu < 300) return 'text-red-600 animate-pulse' // Less than 5 minutes
    if (sisaWaktu < 600) return 'text-yellow-600' // Less than 10 minutes
    return 'text-green-600'
  }

  const handleJawabanChange = async (soalId, value) => {
    setJawaban(prev => ({
      ...prev,
      [soalId]: value
    }))

    // Save answer to backend (upsert — backend handles duplicate soal_id per ujian_user)
    const isEssay = typeof value === 'string' && isNaN(Number(value))
    const payload = {
      trx_ujian_user_id: parseInt(id),
      mst_soal_id: soalId,
      ...(isEssay ? { jawaban_teks: value } : { mst_soal_opsi_id: value }),
    }
    const { error } = await ujianJawabanService.create(payload)
    if (error) {
      console.error('Failed to save jawaban:', error)
    }
  }

  const handleNext = () => {
    if (currentSoalIndex < soalList.length - 1) {
      setCurrentSoalIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentSoalIndex > 0) {
      setCurrentSoalIndex(prev => prev - 1)
    }
  }

  const handleSoalClick = (index) => {
    setCurrentSoalIndex(index)
  }

  const handleSubmitUjian = async (isAutoSubmit = false) => {
    if (!isAutoSubmit) {
      const answeredCount = Object.keys(jawaban).length
      const unansweredCount = soalList.length - answeredCount
      
      let confirmMessage = `Anda telah menjawab ${answeredCount} dari ${soalList.length} soal.`
      if (unansweredCount > 0) {
        confirmMessage += `\n\nAda ${unansweredCount} soal yang belum dijawab.`
      }
      confirmMessage += `\n\nApakah Anda yakin ingin mengirim jawaban?`
      
      const result = await showConfirm(confirmMessage, 'Konfirmasi Pengiriman')
      if (!result.isConfirmed) return
    }

    setSubmitting(true)
    setIsTimerRunning(false)

    // Selesaikan ujian — backend calculates score from saved jawaban records
    const { data, error } = await ujianUserService.selesaikanUjian(id)
    
    if (!error) {
      showSuccess('Ujian berhasil diselesaikan!', 'Selesai')
      navigate(`/akademik/ujian-user/${id}`)
    } else {
      showError('Gagal menyelesaikan ujian. Silakan coba lagi.')
      setSubmitting(false)
      setIsTimerRunning(true)
    }
  }

  const getAnsweredCount = () => {
    return Object.keys(jawaban).length
  }

  const getUnansweredCount = () => {
    return soalList.length - getAnsweredCount()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!ujianUser || soalList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className="text-lg text-gray-700 dark:text-gray-300">Tidak dapat memuat data ujian</p>
        <Button variant="secondary" onClick={() => navigate('/akademik/ujian-user')} className="mt-4">
          Kembali
        </Button>
      </div>
    )
  }

  const currentSoal = soalList[currentSoalIndex]
  const progressPercentage = ((currentSoalIndex + 1) / soalList.length) * 100

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <BookOpen size={24} className="text-primary-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {ujianUser.ujian?.nama || 'Ujian'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <User size={14} />
                  {ujianUser.siswa?.nama || 'Siswa'}
                </p>
              </div>
            </div>
            
            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${getTimerColorClass()}`}>
              <Clock size={20} />
              <span className="font-mono font-bold text-lg">
                {formatTime(sisaWaktu)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1">
          <div 
            className="bg-primary-600 h-1 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Soal Navigation Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="sticky top-24">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Navigasi Soal
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {soalList.map((soal, index) => {
                    const isAnswered = jawaban[soal.id] !== undefined
                    const isCurrent = index === currentSoalIndex
                    
                    return (
                      <button
                        key={soal.id}
                        onClick={() => handleSoalClick(index)}
                        className={`
                          w-10 h-10 rounded-lg text-sm font-medium transition-colors
                          ${isCurrent 
                            ? 'bg-primary-600 text-white' 
                            : isAnswered
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-700'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }
                        `}
                      >
                        {index + 1}
                      </button>
                    )
                  })}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">Sudah dijawab ({getAnsweredCount()})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 bg-gray-100 dark:bg-gray-700 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">Belum dijawab ({getUnansweredCount()})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-4 h-4 bg-primary-600 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">Soal aktif</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Soal Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Card>
              <div className="p-6">
                {/* Soal Header */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Soal {currentSoalIndex + 1} dari {soalList.length}
                  </span>
                  {jawaban[currentSoal.id] && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <Flag size={14} />
                      Sudah dijawab
                    </span>
                  )}
                </div>

                {/* Soal Text */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    {currentSoal.pertanyaan}
                  </h3>
                  {currentSoal.media_path && (
                    <img src={currentSoal.media_path} alt="Media soal" className="max-w-full rounded-lg mb-4" />
                  )}
                </div>

                {/* Pilihan Jawaban */}
                <div className="space-y-3">
                  {currentSoal.tipe?.toLowerCase().includes('essay') ? (
                    <textarea
                      rows={5}
                      value={typeof jawaban[currentSoal.id] === 'string' ? jawaban[currentSoal.id] : ''}
                      onChange={(e) => handleJawabanChange(currentSoal.id, e.target.value)}
                      placeholder="Tulis jawaban Anda di sini..."
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none resize-vertical"
                    />
                  ) : (
                    currentSoal.opsi && currentSoal.opsi.map((opsi) => (
                      <label
                        key={opsi.id}
                        className={`
                          flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${jawaban[currentSoal.id] === opsi.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name={`soal-${currentSoal.id}`}
                          value={opsi.id}
                          checked={jawaban[currentSoal.id] === opsi.id}
                          onChange={() => handleJawabanChange(currentSoal.id, opsi.id)}
                          className="mt-1 w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {opsi.urutan}.
                          </span>
                          <span className="ml-2 text-gray-700 dark:text-gray-300">
                            {opsi.opsi_teks}
                          </span>
                        </div>
                      </label>
                    ))
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="secondary"
                    onClick={handlePrev}
                    disabled={currentSoalIndex === 0}
                  >
                    <ChevronLeft size={18} className="mr-2" />
                    Sebelumnya
                  </Button>
                  
                  {currentSoalIndex === soalList.length - 1 ? (
                    <Button
                      variant="primary"
                      onClick={() => handleSubmitUjian(false)}
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send size={18} className="mr-2" />
                      {submitting ? 'Mengirim...' : 'Kirim Jawaban'}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleNext}
                    >
                      Selanjutnya
                      <ChevronRight size={18} className="ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            {/* Submit Button (Mobile) */}
            <div className="mt-4 lg:hidden">
              <Button
                variant="primary"
                onClick={() => handleSubmitUjian(false)}
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Send size={18} className="mr-2" />
                {submitting ? 'Mengirim...' : 'Kirim Jawaban'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default UjianUserMulai