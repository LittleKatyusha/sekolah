import { useEffect, useState } from 'react'
import { Plus, Radio, RotateCw, Save } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { sekolahService } from '../services/sekolahService'
import { showError, showSuccess } from '../../../utils/sweetalert'

const RfidDevicesCard = ({ sekolahId, settings }) => {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [token, setToken] = useState('')
  const [config, setConfig] = useState({
    api_url: settings.find(({ key }) => key === 'rfid_api_url')?.value || '',
    scan_cooldown_ms: settings.find(({ key }) => key === 'rfid_scan_cooldown_ms')?.value || '3000',
  })
  const [newDevice, setNewDevice] = useState({ device_name: '', tipe_lokasi: 'gerbang_utama' })

  const load = async () => {
    setLoading(true)
    const { data, error } = await sekolahService.getRfidDevices(sekolahId)
    setLoading(false)
    if (error) return showError(error.message || 'Gagal memuat mesin absensi')
    setDevices(data?.data || [])
  }

  useEffect(() => { load() }, [sekolahId])
  useEffect(() => {
    setConfig({
      api_url: settings.find(({ key }) => key === 'rfid_api_url')?.value || '',
      scan_cooldown_ms: settings.find(({ key }) => key === 'rfid_scan_cooldown_ms')?.value || '3000',
    })
  }, [settings])

  const saveConfig = async (event) => {
    event.preventDefault()
    setSaving(true)
    const { error } = await sekolahService.updateRfidDeviceConfig(sekolahId, {
      api_url: config.api_url.trim(),
      scan_cooldown_ms: Number(config.scan_cooldown_ms),
    })
    setSaving(false)
    if (error) return showError(error.message || 'Gagal menyimpan konfigurasi mesin')
    showSuccess('Konfigurasi mesin absensi berhasil disimpan!')
  }

  const createDevice = async (event) => {
    event.preventDefault()
    setSaving(true)
    const { data, error } = await sekolahService.createRfidDevice(sekolahId, newDevice)
    setSaving(false)
    if (error) return showError(error.message || 'Gagal menambahkan mesin absensi')
    setToken(data?.data?.device_token || '')
    setNewDevice({ device_name: '', tipe_lokasi: 'gerbang_utama' })
    showSuccess('Mesin absensi ditambahkan. Simpan token perangkat sekarang.')
    load()
  }

  const rotateToken = async (deviceId) => {
    setSaving(true)
    const { data, error } = await sekolahService.rotateRfidDeviceToken(sekolahId, deviceId)
    setSaving(false)
    if (error) return showError(error.message || 'Gagal merotasi token perangkat')
    setToken(data?.data?.device_token || '')
    showSuccess('Token perangkat diperbarui. Simpan token baru sekarang.')
  }

  return (
    <Card>
      <div className="p-6 space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Radio size={20} /> Mesin Absensi RFID</h3>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Konfigurasi dikirim ke ESP32 saat perangkat tersambung.</p>
        </div>

        <PermissionGuard permission="sekolah.settings.update">
          <form onSubmit={saveConfig} className="grid grid-cols-1 md:grid-cols-[1fr_12rem_auto] gap-3 items-end">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">URL API scan (opsional)<input aria-label="URL API RFID" className="input-field mt-2 w-full" type="url" placeholder="Otomatis mengikuti backend ESP32" value={config.api_url} onChange={(e) => setConfig({ ...config, api_url: e.target.value })} /><span className="block mt-1 text-sm">Kosongkan untuk memakai alamat backend yang diakses perangkat.</span></label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cooldown (ms)<input aria-label="Cooldown RFID" className="input-field mt-2 w-full" type="number" min="500" max="60000" required value={config.scan_cooldown_ms} onChange={(e) => setConfig({ ...config, scan_cooldown_ms: e.target.value })} /></label>
            <Button type="submit" disabled={saving}><Save size={18} className="mr-2" />Simpan</Button>
          </form>

          <form onSubmit={createDevice} className="grid grid-cols-1 md:grid-cols-[1fr_12rem_auto] gap-3 items-end border-t border-gray-200 dark:border-gray-700 pt-5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama mesin<input aria-label="Nama mesin RFID" className="input-field mt-2 w-full" required maxLength="100" placeholder="Reader Gerbang Utama" value={newDevice.device_name} onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })} /></label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lokasi<input aria-label="Lokasi mesin RFID" className="input-field mt-2 w-full" maxLength="50" value={newDevice.tipe_lokasi} onChange={(e) => setNewDevice({ ...newDevice, tipe_lokasi: e.target.value })} /></label>
            <Button type="submit" disabled={saving}><Plus size={18} className="mr-2" />Tambah mesin</Button>
          </form>
        </PermissionGuard>

        {token && <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"><p className="font-medium">Simpan token ini sekarang. Token tidak ditampilkan lagi.</p><code className="mt-2 block break-all rounded bg-white/70 p-2 dark:bg-black/20">{token}</code></div>}

        {loading ? <div className="h-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" /> : devices.length === 0 ? <p className="py-3 text-sm text-gray-500 dark:text-gray-400">Belum ada mesin terdaftar.</p> : <div className="divide-y divide-gray-200 dark:divide-gray-700">{devices.map((device) => <div key={device.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-gray-900 dark:text-white">{device.device_name}</p><p className="text-sm text-gray-500 dark:text-gray-400">{device.tipe_lokasi} · Ping terakhir: {device.last_ping_at ? new Date(device.last_ping_at).toLocaleString('id-ID') : 'Belum pernah'}</p></div><PermissionGuard permission="sekolah.settings.update"><Button type="button" variant="outline" disabled={saving} onClick={() => rotateToken(device.id)}><RotateCw size={16} className="mr-2" />Rotasi token</Button></PermissionGuard></div>)}</div>}
      </div>
    </Card>
  )
}

export default RfidDevicesCard
