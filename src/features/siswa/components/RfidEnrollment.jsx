import { useEffect, useRef, useState } from 'react'
import Button from '../../../components/ui/Button'
import { siswaService } from '../services/siswaService'

export default function RfidEnrollment({ siswa, onSuccess, onClose }) {
  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState('')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')
  const alive = useRef(true)
  const success = useRef(onSuccess)
  success.current = onSuccess

  useEffect(() => {
    alive.current = true
    siswaService.getRfidReaders(siswa.id).then(({ data, error }) => {
      if (!alive.current) return
      if (error) setError(error.message || 'Gagal memuat mesin absensi.')
      else {
        setDevices(data.data)
        setDeviceId(String(data.data[0]?.id || ''))
      }
      setLoading(false)
    }).catch(() => {
      if (alive.current) { setError('Gagal memuat mesin absensi.'); setLoading(false) }
    })
    return () => { alive.current = false }
  }, [siswa.id])

  useEffect(() => {
    if (session?.status !== 'pending') return
    let stopped = false
    let timer
    const poll = async () => {
      try {
        const { data, error } = await siswaService.getRfidEnrollment(siswa.id, session.device_id, session.session_id)
        if (stopped) return
        if (error) throw new Error(error.message || 'Gagal memeriksa status. Jangan pindai sampai status tersambung.')
        const next = data.data
        if (next.session_id !== session.session_id || Number(next.siswa_id) !== Number(siswa.id)) {
          throw new Error('Identitas sesi tidak cocok. Jangan pindai kartu.')
        }
        setError(next.error || '')
        if (next.status !== 'pending') {
          setSession(next)
          if (next.status === 'completed') success.current?.(next.rfid_uid)
          return
        }
      } catch (error) {
        if (stopped) return
        setError(error.message || 'Gagal memeriksa status. Jangan pindai kartu.')
        if (Date.now() >= Date.parse(session.expires_at)) {
          setError('Batas waktu sesi terlewati; hasil scan belum dapat dikonfirmasi. Periksa UID siswa setelah koneksi pulih.')
          setSession({ ...session, status: 'expired' })
          return
        }
      }
      timer = setTimeout(poll, 2000)
    }
    poll()
    return () => { stopped = true; clearTimeout(timer) }
  }, [session, siswa.id])

  const start = async () => {
    if (starting || session?.status === 'pending') return
    setStarting(true)
    setError('')
    try {
      const { data, error } = await siswaService.startRfidEnrollment(siswa.id, Number(deviceId))
      if (!alive.current) return
      if (error) throw new Error(error.message || 'Gagal memulai pendaftaran kartu.')
      setSession(data.data)
    } catch (error) {
      if (alive.current) setError(error.message || 'Gagal memulai pendaftaran kartu.')
    } finally {
      if (alive.current) setStarting(false)
    }
  }
  const pending = session?.status === 'pending'
  return (
    <section aria-label={`Pendaftaran RFID ${siswa.nama}`} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4">
      <h2 className="font-semibold text-gray-900 dark:text-white">Kartu RFID: {siswa.nama}</h2>
      <p className="text-sm text-gray-700 dark:text-gray-300">Pilih mesin, mulai pendaftaran, lalu tempelkan kartu. Batas waktu 5 menit. UID terisi otomatis; kartu lama tetap aktif sampai scan berhasil.</p>
      {loading ? <p role="status">Memuat mesin absensi...</p> : <>
        {!devices.length ? <p>Tidak ada mesin RFID aktif yang tersedia.</p> : <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <label className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">Mesin absensi
            <select className="input-field mt-2 w-full" value={deviceId} disabled={pending || starting} onChange={(event) => setDeviceId(event.target.value)}>
              {devices.map((device) => <option key={device.id} value={device.id}>{device.device_name} ({device.tipe_lokasi})</option>)}
            </select>
          </label>
          <Button disabled={!deviceId || pending || starting} onClick={start}>{starting ? 'Memulai...' : 'Mulai pendaftaran'}</Button>
        </div>}
      </>}
      <div role="status" aria-live="polite" className="text-sm text-gray-900 dark:text-gray-100">
        {pending && <p>Menunggu scan untuk {siswa.nama}. Berlaku sampai {new Date(session.expires_at).toLocaleTimeString('id-ID')}. Jangan ganti siswa pada mesin ini.</p>}
        {session?.status === 'completed' && <p>Kartu berhasil terdaftar. UID: <strong>{session.rfid_uid}</strong></p>}
        {session?.status === 'expired' && <p>Waktu pendaftaran habis. Mulai kembali sebelum memindai kartu.</p>}
      </div>
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      <Button variant="secondary" onClick={onClose} disabled={pending || starting}>Tutup</Button>
      {pending && <p className="text-sm text-gray-700 dark:text-gray-300">Sesi tetap aktif selama 5 menit meskipun halaman ditinggalkan.</p>}
    </section>
  )
}
