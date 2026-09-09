import { useCallback, useEffect, useState } from 'react'
import {
  LifeBuoy,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Clock,
  ArrowUpRight,
  X,
  Send,
  User,
  Check,
  Paperclip,
  FileText,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { ticketService } from '../services/ticketService'
import { showError, showSuccess } from '../../../utils/sweetalert'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'

const STATUS_CONFIG = {
  open: {
    label: 'Ditangani AI',
    color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    icon: Bot,
  },
  escalated: {
    label: 'Dialihkan ke Tim',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    icon: AlertTriangle,
  },
  resolved: {
    label: 'Selesai',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
}

const KATEGORI_OPTIONS = [
  { value: 'umum', label: 'Umum' },
  { value: 'teknis', label: 'Kendala Teknis / Akun' },
  { value: 'keuangan', label: 'Keuangan / SPP' },
  { value: 'akademik', label: 'Akademik / Nilai / Jadwal' },
]

export default function TicketListPage() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const [formData, setFormData] = useState({
    kategori: 'umum',
    judul: '',
    deskripsi: '',
  })
  const [evidenceFile, setEvidenceFile] = useState(null)
  const [evidencePreview, setEvidencePreview] = useState(null)

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (selected.size > maxSize) {
      showError('Ukuran file bukti melebihi batas 10MB')
      return
    }

    setEvidenceFile(selected)
    if (selected.type.startsWith('image/')) {
      const preview = URL.createObjectURL(selected)
      setEvidencePreview(preview)
    } else {
      setEvidencePreview(null)
    }
  }

  const handleRemoveFile = () => {
    if (evidencePreview) {
      URL.revokeObjectURL(evidencePreview)
    }
    setEvidenceFile(null)
    setEvidencePreview(null)
  }

  const resetForm = () => {
    setFormData({ kategori: 'umum', judul: '', deskripsi: '' })
    handleRemoveFile()
  }

  const loadTickets = useCallback(async (filter) => {
    setLoading(true)
    try {
      const params = {}
      if (filter && filter !== 'all') {
        params.status = filter
      }
      const res = await ticketService.getAll(params)
      setTickets(res.data ?? [])
    } catch {
      showError('Gagal memuat daftar tiket kendala')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets(statusFilter)
  }, [statusFilter, loadTickets])

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    if (!formData.judul.trim() || !formData.deskripsi.trim()) {
      showError('Judul dan deskripsi kendala wajib diisi')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        ...(evidenceFile ? { file: evidenceFile } : {}),
      }
      const res = await ticketService.create(payload)
      if (res.error) {
        showError(res.error?.message || 'Gagal membuat tiket kendala')
      } else {
        const created = res.data?.data
        showSuccess(
          created?.status === 'escalated'
            ? 'Tiket dibuat dan dialihkan ke tim penanganan.'
            : 'Tiket berhasil dibuat dan dianalisis oleh AI Agent.'
        )
        setIsModalOpen(false)
        resetForm()
        loadTickets(statusFilter)
      }
    } catch {
      showError('Terjadi kesalahan saat memproses tiket')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEscalate = async (id) => {
    setActionLoadingId(id)
    try {
      const res = await ticketService.escalate(id)
      if (res.error) {
        showError(res.error?.message || 'Gagal mengalihkan tiket ke tim')
      } else {
        showSuccess('Tiket berhasil dialihkan ke tim.')
        setTickets((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: 'escalated', escalated_at: new Date().toISOString() } : t))
        )
      }
    } catch {
      showError('Gagal mengalihkan tiket')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleResolve = async (id) => {
    setActionLoadingId(id)
    try {
      const res = await ticketService.resolve(id)
      if (res.error) {
        showError(res.error?.message || 'Gagal menyelesaikan tiket')
      } else {
        showSuccess('Tiket ditandai selesai.')
        setTickets((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: 'resolved', resolved_at: new Date().toISOString() } : t))
        )
      }
    } catch {
      showError('Gagal memperbarui status tiket')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <LifeBuoy className="w-7 h-7 text-primary-600" />
            Tiket Kendala & Bantuan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Laporkan kendala Anda. AI Agent kami mengevaluasi secara instan atau mengalihkan ke tim kami.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Buat Tiket Kendala
        </Button>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3 overflow-x-auto">
        {[
          { id: 'all', label: 'Semua Tiket' },
          { id: 'open', label: 'Ditangani AI' },
          { id: 'escalated', label: 'Dialihkan ke Tim' },
          { id: 'resolved', label: 'Selesai' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}

        <button
          onClick={() => loadTickets(statusFilter)}
          className="ml-auto p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Segarkan"
          aria-label="Segarkan"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-500" />
          Memuat tiket kendala...
        </div>
      ) : tickets.length === 0 ? (
        <Card className="text-center py-12">
          <LifeBuoy className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Belum ada tiket kendala.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Jika mengalami kesulitan, silakan klik tombol Buat Tiket Kendala.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open
            const StatusIcon = statusCfg.icon
            const isProcessing = actionLoadingId === ticket.id

            return (
              <Card key={ticket.id} className="border border-gray-200 dark:border-gray-800 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {ticket.nomor_tiket}
                      </span>
                      <span className="text-xs uppercase tracking-wider font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {ticket.kategori}
                      </span>
                      {ticket.user && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <User className="w-3 h-3" /> {ticket.user.name}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-1.5">{ticket.judul}</h2>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusCfg.color}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusCfg.label}
                  </span>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-3.5 rounded-lg border border-gray-100 dark:border-gray-800">
                  {ticket.deskripsi}
                </p>

                {ticket.file_url && (
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Bukti Kendala:</span>
                    <a
                      href={ticket.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors font-medium"
                    >
                      <Paperclip className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[220px]">{ticket.file_name || 'Lihat Bukti Evidence'}</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-70 shrink-0" />
                    </a>
                  </div>
                )}

                {ticket.solusi_ai && (
                  <div className="rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                      <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Rekomendasi AI Agent
                    </div>
                    <div className="text-sm text-indigo-950 dark:text-indigo-200 whitespace-pre-wrap leading-relaxed">
                      {ticket.solusi_ai}
                    </div>
                  </div>
                )}

                {ticket.status === 'escalated' && (
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Kendala ini telah diteruskan ke tim kami untuk penanganan langsung.
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {ticket.created_at ? new Date(ticket.created_at).toLocaleString('id-ID') : '-'}
                  </span>

                  <div className="flex items-center gap-2">
                    {ticket.status === 'open' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleEscalate(ticket.id)}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        AI Belum Membantu? Hubungi Tim
                      </Button>
                    )}

                    {ticket.status !== 'resolved' && (
                      <Button
                        variant="success"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleResolve(ticket.id)}
                        className="text-xs flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Masalah Selesai
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-primary-600" />
                Buat Tiket Kendala Baru
              </h3>
              <button
                onClick={() => !submitting && setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Kategori Kendala
                </label>
                <select
                  value={formData.kategori}
                  onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {KATEGORI_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Judul Kendala
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pembayaran SPP tidak terverifikasi otomatis"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Deskripsi Lengkap Kendala
                </label>
                <textarea
                  rows={4}
                  placeholder="Ceritakan detail kendala yang Anda alami..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  disabled={submitting}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Bukti Kendala / Evidence <span className="text-gray-400 font-normal">(Opsional)</span>
                </label>
                {!evidenceFile ? (
                  <label className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 rounded-lg p-3.5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50 dark:bg-gray-800/50 group">
                    <input
                      type="file"
                      data-testid="evidence-file-input"
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleFileChange}
                      disabled={submitting}
                    />
                    <Paperclip className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors mb-1" />
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium text-center">
                      Unggah screenshot atau dokumen bukti kendala
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">PNG, JPG, PDF, atau Dokumen (Maks. 10MB)</p>
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {evidencePreview ? (
                        <img
                          src={evidencePreview}
                          alt="Preview Evidence"
                          className="w-10 h-10 object-cover rounded border border-gray-200 dark:border-gray-700 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[240px]">
                          {evidenceFile.name}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {(evidenceFile.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      disabled={submitting}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Hapus file"
                      aria-label="Hapus file bukti"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={submitting}>
                  <Send className="w-4 h-4 mr-1.5" />
                  Kirim & Analisis AI
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
