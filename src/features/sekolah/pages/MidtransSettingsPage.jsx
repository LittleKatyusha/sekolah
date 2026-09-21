import { useState, useEffect } from 'react'
import { CreditCard, Save, Zap, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck, ExternalLink } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { sekolahService } from '../services/sekolahService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const MidtransSettingsPage = () => {
  const [loading, setLoading] = useState(true)
  const [sekolah, setSekolah] = useState(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [showServerKey, setShowServerKey] = useState(false)
  const [settings, setSettings] = useState({
    server_key: '',
    client_key: '',
    is_production: false,
    is_3ds: true,
    merchant_id: '',
    has_server_key: false,
    is_custom: false,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data } = await sekolahService.getAll({ per_page: 1 })
      const list = data?.data?.data || data?.data || []
      const current = Array.isArray(list) ? list[0] : list
      if (current?.id) {
        setSekolah(current)
        await loadMidtrans(current.id)
      } else {
        showError('Gagal memuat data sekolah.')
      }
    } catch {
      showError('Terjadi kesalahan saat memuat data.')
    } finally {
      setLoading(false)
    }
  }

  const loadMidtrans = async (sekolahId) => {
    const { data, error } = await sekolahService.getMidtransSettings(sekolahId)
    if (error) {
      showError(error?.message || 'Gagal memuat pengaturan Midtrans')
      return
    }
    if (data?.data) {
      const res = data.data
      setSettings({
        server_key: '',
        client_key: res.client_key || '',
        is_production: Boolean(res.is_production),
        is_3ds: res.is_3ds !== undefined ? Boolean(res.is_3ds) : true,
        merchant_id: res.merchant_id || '',
        has_server_key: Boolean(res.has_server_key),
        is_custom: Boolean(res.is_custom),
      })
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!sekolah?.id) return
    setSaving(true)
    const payload = {
      client_key: settings.client_key.trim(),
      is_production: settings.is_production,
      is_3ds: settings.is_3ds,
      merchant_id: settings.merchant_id.trim(),
    }
    if (settings.server_key && settings.server_key.trim() !== '') {
      payload.server_key = settings.server_key.trim()
    }
    const { error } = await sekolahService.updateMidtransSettings(sekolah.id, payload)
    setSaving(false)
    if (error) {
      showError(error?.message || 'Gagal menyimpan konfigurasi Midtrans')
      return
    }
    showSuccess('Konfigurasi Midtrans berhasil disimpan ke database!')
    loadMidtrans(sekolah.id)
  }

  const handleTest = async () => {
    if (!sekolah?.id) return
    setTesting(true)
    setTestResult(null)
    const payload = {
      is_production: settings.is_production,
    }
    if (settings.server_key && settings.server_key.trim() !== '') {
      payload.server_key = settings.server_key.trim()
    }
    const { data, error } = await sekolahService.testMidtransConnection(sekolah.id, payload)
    setTesting(false)
    if (error) {
      const errMsg = error?.message || 'Gagal terhubung ke Midtrans API.'
      setTestResult({ success: false, message: errMsg })
      showError(errMsg, 'Test Koneksi Midtrans Gagal')
      return
    }
    const msg = data?.message || 'Koneksi ke Midtrans berhasil diverifikasi!'
    const latency = data?.data?.latency_ms
    setTestResult({ success: true, message: msg, latency_ms: latency })
    showSuccess(msg, 'Test Koneksi Midtrans Berhasil')
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <CreditCard className="text-primary-600 dark:text-primary-400" size={28} />
            Pengaturan Midtrans Payment Gateway
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Konfigurasi gateway pembayaran untuk SPP dan Saldo Kantin tanpa perlu mengubah file konfigurasi atau kode server.
          </p>
        </div>
        {sekolah && (
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300 font-medium">
              {sekolah.nama_sekolah || sekolah.nama}
            </span>
          </div>
        )}
      </div>

      {/* Main Settings Card */}
      <Card>
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-green-600 dark:text-green-400" size={20} />
              <span className="font-semibold text-gray-900 dark:text-white">Kredensial API Midtrans</span>
            </div>
            {settings.is_custom ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                Custom Sekolah
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Default Sistem
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Environment
              </label>
              <select
                aria-label="Environment Midtrans"
                className="input-field mt-2 w-full"
                value={settings.is_production ? 'production' : 'sandbox'}
                onChange={(e) => setSettings(prev => ({ ...prev, is_production: e.target.value === 'production' }))}
              >
                <option value="sandbox">Sandbox (Testing / Pengembangan)</option>
                <option value="production">Production (Live Transaksi Nyata)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Pilih Sandbox untuk uji coba, atau Production untuk menerima pembayaran riil.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Merchant ID (Opsional)
              </label>
              <input
                aria-label="Merchant ID Midtrans"
                placeholder="Contoh: G123456789 atau M123456"
                className="input-field mt-2 w-full"
                value={settings.merchant_id}
                onChange={(e) => setSettings(prev => ({ ...prev, merchant_id: e.target.value }))}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Dapat ditemukan pada Dashboard Midtrans &gt; Settings &gt; General.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Client Key <span className="text-red-500">*</span>
              </label>
              <input
                aria-label="Client Key Midtrans"
                required
                placeholder="SB-Mid-client-... atau Mid-client-..."
                className="input-field mt-2 w-full font-mono text-xs"
                value={settings.client_key}
                onChange={(e) => setSettings(prev => ({ ...prev, client_key: e.target.value }))}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Client Key digunakan untuk frontend popup Snap pembayaran.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Server Key {settings.has_server_key && <span className="text-xs text-green-600 dark:text-green-400 font-normal">(Tersimpan Aman)</span>}
              </label>
              <div className="relative mt-2">
                <input
                  aria-label="Server Key Midtrans"
                  type={showServerKey ? 'text' : 'password'}
                  placeholder={settings.has_server_key ? '•••••••• (Biarkan kosong jika tidak diubah)' : 'SB-Mid-server-... atau Mid-server-...'}
                  className="input-field w-full pr-10 font-mono text-xs"
                  value={settings.server_key}
                  onChange={(e) => setSettings(prev => ({ ...prev, server_key: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowServerKey(!showServerKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showServerKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Server Key dienkripsi di server database. Jangan bagikan ke siapa pun.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="is_3ds_toggle_page"
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={settings.is_3ds}
              onChange={(e) => setSettings(prev => ({ ...prev, is_3ds: e.target.checked }))}
            />
            <label htmlFor="is_3ds_toggle_page" className="text-sm text-gray-700 dark:text-gray-300">
              Aktifkan 3D Secure (Direkomendasikan untuk transaksi Kartu Kredit / Debit)
            </label>
          </div>

          {testResult && (
            <div
              role="alert"
              className={`p-4 rounded-lg text-sm flex items-start gap-3 ${
                testResult.success
                  ? 'bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 size={20} className="shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <AlertCircle size={20} className="shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{testResult.success ? 'Koneksi Midtrans Berhasil' : 'Koneksi Midtrans Gagal'}</p>
                <p className="text-xs mt-0.5">{testResult.message}</p>
                {testResult.latency_ms !== undefined && (
                  <p className="text-xs mt-1 text-green-700 dark:text-green-400 font-mono">
                    Latensi respon API: {testResult.latency_ms} ms
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <a
              href={settings.is_production ? 'https://dashboard.midtrans.com' : 'https://dashboard.sandbox.midtrans.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
            >
              Buka Dashboard Midtrans {settings.is_production ? 'Production' : 'Sandbox'}
              <ExternalLink size={12} />
            </a>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleTest}
                disabled={testing || saving}
              >
                {testing ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Menguji...
                  </>
                ) : (
                  <>
                    <Zap size={16} className="mr-2" />
                    Test Koneksi Midtrans
                  </>
                )}
              </Button>
              <Button type="submit" disabled={saving || testing}>
                {saving ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Simpan Pengaturan
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Webhook Information Card */}
      <Card className="p-6 bg-gray-50 dark:bg-gray-800/50 border-dashed">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Panduan Webhook Notification URL Midtrans
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          Di Dashboard Midtrans Anda (Settings &gt; Configuration &gt; Payment Notification URL), pasang URL berikut agar notifikasi pembayaran otomatis memperbarui SPP dan Saldo Kantin:
        </p>
        <div className="p-2.5 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 font-mono text-xs text-gray-800 dark:text-gray-200 select-all">
          {window.location.origin}/api/v1/payments/midtrans/webhook
        </div>
      </Card>
    </div>
  )
}

export default MidtransSettingsPage
