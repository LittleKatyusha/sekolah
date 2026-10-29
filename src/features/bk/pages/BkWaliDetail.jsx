import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Edit, Trash2, Calendar, Briefcase, Users, Phone, Shield,
  Printer, Send, Clock, FileText, CheckCircle2, X, GraduationCap
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { bkWaliService } from '../services/bkService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { formatDateTime } from '../../../utils/formatters'
import { getPeranBadge, getStatusBadge } from '../../../utils/bkBadges.jsx'

const BkWaliDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [bkWali, setBkWali] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [sendingWa, setSendingWa] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [scheduleData, setScheduleData] = useState({
    tanggal: '',
    jam: '09:00',
    ruangan: 'Ruang Bimbingan & Konseling (BK)',
    keperluan: '',
    nomor_surat: '',
  })

  useEffect(() => {
    const controller = new AbortController()
    const fetchWali = async () => {
      setLoading(true)
      const { data, error } = await bkWaliService.getById(id)
      if (controller.signal.aborted) return
      if (data?.data) {
        setBkWali(data.data)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const defaultDateStr = tomorrow.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
        setScheduleData(prev => ({
          ...prev,
          tanggal: prev.tanggal || defaultDateStr,
          keperluan: prev.keperluan || data.data.kasus?.judul_kasus || 'Pembinaan & Konseling Siswa',
          nomor_surat: prev.nomor_surat || `421.7/${String(data.data.id).padStart(3, '0')}/BK/${new Date().getFullYear()}`,
        }))
      } else {
        showError('Gagal mengambil data wali')
        navigate('/bk/wali')
      }
      setLoading(false)
    }
    fetchWali()
    return () => controller.abort()
  }, [id, navigate])

  const handleDelete = async () => {
    const result = await showDeleteConfirm('data wali ini')
    if (result.isConfirmed) {
      const { error } = await bkWaliService.delete(bkWali.id)
      if (!error) {
        showSuccess('Wali berhasil dihapus!')
        navigate('/bk/wali')
      } else {
        showError('Gagal menghapus wali')
      }
    }
  }

  const handleSendWa = async () => {
    setSendingWa(true)
    const { data, error } = await bkWaliService.notifyWhatsApp(id, scheduleData)
    if (!error && data?.data) {
      showSuccess(`Undangan panggilan WhatsApp berhasil dikirim ke ${data.data.phone}!`)
      setModalOpen(false)
    } else {
      showError(error?.response?.data?.message || 'Gagal mengirim pesan WhatsApp')
    }
    setSendingWa(false)
  }

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true)
    try {
      const response = await bkWaliService.downloadSuratPanggilan(id, scheduleData)
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      const nis = bkWali.kasus?.siswa?.nis || bkWali.id
      link.setAttribute('download', `Surat-Panggilan-BK-${nis}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(objectUrl)
      showSuccess('Surat panggilan PDF berhasil diunduh!')
    } catch (err) {
      console.error(err)
      showError('Gagal mengunduh surat panggilan PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (loading || !bkWali) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const siswa = bkWali.kasus?.siswa
  const kasus = bkWali.kasus
  const wali = bkWali.wali_murid

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/bk/wali')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panggilan Wali Murid BK</h1>
            <p className="text-sm text-gray-500">Detail keterlibatan orang tua / wali dalam bimbingan konseling</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PermissionGuard permission="bk-wali.manage">
            <Button
              variant="success"
              onClick={() => setModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Send size={16} className="mr-2" />
              Kirim Undangan WA
            </Button>
          </PermissionGuard>
          <Button
            variant="secondary"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
          >
            <Printer size={16} className="mr-2" />
            {downloadingPdf ? 'Mengunduh...' : 'Cetak Surat PDF'}
          </Button>
          <PermissionGuard permission="bk-wali.manage">
            <Button variant="warning" onClick={() => navigate(`/bk/wali/${id}/edit`)}>
              <Edit size={16} className="mr-1" />
              Edit
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="bk-wali.manage">
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 size={16} className="mr-1" />
              Hapus
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Wali Card */}
        <Card className="lg:col-span-1">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">Data Wali Murid</h3>
              {getPeranBadge(bkWali.peran_code || bkWali.peran)}
            </div>

            <div>
              <p className="text-xs text-gray-500">Nama Wali</p>
              <p className="font-semibold text-gray-900 dark:text-white text-base">{wali?.nama || '-'}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">No. WhatsApp / Telepon</p>
              <p className="font-medium text-emerald-600 dark:text-emerald-400">{wali?.notelp || 'Belum ada nomor'}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500">Alamat</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{wali?.alamat || '-'}</p>
            </div>

            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full justify-center"
                onClick={() => setModalOpen(true)}
              >
                <Clock size={15} className="mr-2 text-primary-600" />
                Atur Jadwal Pertemuan
              </Button>
            </div>
          </div>
        </Card>

        {/* Info Siswa & Kasus */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <GraduationCap size={18} className="text-primary-600" />
                Data Siswa Terkait
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Nama Siswa</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{siswa?.nama || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">NIS</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{siswa?.nis || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Kelas</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{siswa?.kelas || '-'}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Briefcase size={18} className="text-blue-600" />
                  Kasus Bimbingan Konseling #{bkWali.trx_bk_kasus_id}
                </h3>
                {kasus?.status && getStatusBadge(kasus.status)}
              </div>

              <div>
                <p className="text-xs text-gray-500">Judul Kasus</p>
                <p className="font-medium text-gray-900 dark:text-white text-base">{kasus?.judul_kasus || '-'}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Deskripsi Masalah</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                  {kasus?.deskripsi_masalah || 'Tidak ada deskripsi tercatat.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-xs text-gray-500">Guru Pembimbing BK</p>
                  <p className="font-medium text-gray-900 dark:text-white">{kasus?.guru?.nama || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Dicatat Pada</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{formatDateTime(bkWali.created_at)}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      {/* Modal Undangan / Panggilan Wali */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-emerald-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Kirim Panggilan Wali Murid</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  Panggilan akan dikirim ke WhatsApp <strong>{wali?.nama}</strong> ({wali?.notelp || 'nomor tidak terdaftar'}).
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Hari & Tanggal Pertemuan
                </label>
                <input
                  type="text"
                  value={scheduleData.tanggal}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, tanggal: e.target.value }))}
                  placeholder="Contoh: Senin, 02 November 2026"
                  className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Waktu / Pukul
                  </label>
                  <input
                    type="text"
                    value={scheduleData.jam}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, jam: e.target.value }))}
                    placeholder="09:00"
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Ruangan / Tempat
                  </label>
                  <input
                    type="text"
                    value={scheduleData.ruangan}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, ruangan: e.target.value }))}
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Keperluan / Agenda Pembahasan
                </label>
                <textarea
                  rows={2}
                  value={scheduleData.keperluan}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, keperluan: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nomor Surat Resmi (untuk Cetak PDF)
                </label>
                <input
                  type="text"
                  value={scheduleData.nomor_surat}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, nomor_surat: e.target.value }))}
                  className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button
                variant="success"
                onClick={handleSendWa}
                disabled={sendingWa || !wali?.notelp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Send size={15} className="mr-2" />
                {sendingWa ? 'Mengirim...' : 'Kirim WhatsApp'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BkWaliDetail
