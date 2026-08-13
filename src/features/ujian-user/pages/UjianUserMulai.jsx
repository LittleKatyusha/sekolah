import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, BookOpen, ChevronLeft, ChevronRight, Clock, Send, User } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { ujianUserService } from '../services/ujianUserService'
import { showConfirm, showError, showSuccess, showWarning } from '../../../utils/sweetalert'

const isEssay = (soal) => soal.tipe === 2 || soal.tipe === 'essay'
const hasAnswer = (answer) => Boolean(answer?.mst_soal_opsi_id || answer?.jawaban_teks?.trim())
const expired = (error) => error?.status === 409

const UjianUserMulai = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [finishing, setFinishing] = useState(false)
  const [ujianUser, setUjianUser] = useState(null)
  const [soalList, setSoalList] = useState([])
  const [answers, setAnswers] = useState({})
  const [pending, setPending] = useState({})
  const [index, setIndex] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [isExpired, setIsExpired] = useState(false)

  const endExpired = useCallback(() => {
    setIsExpired(true)
    showWarning('Waktu ujian telah habis. Jawaban tidak dapat diubah.', 'Waktu Habis')
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const session = await ujianUserService.getById(id)
    if (session.error || !session.data?.data) {
      showError(session.error?.message || 'Gagal mengambil sesi ujian')
      navigate('/akademik/ujian-user')
      return
    }
    const questions = await ujianUserService.getSoal(id)
    if (questions.error || !Array.isArray(questions.data?.data)) {
      showError(questions.error?.message || 'Soal ujian tidak tersedia. Hubungi pengawas.')
      setLoading(false)
      return
    }
    const list = questions.data.data
    setUjianUser(session.data.data)
    setSoalList(list)
    setAnswers(Object.fromEntries(list.map((soal) => [soal.id, soal.jawaban || {}])))
    setSeconds(session.data.data.sisa_waktu == null ? null : Math.max(0, session.data.data.sisa_waktu))
    setLoading(false)
  }, [id, navigate])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (loading || isExpired || seconds == null || seconds <= 0) return undefined
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [isExpired, loading, seconds])

  useEffect(() => {
    if (!loading && seconds === 0 && ujianUser && !isExpired) endExpired()
  }, [endExpired, isExpired, loading, seconds, ujianUser])

  const save = async (soal, value) => {
    if (isExpired || pending[soal.id]) return
    const previous = answers[soal.id] || {}
    const payload = isEssay(soal)
      ? { jawaban_teks: value, ragu_ragu: false }
      : { mst_soal_opsi_id: value, ragu_ragu: false }
    const request = previous.id
      ? ujianUserService.updateJawaban(previous.id, payload)
      : ujianUserService.simpanJawaban({ trx_ujian_user_id: Number(id), mst_soal_id: soal.id, ...payload })
    setPending((state) => ({ ...state, [soal.id]: true }))
    const { data, error } = await request
    setPending((state) => ({ ...state, [soal.id]: false }))
    if (expired(error)) return endExpired()
    if (error || !data?.data) return showError(error?.message || 'Jawaban gagal disimpan')
    setAnswers((state) => ({ ...state, [soal.id]: data.data }))
  }

  const finish = async (auto = false) => {
    if (finishing) return
    if (!auto) {
      const done = soalList.filter((soal) => hasAnswer(answers[soal.id])).length
      const result = await showConfirm(`Anda telah menjawab ${done} dari ${soalList.length} soal. Kirim jawaban?`, 'Selesaikan Ujian')
      if (!result.isConfirmed) return
    }
    setFinishing(true)
    const { error } = await ujianUserService.selesaikanUjian(id)
    if (error) {
      if (expired(error)) endExpired()
      else showError(error.message || 'Gagal menyelesaikan ujian')
      setFinishing(false)
      return
    }
    showSuccess('Ujian berhasil diselesaikan!', 'Selesai')
    navigate(`/akademik/ujian-user/${id}`)
  }

  const formatTime = (value) => value == null ? '--:--:--' : [Math.floor(value / 3600), Math.floor(value % 3600 / 60), value % 60].map((part) => String(part).padStart(2, '0')).join(':')
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" /></div>
  if (!ujianUser || !soalList.length) return <div className="flex h-screen flex-col items-center justify-center gap-4"><AlertCircle size={48} className="text-red-500" /><p>Soal ujian tidak tersedia.</p><Button variant="secondary" onClick={() => navigate('/akademik/ujian-user')}>Kembali</Button></div>

  const soal = soalList[index]
  const answer = answers[soal.id] || {}
  const answered = soalList.filter((item) => hasAnswer(answers[item.id])).length
  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm dark:bg-gray-800"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4"><div className="flex items-center gap-3"><BookOpen className="text-primary-600" /><div><h1 className="font-semibold">{ujianUser.ujian?.nama || 'Ujian'}</h1><p className="flex items-center gap-1 text-sm text-gray-500"><User size={14} />{ujianUser.siswa?.nama || 'Siswa'}</p></div></div><div className={`flex items-center gap-2 font-mono font-bold ${seconds != null && seconds < 300 ? 'text-red-600' : 'text-green-600'}`}><Clock size={20} />{formatTime(seconds)}</div></div></header>
    <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-4"><Card className="order-2 lg:order-1"><div className="p-4"><p className="mb-3 font-semibold">Soal ({answered}/{soalList.length})</p><div className="grid grid-cols-5 gap-2">{soalList.map((item, itemIndex) => <button key={item.id} type="button" onClick={() => setIndex(itemIndex)} className={`h-10 rounded ${itemIndex === index ? 'bg-primary-600 text-white' : hasAnswer(answers[item.id]) ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>{itemIndex + 1}</button>)}</div></div></Card>
      <Card className="order-1 lg:col-span-3"><div className="p-6"><div className="mb-6 flex justify-between text-sm text-gray-500"><span>Soal {index + 1} dari {soalList.length}</span>{pending[soal.id] && <span>Menyimpan...</span>}</div><h2 className="mb-8 text-lg font-medium whitespace-pre-wrap">{soal.pertanyaan}</h2>{isEssay(soal) ? <textarea aria-label="Jawaban essay" defaultValue={answer.jawaban_teks || ''} disabled={isExpired || pending[soal.id]} onBlur={(event) => save(soal, event.target.value)} className="min-h-40 w-full rounded border p-3" placeholder="Tulis jawaban Anda" /> : <div className="space-y-3">{soal.opsi.map((opsi) => <label key={opsi.id} className={`flex cursor-pointer gap-3 rounded border-2 p-4 ${answer.mst_soal_opsi_id === opsi.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}><input type="radio" name={`soal-${soal.id}`} checked={answer.mst_soal_opsi_id === opsi.id} disabled={isExpired || pending[soal.id]} onChange={() => save(soal, opsi.id)} /><span>{opsi.teks_opsi}</span></label>)}</div>}<div className="mt-8 flex justify-between border-t pt-6"><Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}><ChevronLeft size={18} />Sebelumnya</Button>{index === soalList.length - 1 ? <Button disabled={finishing} onClick={() => finish(false)}><Send size={18} />{finishing ? 'Mengirim...' : 'Kirim Jawaban'}</Button> : <Button onClick={() => setIndex(index + 1)}>Selanjutnya<ChevronRight size={18} /></Button>}</div></div></Card></main>
  </div>
}

export default UjianUserMulai
