import { useState, useEffect, useRef } from 'react'
import { Mail, Send, Sparkles, School, Paperclip, X, FileText, Inbox, Trash2, RefreshCw } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import LexicalEditor from '../../../components/ui/LexicalEditor'
import '../../../components/ui/LexicalEditor.css'
import { showError, showSuccess, showDeleteConfirm } from '../../../utils/sweetalert'
import { emailService } from '../services/emailService'

export default function MarketingEmailPage() {
  const [tab, setTab] = useState('inbox')
  const [inboxList, setInboxList] = useState([])
  const [selectedInbox, setSelectedInbox] = useState(null)
  const [inboxLoading, setInboxLoading] = useState(false)
  const [searchInbox, setSearchInbox] = useState('')

  const [offer, setOffer] = useState({ email: '', school_name: '', cta_url: 'https://akademihub.id/#demo' })
  const [custom, setCustom] = useState({ email: '', subject: '', content: '' })
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const fetchInbox = async () => {
    setInboxLoading(true)
    try {
      const res = await emailService.getInbox({ search: searchInbox })
      setInboxList(res.payload || res.data || [])
    } catch {
      // silent
    } finally {
      setInboxLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'inbox') fetchInbox()
  }, [tab])

  const handleSelectInbox = async (item) => {
    setSelectedInbox(item)
    if (!item.is_read) {
      try {
        await emailService.showInbox(item.id)
        setInboxList((prev) => prev.map((it) => (it.id === item.id ? { ...it, is_read: true } : it)))
      } catch {
        // silent
      }
    }
  }

  const handleDeleteInbox = async (id, e) => {
    e.stopPropagation()
    const confirmed = await showDeleteConfirm('Hapus Email?', 'Email ini akan dihapus permanen.')
    if (!confirmed) return
    try {
      await emailService.deleteInbox(id)
      showSuccess('Dihapus', 'Email berhasil dihapus.')
      setInboxList((prev) => prev.filter((it) => it.id !== id))
      if (selectedInbox?.id === id) setSelectedInbox(null)
    } catch (err) {
      showError('Gagal', err?.response?.data?.message || err.message)
    }
  }

  const handleOffer = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await emailService.sendOffer(offer)
      showSuccess('Berhasil!', `Email penawaran terkirim ke ${offer.email}`)
      setOffer({ email: '', school_name: '', cta_url: 'https://akademihub.id/#demo' })
    } catch (err) {
      showError('Gagal', err?.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCustom = async (e) => {
    e.preventDefault()
    if (!custom.content || custom.content.trim() === '' || custom.content === '<p></p>') {
      showError('Validasi Gagal', 'Isi pesan email tidak boleh kosong.')
      return
    }
    setLoading(true)
    try {
      await emailService.sendCustom({ ...custom, attachments })
      showSuccess('Berhasil!', `Email terkirim ke ${custom.email}`)
      setCustom({ email: '', subject: '', content: '' })
      setAttachments([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      showError('Gagal', err?.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || [])
    setAttachments((prev) => [...prev, ...selectedFiles])
  }

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-800 p-6 text-white shadow-lg">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
          <Sparkles size={14} className="text-yellow-300" />
          <span>Email Center & Inbound</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold">Modul Email & Outreach</h1>
        <p className="text-sm text-blue-100">Kirim proposal digital & terima email balasan via Resend Inbound.</p>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setTab('inbox')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold ${
            tab === 'inbox' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
          }`}
        >
          <Inbox size={16} /> Kotak Masuk (Inbox)
        </button>
        <button
          type="button"
          onClick={() => setTab('offer')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold ${
            tab === 'offer' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
          }`}
        >
          <School size={16} /> Penawaran Sekolah
        </button>
        <button
          type="button"
          onClick={() => setTab('custom')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold ${
            tab === 'custom' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
          }`}
        >
          <Mail size={16} /> Kirim Bebas
        </button>
      </div>

      {tab === 'inbox' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Cari pengirim / subjek..."
                value={searchInbox}
                onChange={(e) => setSearchInbox(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchInbox()}
              />
              <Button variant="secondary" onClick={fetchInbox} disabled={inboxLoading}>
                <RefreshCw size={16} className={inboxLoading ? 'animate-spin' : ''} />
              </Button>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {inboxList.length === 0 ? (
                <Card>
                  <p className="text-center text-sm text-gray-500 py-6">Belum ada email masuk.</p>
                </Card>
              ) : (
                inboxList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectInbox(item)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      selectedInbox?.id === item.id
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-800'
                    } ${!item.is_read ? 'font-semibold border-l-4 border-l-blue-600' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="truncate pr-2">
                        <p className="text-sm text-gray-900 dark:text-white truncate">
                          {item.from_name || item.from_email}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{item.subject || '(Tanpa Subjek)'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteInbox(item.id, e)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            {selectedInbox ? (
              <Card title={selectedInbox.subject || '(Tanpa Subjek)'}>
                <div className="space-y-4">
                  <div className="border-b pb-3 text-xs text-gray-500 dark:border-gray-700 space-y-1">
                    <p><strong>Dari:</strong> {selectedInbox.from_name ? `${selectedInbox.from_name} <${selectedInbox.from_email}>` : selectedInbox.from_email}</p>
                    <p><strong>Ke:</strong> {selectedInbox.to_email}</p>
                    <p><strong>Diterima:</strong> {new Date(selectedInbox.received_at).toLocaleString('id-ID')}</p>
                  </div>

                  <div className="prose dark:prose-invert max-w-none text-sm">
                    {selectedInbox.html_body ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedInbox.html_body }} />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-sm">{selectedInbox.text_body}</pre>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="py-20 text-center text-gray-400 text-sm">
                  Pilih salah satu email di sebelah kiri untuk membaca isi pesan.
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'offer' && (
        <Card title="Form Penawaran Produk Sekolah">
          <form onSubmit={handleOffer} className="max-w-xl space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Email Tujuan *</label>
              <Input type="email" placeholder="kepsek@sekolah.sch.id" value={offer.email} onChange={(e) => setOffer({ ...offer, email: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Nama Sekolah *</label>
              <Input type="text" placeholder="SMA Negeri 1" value={offer.school_name} onChange={(e) => setOffer({ ...offer, school_name: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Link CTA Demo</label>
              <Input type="url" placeholder="https://akademihub.id/#demo" value={offer.cta_url} onChange={(e) => setOffer({ ...offer, cta_url: e.target.value })} />
            </div>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Mengirim...' : <><Send size={16} className="mr-2" /> Kirim Penawaran</>}
            </Button>
          </form>
        </Card>
      )}

      {tab === 'custom' && (
        <Card title="Kirim Email Bebas" subtitle="WYSIWYG editor & multi-lampiran dokumen">
          <form onSubmit={handleCustom} className="space-y-4">
            <div className="max-w-xl">
              <label className="mb-1 block text-sm font-medium">Email Tujuan *</label>
              <Input type="email" placeholder="tujuan@sekolah.sch.id" value={custom.email} onChange={(e) => setCustom({ ...custom, email: e.target.value })} required />
            </div>
            <div className="max-w-xl">
              <label className="mb-1 block text-sm font-medium">Subjek Email *</label>
              <Input type="text" placeholder="Subjek..." value={custom.subject} onChange={(e) => setCustom({ ...custom, subject: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Isi Pesan (Rich Text Editor) *</label>
              <LexicalEditor
                value={custom.content}
                onChange={(html) => setCustom((prev) => ({ ...prev, content: html }))}
                placeholder="Tulis pesan..."
                minHeight="200px"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Lampirkan File (Opsional)</label>
              <div className="flex items-center gap-3">
                <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" id="email-attachments" />
                <label htmlFor="email-attachments" className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  <Paperclip size={16} /> Pilih File
                </label>
                <span className="text-xs text-gray-500">{attachments.length} file dipilih</span>
              </div>
              {attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      <FileText size={14} />
                      <span className="max-w-xs truncate">{file.name}</span>
                      <button type="button" onClick={() => removeAttachment(idx)} className="ml-1 text-blue-500 hover:text-red-500"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-2">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Mengirim...' : <><Send size={16} className="mr-2" /> Kirim Email</>}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
