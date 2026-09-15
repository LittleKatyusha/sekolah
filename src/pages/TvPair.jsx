import { useEffect, useState } from 'react'
import { apiService } from '../utils/api'

export default function TvPair() {
  const [devices, setDevices] = useState([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ user_code: '', name: '', mode: 'signage', class_id: '' })

  async function load(currentPage) {
    const { data, error } = await apiService.get('/tv/devices', { params: { page: currentPage } })
    if (error) { setMessage(typeof error === 'string' ? error : error.message); return }
    setDevices(data?.data?.data || [])
    setLastPage(data?.data?.last_page || 1)
  }
  useEffect(() => { load(page) }, [page])

  async function approve(event) {
    event.preventDefault()
    setBusy(true)
    const { error } = await apiService.post('/tv/pairing/approve', {
      ...form, user_code: form.user_code.trim().toUpperCase(),
      class_id: form.mode === 'classroom' ? Number(form.class_id) : null,
    })
    setMessage(error ? (typeof error === 'string' ? error : error.message) : 'TV berhasil dihubungkan.')
    if (!error) { setForm({ user_code: '', name: '', mode: 'signage', class_id: '' }); await load(page) }
    setBusy(false)
  }
  async function revoke(device) {
    if (!window.confirm(`Cabut akses ${device.name}? TV offline baru menerima pencabutan saat tersambung kembali.`)) return
    setBusy(true)
    const { error } = await apiService.delete(`/tv/devices/${device.id}`)
    setMessage(error ? (typeof error === 'string' ? error : error.message) : 'Akses TV dicabut.')
    if (!error) await load(page)
    setBusy(false)
  }
  const inputClass = 'block w-full border rounded p-2 bg-white text-gray-900'
  return <section className="space-y-6 max-w-3xl mx-auto">
    <h1 className="text-2xl font-bold">Kelola TV</h1>
    <p>Masukkan kode dari TV. Pastikan akun berada di sekolah yang benar sebelum menyetujui.</p>
    {message && <p role="status">{message}</p>}
    <form onSubmit={approve} className="space-y-4">
      <label className="block">Kode pairing<input className={inputClass} required pattern="[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}" maxLength={6} value={form.user_code} onChange={e => setForm({ ...form, user_code: e.target.value.toUpperCase() })} /></label>
      <label className="block">Nama TV<input className={inputClass} required maxLength={100} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
      <label className="block">Mode<select className={inputClass} value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}><option value="signage">Signage publik</option><option value="classroom">Display kelas</option></select></label>
      {form.mode === 'classroom' && <label className="block">ID kelas<input className={inputClass} type="number" min="1" step="1" required value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })} /></label>}
      <button className="border rounded p-2" disabled={busy}>Setujui pairing</button>
    </form>
    <h2 className="text-xl font-bold">Perangkat sekolah</h2>
    <ul className="space-y-3">{devices.map(device => <li className="border rounded p-3" key={device.id}>
      <p>{device.name} — {device.mode} — {device.revoked_at ? 'Dicabut' : 'Aktif'}</p>
      <p>Terakhir terhubung: {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString('id-ID') : 'Belum terhubung'}</p>
      {!device.revoked_at && <button className="border rounded p-2" disabled={busy} onClick={() => revoke(device)}>Cabut akses</button>}
    </li>)}</ul>
    {!devices.length && <p>Belum ada perangkat.</p>}
    <div className="flex gap-4"><button disabled={busy || page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button><span>{page} / {lastPage}</span><button disabled={busy || page >= lastPage} onClick={() => setPage(page + 1)}>Berikutnya</button></div>
  </section>
}