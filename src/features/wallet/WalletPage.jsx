import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import useAuthStore from '../../store/useAuthStore'
import { checkPermission } from '../../hooks/usePermission'
import { amount, date, isGuardian, isStudent, MAX_AMOUNT, money, qrToken, request, walletError } from './wallet'

const button = 'btn-secondary disabled:opacity-50'
function Field({ label, ...props }) { return <label className="block text-sm font-medium">{label}<input className="input-field mt-1" required {...props} /></label> }
function Panel({ title, children }) { return <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 space-y-4"><h2 className="text-lg font-semibold">{title}</h2>{children}</section> }
function Receipt({ tx }) {
  return <Panel title="Bukti transaksi"><dl className="grid gap-2 break-words text-sm">{Object.entries({ 'ID transaksi': tx.id, Jenis: tx.kind, Status: tx.status || 'posted', Nominal: money(tx.amount), Waktu: date(tx.created_at), 'ID siswa': tx.student_id, Pedagang: tx.details?.merchant_name || tx.merchant_id, 'ID petugas / aktor': tx.actor_id, 'Transaksi asal': tx.original_id, 'Refund terkait': tx.refund?.id, Bukti: tx.details?.receipt || tx.details?.proof, Alasan: tx.details?.reason }).filter(([, v]) => v != null).map(([k, v]) => <div key={k}><dt className="text-gray-500">{k}</dt><dd>{v}</dd></div>)}</dl><button className={button} onClick={() => window.print()}>Cetak bukti</button></Panel>
}
function Camera({ onCode, onError, onClose }) {
  const video = useRef(null)
  useEffect(() => {
    let stream, timer, stopped = false
    async function start() {
      try {
        if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) throw new Error('Pemindai kamera tidak tersedia. Gunakan kode penerima.')
        if (!(await window.BarcodeDetector.getSupportedFormats()).includes('qr_code')) throw new Error('QR kamera tidak didukung. Gunakan kode penerima.')
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return }
        video.current.srcObject = stream
        await video.current.play()
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        async function scan() {
          if (stopped) return
          try {
            const codes = await detector.detect(video.current)
            if (stopped) return
            if (codes.length) { onCode(codes[0].rawValue); return }
            timer = setTimeout(scan, 250)
          } catch (e) { if (!stopped) onError(e) }
        }
        scan()
      } catch (e) { if (!stopped) onError(new Error(e.name === 'NotAllowedError' ? 'Izin kamera ditolak. Gunakan kode penerima.' : e.message)) }
    }
    start()
    return () => { stopped = true; clearTimeout(timer); stream?.getTracks().forEach(t => t.stop()) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- fixed callbacks for one scan session
  return <div><video ref={video} muted playsInline className="w-full max-h-80 rounded-lg" aria-label="Pemindai QR pedagang" /><button className={button} onClick={onClose}>Tutup kamera</button></div>
}
function Collection({ title, path, params, render }) {
  const [page, setPage] = useState(1), [result, setResult] = useState(null), [error, setError] = useState('')
  const query = JSON.stringify(params || {})
  useEffect(() => { setPage(1) }, [query, path])
  useEffect(() => {
    let live = true
    setResult(null); setError('')
    request(path, 'get', { ...JSON.parse(query), page }).then(r => { if (live) setResult(r) }).catch(e => { if (live) setError(walletError(e)) })
    return () => { live = false }
  }, [path, query, page])
  return <Panel title={title}>{error && <p role="alert">{error}</p>}{!result && !error && <p role="status">Memuat...</p>}{result?.data?.length === 0 && <p>Belum ada data.</p>}<div className="space-y-3">{result?.data?.map(row => <div key={row.id} className="border-b border-gray-200 dark:border-gray-700 pb-3 break-words">{render(row)}</div>)}</div>{result && <div className="flex items-center gap-3"><button className={button} disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button><span>{page} / {result.last_page}</span><button className={button} disabled={page >= result.last_page} onClick={() => setPage(page + 1)}>Berikutnya</button></div>}</Panel>
}

export default function WalletPage() {
  const user = useAuthStore(s => s.user), student = isStudent(user), guardian = isGuardian(user)
  const can = p => checkPermission(user, `wallet.${p}`)
  const { token } = useParams(), [search, setSearch] = useSearchParams()
  const [accounts, setAccounts] = useState([]), [account, setAccount] = useState(null), [selected, setSelected] = useState('')
  const [tab, setTab] = useState(() => student || guardian || can('view-all') ? 'saldo' : can('manage-merchants') ? 'merchants' : can('process-payout') ? 'payouts' : 'cases'), [revision, setRevision] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [disabled, setDisabled] = useState(false), [receipt, setReceipt] = useState(null), [camera, setCamera] = useState(false)
  const [code, setCode] = useState(token || ''), [merchant, setMerchant] = useState(null), [payment, setPayment] = useState(null)
  const [quote, setQuote] = useState(null), [methods, setMethods] = useState([]), [topup, setTopup] = useState(null)
  const [filters, setFilters] = useState({}), [action, setAction] = useState(null)
  const lock = useRef(false), operations = useRef(new Map())
  const canAccounts = student || guardian || can('view-all')
  async function run(fn) {
    if (lock.current) return
    lock.current = true; setBusy(true); setError(''); setNotice('')
    try { return await fn() } catch (e) { setError(walletError(e)); if (e.response?.data?.message === 'WALLET_DISABLED') setDisabled(true) }
    finally { lock.current = false; setBusy(false) }
  }
  async function mutate(path, payload, method = 'post') {
    const fingerprint = JSON.stringify([path, { ...payload, pin: undefined, password: undefined }])
    // Keep the same operation key after ambiguous network failure; never persist PIN/password.
    const storageKey = `wallet-operation:${user.mst_sekolah_id}:${user.id}:${fingerprint}`
    if (!operations.current.has(fingerprint)) operations.current.set(fingerprint, sessionStorage.getItem(storageKey) || crypto.randomUUID())
    sessionStorage.setItem(storageKey, operations.current.get(fingerprint))
    const data = await request(path, method, { ...payload, idempotency_key: operations.current.get(fingerprint) })
    operations.current.delete(fingerprint)
    sessionStorage.removeItem(storageKey)
    setRevision(n => n + 1)
    return data
  }
  useEffect(() => {
    const refresh = () => { if (document.visibilityState !== 'hidden' && !lock.current) setRevision(n => n + 1) }
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])
  useEffect(() => {
    if (!canAccounts) return
    let live = true
    async function load() {
      let page = 1, rows = [], data
      do { data = await request('accounts', 'get', { page }); rows = rows.concat(data.data); page++ } while (page <= data.last_page)
      if (live) { setAccounts(rows); setSelected(current => current || String(rows[0]?.student.id || '')) }
    }
    load().catch(e => { if (live) setError(walletError(e)) })
    return () => { live = false }
  }, [canAccounts, revision])
  useEffect(() => {
    setQuote(null)
    if (!selected) return
    let live = true
    request(`accounts/${selected}`).then(r => { if (live) setAccount(r) }).catch(e => { if (live) setError(walletError(e)) })
    return () => { live = false }
  }, [selected, revision])
  useEffect(() => { setAccount(null); setPayment(null); setReceipt(null) }, [selected])
  useEffect(() => { if (guardian) request('topups/methods').then(r => setMethods(r.methods)).catch(e => setError(walletError(e))) }, [guardian])
  useEffect(() => {
    if (!token || !student) return
    let live = true
    try { qrToken(token); request(`qr/${token}`).then(r => { if (live) setMerchant(r) }).catch(e => { if (live) setError(walletError(e)) }) } catch (e) { setError(e.message) }
    return () => { live = false }
  }, [token, student])
  const topupId = search.get('topup')
  useEffect(() => {
    if (!topupId || !/^[\da-f-]{36}$/i.test(topupId)) return
    let live = true
    const refresh = () => { if (document.visibilityState !== 'hidden') request(`topups/${topupId}`).then(r => { if (live) setTopup(r) }).catch(e => { if (live) setError(walletError(e)) }) }
    refresh(); const timer = setInterval(refresh, 10000)
    window.addEventListener('focus', refresh)
    return () => { live = false; clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [topupId])
  const form = fn => e => { e.preventDefault(); const element = e.currentTarget; const values = Object.fromEntries(new FormData(element)); run(() => fn(values, element)) }
  async function createMerchant(values, element) {
    if (!values.user_id && (!values.email || values.password.length < 12)) throw new Error('Isi email dan kata sandi minimal 12 karakter, atau pilih ID akun pedagang yang sudah ada.')
    const payload = values.user_id ? { user_id: amount(values.user_id), name: values.name } : { name: values.name, email: values.email, password: values.password }
    await mutate('merchants', payload)
    element.reset(); setNotice('Pedagang berhasil dibuat.')
  }
  const resolve = value => run(async () => { setMerchant(null); setPayment(null); const t = qrToken(value); setCode(t); setMerchant(await request(`qr/${t}`)) })
  const showReceipt = id => run(async () => setReceipt(await request(`transactions/${id}`, 'get', guardian ? { student_id: Number(selected) } : undefined)))
  const tabs = [['saldo', 'Saldo & riwayat', canAccounts], ['merchants', 'Pedagang', can('manage-merchants')], ['payouts', 'Pencairan', can('process-payout')], ['cases', 'Kasus gateway', can('handle-cases')]]
  async function downloadQr(m) {
    qrToken(m.qr_url)
    const QRCode = await import('qrcode')
    const url = await QRCode.toDataURL(m.qr_url, { width: 1000, margin: 4, errorCorrectionLevel: 'M' })
    const a = document.createElement('a'); a.href = url; a.download = `kantin-${m.id}.png`; a.click()
  }
  return <div className="max-w-6xl mx-auto space-y-6 text-gray-900 dark:text-gray-100">
    <header className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-semibold">Saldo & kantin</h1><p className="text-sm text-gray-500">Saldo siswa terpisah dari pembayaran SPP.</p></div><button className={button} disabled={busy} onClick={() => setRevision(n => n + 1)}>Muat ulang</button></header>
    {error && <div role="alert" className="p-4 rounded-lg bg-red-50 text-red-800">{error}<p className="text-sm">Jika hasil transaksi belum diketahui, periksa riwayat atau ulangi dengan data yang sama. Jangan membuat pembayaran baru.</p></div>}
    {notice && <p role="status" className="p-4 bg-green-50 text-green-800 rounded-lg">{notice}</p>}
    {disabled && <p role="status">Transaksi baru dinonaktifkan. Riwayat tetap dapat dibaca.</p>}
    {!canAccounts && (can('cash-topup') || can('reset-pin')) && <p role="alert">Pemilihan dan verifikasi identitas siswa memerlukan izin wallet.view-all. Hubungi pengelola hak akses sekolah.</p>}
    <nav aria-label="Menu saldo" className="flex flex-wrap gap-2">{tabs.filter(([, , allowed]) => allowed).map(([id, label]) => <button key={id} className={tab === id ? 'btn-primary' : button} aria-current={tab === id ? 'page' : undefined} onClick={() => { setTab(id); setAction(null) }}>{label}</button>)}</nav>
    {receipt && <Receipt tx={receipt} />}
    {tab === 'saldo' && canAccounts && <>
      {(guardian || can('view-all')) && <details className="rounded-lg border p-4"><summary className="cursor-pointer font-medium">Periksa top up berdasarkan ID</summary><form className="space-y-3 mt-3" onSubmit={form(async v => { if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(v.id)) throw new Error('ID top up tidak valid.'); setTopup(await request(`topups/${v.id}`)); setSearch({ topup: v.id }) })}><Field label="ID top up" name="id" /><button className={button} disabled={busy}>Cari status top up</button></form></details>}
      <label className="block text-sm font-medium">{guardian ? 'Pilih anak' : 'Siswa'}<select className="input-field mt-1" value={selected} onChange={e => setSelected(e.target.value)}><option value="">Pilih siswa</option>{accounts.map(a => <option key={a.student.id} value={a.student.id}>{a.student.name} - Kelas {a.student.class_id || '-'} - ID {a.student.id}</option>)}</select></label>
      {!accounts.length && <p>Belum ada siswa yang dapat diakses.</p>}
      {account && <>
        <Panel title={account.student.name}><dl className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[['Saldo tersedia', money(account.available)], ['Batas harian', money(account.daily_limit)], ['Belanja hari ini', money(account.spent_today)], ['Sisa jatah', money(account.remaining_today)]].map(([k, v]) => <div key={k}><dt className="text-sm text-gray-500">{k}</dt><dd className="text-xl font-semibold tabular-nums">{v}</dd></div>)}</dl><p className="text-sm">Maksimum pembayaran: {money(account.max_payment)}. Reset {date(account.resets_at)} ({account.timezone}).</p>{account.frozen && <p role="alert" className="text-red-600">Belanja dibekukan. Hubungi petugas sekolah.</p>}</Panel>
        {student && <div className="grid md:grid-cols-2 gap-6">
          {!account.pin_set && <Panel title="Atur PIN transaksi"><form className="space-y-3" onSubmit={form(async v => { if (v.pin !== v.confirm) throw new Error('Konfirmasi PIN tidak sama.'); await request('pin', 'post', { pin: v.pin, password: v.password }); setRevision(n => n + 1); setNotice('PIN berhasil diatur.') })}><Field label="Kata sandi akun" name="password" type="password" autoComplete="current-password" /><Field label="PIN baru (6 digit)" name="pin" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="new-password" /><Field label="Ulangi PIN" name="confirm" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="new-password" /><button disabled={busy} className="btn-primary">Simpan PIN</button></form></Panel>}
          <Panel title="Bayar kantin"><form className="space-y-3" onSubmit={e => { e.preventDefault(); resolve(code) }}><Field label="Kode atau URL QR pedagang" value={code} onChange={e => { setCode(e.target.value); setMerchant(null); setPayment(null) }} /><div className="flex flex-wrap gap-2"><button className={button} disabled={busy}>Periksa penerima</button><button type="button" className={button} onClick={() => setCamera(true)}>Scan kamera</button></div></form>{camera && <Camera onClose={() => setCamera(false)} onError={e => { setError(walletError(e)); setCamera(false) }} onCode={value => { setCamera(false); resolve(value) }} />}
            {merchant && <div className="space-y-3"><p className="font-semibold">{merchant.name}</p><p>{merchant.school_name} / {merchant.active ? 'Aktif' : 'Tidak aktif'}</p>{merchant.active && <form className="space-y-3" onSubmit={form(v => setPayment({ qr_token: merchant.qr_token, amount: amount(v.amount) }))}><Field label="Nominal pembayaran (Rp)" name="amount" type="number" min="1" max={account.max_payment} step="1" /><button className="btn-primary" disabled={busy || disabled || !account.pin_set || account.frozen}>Lanjutkan konfirmasi</button></form>}</div>}
            {payment && <form className="space-y-3 border-t pt-4" onSubmit={form(async (v, el) => { const tx = await mutate('payments', { ...payment, pin: v.pin }); el.reset(); setPayment(null); setReceipt(await request(`transactions/${tx.id}`)); setNotice('Pembayaran tercatat.') })}><p>Bayar <strong>{money(payment.amount)}</strong> ke <strong>{merchant?.name}</strong>. Pastikan penerima dan nominal benar.</p><Field label="PIN transaksi" name="pin" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="off" /><button className="btn-primary" disabled={busy || disabled}>Konfirmasi & bayar</button><button type="button" className={button} disabled={busy} onClick={() => setPayment(null)}>Batal</button></form>}
          </Panel>
        </div>}
        {guardian && <div className="grid md:grid-cols-2 gap-6"><Panel title="Isi saldo online"><form className="space-y-3" onChange={() => setQuote(null)} onSubmit={form(async v => setQuote({ ...await request('topups/quote', 'post', { student_id: Number(selected), amount: amount(v.amount), method: v.method }), student_id: Number(selected) }))}><Field label="Nominal saldo (Rp)" name="amount" type="number" min="1" max={MAX_AMOUNT} step="1" /><label className="block text-sm">Metode pembayaran<select required name="method" className="input-field mt-1"><option value="">Pilih metode</option>{methods.map(m => <option key={m.method}>{m.method}</option>)}</select></label>{!methods.length && <p>Isi saldo online belum diaktifkan. Hubungi petugas untuk isi tunai.</p>}<button className={button} disabled={busy || disabled || !methods.length}>Lihat rincian biaya</button></form>{quote && <div className="space-y-3"><p>Saldo {money(quote.principal)} + biaya {money(quote.fee)} = <strong>{money(quote.total)}</strong></p><p className="text-sm">Biaya ditanggung orang tua, tidak ditambahkan lagi saat checkout.</p><button className="btn-primary" disabled={busy || disabled} onClick={() => run(async () => { const t = await mutate('topups', { student_id: quote.student_id, amount: quote.principal, method: quote.method, fee: quote.fee, total: quote.total, schedule_version: quote.schedule_version }); setTopup(t); setSearch({ topup: t.id }); setQuote(null); setTopup(await request(`topups/${t.id}/checkout`, 'post', {})) })}>Setujui total & checkout</button></div>}</Panel>
          <Panel title="Batas belanja harian"><p className="text-sm">Berlaku bersama untuk seluruh pedagang. Rp0 memblokir belanja; tanpa batas tidak menghapus pemakaian hari ini.</p><form key={`${selected}-${account.limit_version}`} className="space-y-3" onSubmit={form(async v => { const limit = v.unlimited ? null : amount(v.limit, true); if (!window.confirm(`Simpan batas ${money(limit)} untuk ${account.student.name}?`)) return; await request(`accounts/${selected}/daily-limit`, 'put', { daily_limit: limit, version: account.limit_version }); setRevision(n => n + 1); setNotice('Batas harian diperbarui.') })}><Field label="Batas (Rp)" name="limit" type="number" min="0" step="1" max={MAX_AMOUNT} defaultValue={account.daily_limit ?? 0} /><label className="flex gap-2"><input type="checkbox" name="unlimited" defaultChecked={account.daily_limit === null} />Tanpa batas tambahan</label><p className="text-sm">Versi {account.limit_version}</p><button className="btn-primary" disabled={busy}>Simpan batas</button></form></Panel></div>}
        {topup && <Panel title="Status isi saldo"><p className="break-all">{topup.id}</p><p>Status: <strong>{topup.status}</strong> / gateway: {topup.provider_status || '-'}</p><p>Saldo {money(topup.principal)}, biaya {money(topup.fee)}, total {money(topup.total)}</p><p>Saldo hanya masuk setelah konfirmasi server. Kembali dari checkout bukan bukti pembayaran.</p>{topup.checkout_url && /^https:\/\/(app\.midtrans\.com|app\.sandbox\.midtrans\.com)\//.test(topup.checkout_url) && !['paid', 'reversed', 'expired', 'failed', 'cancelled'].includes(topup.status) && <a className="btn-primary inline-block" href={topup.checkout_url} target="_blank" rel="noopener noreferrer">Buka checkout Midtrans</a>}<button className={button} disabled={busy} onClick={() => run(async () => { setTopup(await request(`topups/${topup.id}`)); setRevision(n => n + 1) })}>Periksa status</button>{guardian && topup.status === 'created' && !topup.checkout_url && <button className={button} disabled={busy || disabled} onClick={() => run(async () => setTopup(await request(`topups/${topup.id}/checkout`, 'post', {})))}>Lanjutkan checkout yang sama</button>}</Panel>}
        {(guardian || can('reset-pin')) && <Panel title="Reset PIN siswa"><p>Siswa mengatur PIN baru sendiri. Reset tidak menampilkan PIN kepada wali atau petugas.</p><form className="space-y-3" onSubmit={form(async (v, el) => { if (!window.confirm(`Reset PIN ${account.student.name}?`)) return; await request(`accounts/${selected}/pin-reset`, 'post', v); el.reset(); setRevision(n => n + 1); setNotice('PIN direset. Siswa harus mengatur PIN baru.') })}><Field label="Kata sandi akun Anda" name="password" type="password" autoComplete="current-password" /><Field label="Alasan reset" name="reason" maxLength={500} /><button className={button} disabled={busy}>Reset PIN</button></form></Panel>}
        {can('cash-topup') && <Panel title="Isi saldo tunai"><p>{account.student.name}, kelas {account.student.class_id || '-'}, ID {selected}. Biaya Rp0.</p><form className="space-y-3" onSubmit={form(async v => { const n = amount(v.amount); if (!window.confirm(`Terima tunai ${money(n)} untuk ${account.student.name}, kelas ${account.student.class_id || '-'}? Nominal tidak dapat diedit setelah dicatat.`)) return; const tx = await mutate('topups/cash', { student_id: Number(selected), amount: n, receipt: v.receipt }); setReceipt(await request(`transactions/${tx.id}`)); setNotice('Penerimaan tunai tercatat.') })}><Field label="Nominal tunai (Rp)" name="amount" type="number" min="1" max={MAX_AMOUNT} step="1" /><Field label="Nomor / bukti penerimaan" name="receipt" maxLength={500} /><button className="btn-primary" disabled={busy || disabled}>Konfirmasi penerimaan tunai</button></form></Panel>}
        <Collection key={`audit-${revision}-${selected}`} title="Riwayat batas & reset PIN" path={`accounts/${selected}/audit`} render={row => <div className="text-sm"><p>{date(row.created_at)} / Aktor {row.actor_id} / {row.action}</p>{row.action === 'daily_limit' ? <p>{money(row.details.before)} menjadi {money(row.details.after)} / Versi {row.details.version}</p> : <p>{row.details.reason}</p>}</div>} />
      </>}
      {can('view-all') && <Panel title="Filter transaksi sekolah"><form className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3" onSubmit={form(v => setFilters(Object.fromEntries(Object.entries(v).filter(([, value]) => value))))}><Field label="Dari tanggal" name="from" type="date" required={false} /><Field label="Sebelum tanggal (eksklusif)" name="until" type="date" required={false} /><Field label="ID siswa" name="student_id" type="number" min="1" required={false} /><Field label="ID pedagang" name="merchant_id" type="number" min="1" required={false} /><label>Jenis<select name="kind" className="input-field"><option value="">Semua</option>{['payment', 'refund', 'cash_topup', 'gateway_topup', 'payout'].map(k => <option key={k}>{k}</option>)}</select></label><label>Status transaksi<select name="status" className="input-field"><option value="">Semua</option><option value="posted">posted</option><option value="refunded">refunded</option></select></label><button className={button}>Terapkan filter</button></form><p className="text-sm">Riwayat berisi transaksi posted atau pembayaran refunded. Status top up diperiksa melalui ID top up.</p></Panel>}
      {(selected || can('view-all')) && <Collection key={`history-${revision}`} title="Riwayat transaksi" path="transactions" params={can('view-all') ? filters : { student_id: Number(selected) }} render={row => <div className="flex flex-wrap justify-between gap-2 text-sm"><div><p className="font-medium">{row.details?.merchant_name || row.kind} / {money(row.amount)}</p><p>{date(row.created_at)} / Siswa {row.student_id || '-'} / Pedagang {row.merchant_id || '-'}</p></div><button className={button} disabled={busy} onClick={() => showReceipt(row.id)}>Lihat bukti</button></div>} />}
    </>}
    {tab === 'merchants' && can('manage-merchants') && <>
      <Panel title="Buat akun pedagang"><p>Pedagang menggunakan aplikasi mobile, bukan portal web.</p><form className="grid sm:grid-cols-2 gap-3" onSubmit={form(createMerchant)}><Field label="Nama pedagang" name="name" maxLength={100} /><Field label="ID akun pedagang yang sudah ada (opsional)" name="user_id" type="number" min="1" required={false} /><Field label="Email akun baru" name="email" type="email" maxLength={100} required={false} /><Field label="Kata sandi akun baru (minimal 12 karakter)" name="password" type="password" minLength={12} maxLength={128} required={false} autoComplete="new-password" /><button className="btn-primary" disabled={busy || disabled}>Buat pedagang</button></form></Panel>
      <Collection key={`merchants-${revision}`} title="Akun pedagang & QR" path="merchants" render={m => <div className="space-y-2"><p className="font-semibold">{m.name} / ID {m.id} / {m.active ? 'Aktif' : 'Nonaktif'}</p><p className="text-sm">Total {money(m.account.balance)} / tersedia {money(m.account.available)} / dicadangkan {money(m.account.reserved)}</p><p className="text-xs break-all">{m.qr_url}</p><div className="flex flex-wrap gap-2"><button className={button} disabled={busy} onClick={() => run(() => downloadQr(m))}>Unduh QR PNG</button><button className={button} disabled={busy} onClick={() => run(async () => { if (window.confirm(`${m.active ? 'Nonaktifkan' : 'Aktifkan'} pedagang ${m.name}?`)) { await request(`merchants/${m.id}`, 'patch', { active: !m.active }); setRevision(n => n + 1) } })}>{m.active ? 'Nonaktifkan' : 'Aktifkan'}</button><button className={button} disabled={busy} onClick={() => run(async () => { if (window.confirm('Cabut QR lama? QR cetak lama tidak dapat digunakan lagi.')) { await request(`merchants/${m.id}`, 'patch', { rotate_qr: true }); setRevision(n => n + 1) } })}>Ganti QR</button></div></div>} />
    </>}
    {tab === 'payouts' && can('process-payout') && <Collection key={`payouts-${revision}`} title="Pencairan pedagang" path="payouts" render={p => <div className="space-y-2"><p className="font-semibold">Pedagang {p.merchant_id} / {money(p.amount)} / {p.status}</p><p>{p.method}: {p.destination}</p><p className="text-sm">{p.id} / {date(p.created_at)}{p.paid_at && ` / Dibayar ${date(p.paid_at)} / ${p.proof}`}</p><div className="flex flex-wrap gap-2">{(p.status === 'requested' ? [['processing', 'Mulai proses'], ['reject', 'Tolak'], ['cancel', 'Batalkan']] : p.status === 'processing' ? [['paid', 'Tandai dibayar'], ['cancel', 'Batalkan proses']] : []).map(([id, label]) => <button key={id} className={button} disabled={busy} onClick={() => setAction({ type: 'payout', row: p, id, label })}>{label}</button>)}</div></div>} />}
    {tab === 'cases' && can('handle-cases') && <Collection key={`cases-${revision}`} title="Kasus reversal gateway" path="cases" render={c => <div className="space-y-2"><p className="font-semibold">Siswa {c.student_id} / {c.status}</p><p>Reversal {money(c.reversed_total)} / diselesaikan {money(c.resolved_total)} / eksposur {money(c.reversed_total - c.resolved_total)}</p><p className="text-sm">Top up {c.topup_id} / {date(c.created_at)}</p>{c.status === 'open' && <button className={button} disabled={busy} onClick={() => setAction({ type: 'case', row: c, label: 'Selesaikan kasus' })}>Selesaikan kasus</button>}</div>} />}
    {action && <Panel title={action.label}><p className="break-all">{action.row.id}</p><form className="space-y-3" onSubmit={form(async v => { if (!window.confirm(`${action.label}? Tindakan ini dicatat dalam audit.`)) return; if (action.type === 'case') await mutate(`cases/${action.row.id}/resolve`, v); else await mutate(`payouts/${action.row.id}/${action.id}`, { ...v, ...(v.no_external_payment ? { no_external_payment: true } : {}) }); setAction(null); setNotice('Tindakan berhasil dicatat.') })}>
      {action.type === 'case' ? <><p>Penyelesaian mencatat jurnal kompensasi; tidak mengambil saldo pedagang.</p><label>Penyelesaian<select name="resolution" className="input-field"><option value="cash_recovered">Dana tunai telah diterima kembali</option><option value="school_loss">Kerugian ditanggung sekolah</option></select></label><Field label="Bukti penyelesaian / persetujuan" name="proof" maxLength={500} /></> : <><p>Nominal tetap {money(action.row.amount)}. Pastikan likuiditas sekolah. Transfer dilakukan di luar sistem; jangan transfer ulang jika hasil belum jelas.</p>{action.id === 'paid' && <Field label="Referensi / bukti pembayaran eksternal" name="proof" maxLength={500} />}{['cancel', 'reject'].includes(action.id) && <Field label="Alasan" name="reason" maxLength={500} />}{action.id === 'cancel' && action.row.status === 'processing' && <label className="flex gap-2"><input required type="checkbox" name="no_external_payment" />Saya telah memastikan tidak ada pembayaran eksternal.</label>}</>}
      <button className="btn-primary" disabled={busy}>{action.label}</button><button className={button} type="button" disabled={busy} onClick={() => setAction(null)}>Tutup</button>
    </form></Panel>}
  </div>
}
