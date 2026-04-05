import { useCallback, useEffect, useMemo, useState } from 'react'
import { MessageCircle, QrCode, RefreshCw, Send, ShieldAlert, Smartphone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import Input from '../../../components/ui/Input'
import { showError, showSuccess } from '../../../utils/sweetalert'
import { wahaService } from '../services/wahaService'

const SESSION_ROUTE = '/waha/session'
const SEND_ROUTE = '/waha/send'

const createInitialMessageForm = () => ({
  phone: '',
  text: '',
})

const createInitialSppForm = () => ({
  phone: '',
  nama_siswa: '',
  bulan: '',
  jumlah: '',
  status: 'tagihan',
})

const createInitialPpdbForm = () => ({
  phone: '',
  nama_peserta: '',
  status: 'verifikasi',
  catatan: '',
})

const createInitialEwsForm = () => ({
  phone: '',
  nama_siswa: '',
  jenis_alert: 'absensi',
  deskripsi: '',
  level: 'sedang',
})

const getStatusBadgeClass = (status) => {
  const normalizedStatus = String(status || '').toUpperCase()

  if (['WORKING', 'CONNECTED', 'STARTING', 'SCAN_QR_CODE'].includes(normalizedStatus)) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  }

  if (['FAILED', 'STOPPED', 'DISCONNECTED'].includes(normalizedStatus)) {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  }

  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
}

const prettifyLabel = (value) => String(value || '-')
  .replace(/_/g, ' ')
  .replace(/\b\w/g, (char) => char.toUpperCase())

const extractSessionSummary = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return {
      sessionName: '-',
      status: 'UNKNOWN',
      engine: '-',
      me: '-',
    }
  }

  const sessionName = payload.name || payload.session || payload.sessionName || '-'
  const status = payload.status || payload.state || payload.sessionStatus || 'UNKNOWN'
  const engine = payload.engine || payload.type || payload.mode || '-'
  const me = payload.me?.id || payload.me?.pushName || payload.phone || payload.user || '-'

  return { sessionName, status, engine, me }
}

const extractQrImage = (payload) => {
  if (!payload) return ''

  if (typeof payload === 'string') {
    if (payload.startsWith('data:image/')) return payload
    if (payload.startsWith('http://') || payload.startsWith('https://')) return payload
    return `data:image/png;base64,${payload}`
  }

  const candidate = payload.qr || payload.value || payload.data || payload.base64 || payload.qrCode || payload.qr_code || ''

  if (typeof candidate !== 'string' || !candidate.trim()) return ''
  if (candidate.startsWith('data:image/')) return candidate
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) return candidate

  return `data:image/png;base64,${candidate}`
}

const JsonPreview = ({ value }) => (
  <pre className="max-h-72 overflow-auto rounded-xl bg-slate-950 px-4 py-3 text-xs text-slate-100">
    {JSON.stringify(value, null, 2)}
  </pre>
)

const TextareaField = ({ label, value, onChange, placeholder, rows = 4 }) => (
  <div className="w-full">
    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <textarea
      rows={rows}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="input-field min-h-[112px] resize-y"
    />
  </div>
)

const SelectField = ({ label, value, onChange, options }) => (
  <div className="w-full">
    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <select value={value} onChange={onChange} className="input-field">
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
)

const WahaDashboard = ({ defaultTab = 'session' }) => {
  const navigate = useNavigate()
  const [sessionPayload, setSessionPayload] = useState(null)
  const [qrPayload, setQrPayload] = useState(null)
  const [lastResponse, setLastResponse] = useState(null)
  const [messageForm, setMessageForm] = useState(createInitialMessageForm)
  const [sppForm, setSppForm] = useState(createInitialSppForm)
  const [ppdbForm, setPpdbForm] = useState(createInitialPpdbForm)
  const [ewsForm, setEwsForm] = useState(createInitialEwsForm)
  const [loadingStates, setLoadingStates] = useState({
    session: false,
    qr: false,
    start: false,
    send: false,
    spp: false,
    ppdb: false,
    ews: false,
  })

  const activeTab = defaultTab === 'send' ? 'send' : 'session'
  const sessionSummary = useMemo(() => extractSessionSummary(sessionPayload), [sessionPayload])
  const qrImage = useMemo(() => extractQrImage(qrPayload), [qrPayload])

  const setLoading = (key, value) => {
    setLoadingStates((prev) => ({ ...prev, [key]: value }))
  }

  const handleApiAction = useCallback(async ({ key, request, successMessage, onSuccess }) => {
    setLoading(key, true)

    try {
      const response = await request()

      if (response.error) {
        throw new Error(response.error?.message || 'Permintaan gagal diproses')
      }

      setLastResponse(response.payload)
      if (typeof onSuccess === 'function') onSuccess(response.payload)
      if (successMessage) {
        showSuccess(successMessage)
      }
      return response.payload
    } catch (error) {
      showError(error.message || 'Terjadi kesalahan saat memproses permintaan')
      return null
    } finally {
      setLoading(key, false)
    }
  }, [])

  const loadSessionStatus = useCallback(async ({ notify = false } = {}) => {
    return handleApiAction({
      key: 'session',
      request: () => wahaService.getSessionStatus(),
      successMessage: notify ? 'Status sesi WAHA berhasil diperbarui.' : '',
      onSuccess: (payload) => setSessionPayload(payload),
    })
  }, [handleApiAction])

  const loadQrCode = useCallback(async ({ notify = false } = {}) => {
    return handleApiAction({
      key: 'qr',
      request: () => wahaService.getQrCode(),
      successMessage: notify ? 'QR code WAHA berhasil dimuat.' : '',
      onSuccess: (payload) => setQrPayload(payload),
    })
  }, [handleApiAction])

  useEffect(() => {
    loadSessionStatus()
    loadQrCode()
  }, [loadQrCode, loadSessionStatus])

  const handleStartSession = async () => {
    const started = await handleApiAction({
      key: 'start',
      request: () => wahaService.startSession(),
      successMessage: 'Sesi WAHA berhasil dimulai ulang.',
    })

    if (started) {
      await loadSessionStatus()
      await loadQrCode()
    }
  }

  const handleTabChange = (tab) => {
    navigate(tab === 'send' ? SEND_ROUTE : SESSION_ROUTE)
  }

  const handleSendMessage = async (event) => {
    event.preventDefault()

    const payload = await handleApiAction({
      key: 'send',
      request: () => wahaService.sendMessage(messageForm),
      successMessage: 'Pesan WhatsApp berhasil dikirim.',
    })

    if (payload) {
      setMessageForm(createInitialMessageForm())
    }
  }

  const handleNotifySpp = async (event) => {
    event.preventDefault()
    const payload = await handleApiAction({
      key: 'spp',
      request: () => wahaService.notifySpp({
        ...sppForm,
        jumlah: Number(sppForm.jumlah || 0),
      }),
      successMessage: 'Notifikasi SPP berhasil dikirim.',
    })

    if (payload) {
      setSppForm(createInitialSppForm())
    }
  }

  const handleNotifyPpdb = async (event) => {
    event.preventDefault()
    const payload = await handleApiAction({
      key: 'ppdb',
      request: () => wahaService.notifyPpdb(ppdbForm),
      successMessage: 'Notifikasi PPDB berhasil dikirim.',
    })

    if (payload) {
      setPpdbForm(createInitialPpdbForm())
    }
  }

  const handleNotifyEws = async (event) => {
    event.preventDefault()
    const payload = await handleApiAction({
      key: 'ews',
      request: () => wahaService.notifyEws(ewsForm),
      successMessage: 'Notifikasi EWS berhasil dikirim.',
    })

    if (payload) {
      setEwsForm(createInitialEwsForm())
    }
  }

  const summaryItems = [
    { label: 'Session', value: sessionSummary.sessionName },
    { label: 'Status', value: sessionSummary.status },
    { label: 'Engine', value: sessionSummary.engine },
    { label: 'Identitas', value: sessionSummary.me },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
            <MessageCircle size={16} />
            WhatsApp Gateway via WAHA
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modul WhatsApp</h1>
            <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
              Kelola status sesi WAHA, QR autentikasi, kirim pesan manual, dan notifikasi SPP, PPDB, serta EWS dari satu halaman.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant={activeTab === 'session' ? 'primary' : 'secondary'} onClick={() => handleTabChange('session')}>
            <Smartphone size={18} className="mr-2" />
            Status Sesi & QR
          </Button>
          <Button variant={activeTab === 'send' ? 'primary' : 'secondary'} onClick={() => handleTabChange('send')}>
            <Send size={18} className="mr-2" />
            Kirim Pesan & Notifikasi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <Card key={item.label} className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">{item.label}</p>
            {item.label === 'Status' ? (
              <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(item.value)}`}>
                {prettifyLabel(item.value)}
              </div>
            ) : (
              <p className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">{item.value || '-'}</p>
            )}
          </Card>
        ))}
      </div>

      {activeTab === 'session' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card
            title="Status Sesi WAHA"
            actions={(
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => loadSessionStatus({ notify: true })} loading={loadingStates.session}>
                  <RefreshCw size={18} className="mr-2" />
                  Refresh Status
                </Button>
                <PermissionGuard permission="waha.send">
                  <Button onClick={handleStartSession} loading={loadingStates.start}>
                    <Smartphone size={18} className="mr-2" />
                    Start Session
                  </Button>
                </PermissionGuard>
              </div>
            )}
          >
            <div className="space-y-4">
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Endpoint backend: <span className="font-semibold text-gray-900 dark:text-white">GET /api/v1/whatsapp/session</span> dan <span className="font-semibold text-gray-900 dark:text-white">POST /api/v1/whatsapp/session/start</span>.
                </p>
              </div>
              <JsonPreview value={sessionPayload} />
            </div>
          </Card>

          <Card
            title="QR Autentikasi"
            actions={(
              <Button variant="secondary" onClick={() => loadQrCode({ notify: true })} loading={loadingStates.qr}>
                <QrCode size={18} className="mr-2" />
                Refresh QR
              </Button>
            )}
          >
            <div className="space-y-4">
              <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
                {qrImage ? (
                  <img src={qrImage} alt="WAHA QR Code" className="max-h-72 w-full max-w-xs rounded-xl bg-white p-3 shadow-sm" />
                ) : (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    <QrCode className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                    QR code belum tersedia. Jalankan refresh atau start session.
                  </div>
                )}
              </div>
              <JsonPreview value={qrPayload} />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'send' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.95fr]">
            <Card title="Kirim Pesan WhatsApp">
              <form className="space-y-4" onSubmit={handleSendMessage}>
                <Input
                  label="Nomor Telepon"
                  placeholder="08xxxxxxxxxx"
                  value={messageForm.phone}
                  onChange={(event) => setMessageForm((prev) => ({ ...prev, phone: event.target.value }))}
                />
                <TextareaField
                  label="Isi Pesan"
                  placeholder="Tulis pesan yang akan dikirim ke WhatsApp"
                  value={messageForm.text}
                  onChange={(event) => setMessageForm((prev) => ({ ...prev, text: event.target.value }))}
                />
                <div className="flex justify-end">
                  <PermissionGuard permission="waha.send">
                    <Button type="submit" loading={loadingStates.send}>
                      <Send size={18} className="mr-2" />
                      Kirim Pesan
                    </Button>
                  </PermissionGuard>
                </div>
              </form>
            </Card>

            <Card title="Response Terakhir">
              <div className="space-y-4">
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
                  Semua aksi pada tab ini menggunakan endpoint backend WhatsApp yang diproteksi permission: <span className="font-semibold">waha.send, waha.notify.spp, waha.notify.ppdb, waha.notify.ews</span>.
                </div>
                <JsonPreview value={lastResponse} />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3">
            <Card title="Notifikasi SPP">
              <form className="space-y-4" onSubmit={handleNotifySpp}>
                <Input label="Nomor Telepon" placeholder="08xxxxxxxxxx" value={sppForm.phone} onChange={(event) => setSppForm((prev) => ({ ...prev, phone: event.target.value }))} />
                <Input label="Nama Siswa" placeholder="Nama siswa" value={sppForm.nama_siswa} onChange={(event) => setSppForm((prev) => ({ ...prev, nama_siswa: event.target.value }))} />
                <Input label="Bulan" placeholder="Februari 2026" value={sppForm.bulan} onChange={(event) => setSppForm((prev) => ({ ...prev, bulan: event.target.value }))} />
                <Input label="Jumlah" type="number" min="0" placeholder="500000" value={sppForm.jumlah} onChange={(event) => setSppForm((prev) => ({ ...prev, jumlah: event.target.value }))} />
                <SelectField
                  label="Status"
                  value={sppForm.status}
                  onChange={(event) => setSppForm((prev) => ({ ...prev, status: event.target.value }))}
                  options={[
                    { value: 'tagihan', label: 'Tagihan' },
                    { value: 'lunas', label: 'Lunas' },
                  ]}
                />
                <div className="flex justify-end">
                  <PermissionGuard permission="waha.notify.spp">
                    <Button type="submit" loading={loadingStates.spp}>
                      <Send size={18} className="mr-2" />
                      Kirim SPP
                    </Button>
                  </PermissionGuard>
                </div>
              </form>
            </Card>

            <Card title="Notifikasi PPDB">
              <form className="space-y-4" onSubmit={handleNotifyPpdb}>
                <Input label="Nomor Telepon" placeholder="08xxxxxxxxxx" value={ppdbForm.phone} onChange={(event) => setPpdbForm((prev) => ({ ...prev, phone: event.target.value }))} />
                <Input label="Nama Peserta" placeholder="Nama peserta" value={ppdbForm.nama_peserta} onChange={(event) => setPpdbForm((prev) => ({ ...prev, nama_peserta: event.target.value }))} />
                <SelectField
                  label="Status"
                  value={ppdbForm.status}
                  onChange={(event) => setPpdbForm((prev) => ({ ...prev, status: event.target.value }))}
                  options={[
                    { value: 'verifikasi', label: 'Verifikasi' },
                    { value: 'menunggu', label: 'Menunggu' },
                    { value: 'diterima', label: 'Diterima' },
                    { value: 'ditolak', label: 'Ditolak' },
                  ]}
                />
                <TextareaField label="Catatan" placeholder="Opsional" value={ppdbForm.catatan} onChange={(event) => setPpdbForm((prev) => ({ ...prev, catatan: event.target.value }))} rows={5} />
                <div className="flex justify-end">
                  <PermissionGuard permission="waha.notify.ppdb">
                    <Button type="submit" loading={loadingStates.ppdb}>
                      <Send size={18} className="mr-2" />
                      Kirim PPDB
                    </Button>
                  </PermissionGuard>
                </div>
              </form>
            </Card>

            <Card title="Notifikasi EWS">
              <form className="space-y-4" onSubmit={handleNotifyEws}>
                <Input label="Nomor Telepon" placeholder="08xxxxxxxxxx" value={ewsForm.phone} onChange={(event) => setEwsForm((prev) => ({ ...prev, phone: event.target.value }))} />
                <Input label="Nama Siswa" placeholder="Nama siswa" value={ewsForm.nama_siswa} onChange={(event) => setEwsForm((prev) => ({ ...prev, nama_siswa: event.target.value }))} />
                <SelectField
                  label="Jenis Alert"
                  value={ewsForm.jenis_alert}
                  onChange={(event) => setEwsForm((prev) => ({ ...prev, jenis_alert: event.target.value }))}
                  options={[
                    { value: 'absensi', label: 'Absensi' },
                    { value: 'nilai', label: 'Nilai' },
                    { value: 'perilaku', label: 'Perilaku' },
                  ]}
                />
                <SelectField
                  label="Level"
                  value={ewsForm.level}
                  onChange={(event) => setEwsForm((prev) => ({ ...prev, level: event.target.value }))}
                  options={[
                    { value: 'rendah', label: 'Rendah' },
                    { value: 'sedang', label: 'Sedang' },
                    { value: 'tinggi', label: 'Tinggi' },
                  ]}
                />
                <TextareaField label="Deskripsi" placeholder="Jelaskan alert EWS yang ingin dikirim" value={ewsForm.deskripsi} onChange={(event) => setEwsForm((prev) => ({ ...prev, deskripsi: event.target.value }))} rows={5} />
                <div className="flex justify-end">
                  <PermissionGuard permission="waha.notify.ews">
                    <Button type="submit" loading={loadingStates.ews}>
                      <ShieldAlert size={18} className="mr-2" />
                      Kirim EWS
                    </Button>
                  </PermissionGuard>
                </div>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

export default WahaDashboard