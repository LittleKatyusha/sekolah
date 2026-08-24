import { useState, useEffect } from 'react'
import {
  Search, Send, CheckCircle, XCircle, Clock, Info,
  GraduationCap, FileText, User, Mail, Phone, School,
  Lock, CreditCard, Upload, ChevronRight, AlertCircle,
} from 'lucide-react'
import { ppdbPublicService } from '../services/ppdbService'

const TABS = [
  { id: 'daftar', label: 'Pendaftaran Mandiri', icon: FileText },
  { id: 'status', label: 'Cek Status', icon: Search },
]

const STATUS_MAP = {
  draft:        { label: 'Draft',           icon: Clock,         color: 'text-gray-600',   bg: 'bg-gray-100 dark:bg-gray-800',         border: 'border-gray-200 dark:border-gray-700' },
  terverifikasi:{ label: 'Terverifikasi',   icon: CheckCircle,   color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20',        border: 'border-blue-200 dark:border-blue-800' },
  seleksi:      { label: 'Dalam Seleksi',   icon: Clock,         color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20',    border: 'border-yellow-200 dark:border-yellow-800' },
  diterima:     { label: 'Diterima',        icon: CheckCircle,   color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/20',      border: 'border-green-200 dark:border-green-800' },
  cadangan:     { label: 'Cadangan',        icon: Info,          color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20',    border: 'border-orange-200 dark:border-orange-800' },
  ditolak:      { label: 'Tidak Diterima',  icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-900/20',          border: 'border-red-200 dark:border-red-800' },
}

// ─── Shared ──────────────────────────────────────────────────────────────────

const inputBase = 'w-full px-3 py-2.5 border rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none text-sm transition-colors placeholder-gray-400 dark:placeholder-gray-500'
const fieldClass = (errors, name) =>
  `${inputBase} ${errors[name] ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-200 dark:border-gray-700'}`

const FieldError = ({ msg }) => msg
  ? <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11} />{msg}</p>
  : null

const Label = ({ children, required }) => (
  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
    {children}{required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
)

// ─── Tab: Form Pendaftaran ────────────────────────────────────────────────────

const INITIAL_FORM = {
  mst_sekolah_id: '',
  ppdb_gelombang_id: '',
  nama_lengkap: '',
  email: '',
  password: '',
  nisn: '',
  jenis_kelamin: '',
  telp_hp: '',
  asal_sekolah: '',
}

const INITIAL_FILES = {
  kartukeluarga: null,
  akte: null,
  rapor: null,
  ijazah: null,
}

const DOC_LIST = [
  { name: 'kartukeluarga', label: 'Kartu Keluarga' },
  { name: 'akte',          label: 'Akte Kelahiran' },
  { name: 'rapor',         label: 'Rapor' },
  { name: 'ijazah',        label: 'Ijazah' },
]

const DaftarTab = () => {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [files, setFiles] = useState(INITIAL_FILES)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [sekolahOptions, setSekolahOptions] = useState([])
  const [sekolahLoading, setSekolahLoading] = useState(true)
  const [gelombangOptions, setGelombangOptions] = useState([])
  const [gelombangLoading, setGelombangLoading] = useState(false)

  useEffect(() => {
    ppdbPublicService.getSekolahList().then(({ data }) => {
      const list = data?.data ?? data
      setSekolahOptions(Array.isArray(list) ? list : [])
      setSekolahLoading(false)
    }).catch(() => setSekolahLoading(false))
  }, [])

  useEffect(() => {
    const sekolahId = formData.mst_sekolah_id
    if (!sekolahId) {
      setGelombangOptions([])
      setFormData((prev) => ({ ...prev, ppdb_gelombang_id: '' }))
      return
    }
    let cancelled = false
    setGelombangLoading(true)
    setGelombangOptions([])
    setFormData((prev) => ({ ...prev, ppdb_gelombang_id: '' }))
    ppdbPublicService.getActiveGelombang(sekolahId).then(({ data }) => {
      if (cancelled) return
      const list = data?.data ?? data
      setGelombangOptions(Array.isArray(list) ? list : [])
      setGelombangLoading(false)
    }).catch(() => { if (!cancelled) setGelombangLoading(false) })
    return () => { cancelled = true }
  }, [formData.mst_sekolah_id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target
    setFiles((prev) => ({ ...prev, [name]: fileList[0] || null }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!formData.mst_sekolah_id)       e.mst_sekolah_id    = 'Sekolah wajib dipilih'
    if (!formData.ppdb_gelombang_id)     e.ppdb_gelombang_id = 'Gelombang wajib dipilih'
    if (!formData.nama_lengkap.trim())   e.nama_lengkap      = 'Nama lengkap wajib diisi'
    if (!formData.email.trim())          e.email             = 'Email wajib diisi'
    if (!formData.jenis_kelamin)         e.jenis_kelamin     = 'Jenis kelamin wajib dipilih'
    if (!files.kartukeluarga)            e.kartukeluarga     = 'Wajib diunggah'
    if (!files.akte)                     e.akte              = 'Wajib diunggah'
    if (!files.rapor)                    e.rapor             = 'Wajib diunggah'
    if (!files.ijazah)                   e.ijazah            = 'Wajib diunggah'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setResult(null)
    const fd = new FormData()
    Object.entries(formData).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
    Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v) })
    const { data, error } = await ppdbPublicService.daftar(fd)
    if (data) {
      setResult(data.data ?? data)
      setFormData(INITIAL_FORM)
      setFiles(INITIAL_FILES)
      setErrors({})
    } else {
      if (error?.errors) setErrors(error.errors)
      else setErrors({ _global: error?.message || 'Pendaftaran gagal, silakan coba lagi' })
    }
    setLoading(false)
  }

  if (result) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Pendaftaran Berhasil!</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Simpan nomor pendaftaran Anda untuk memantau status</p>
        </div>
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-500 mb-2">Nomor Pendaftaran</p>
          <p className="text-4xl font-mono font-bold text-primary-700 dark:text-primary-300 tracking-widest">{result.no_pendaftaran}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 text-sm text-left">
          <div className="flex justify-between px-4 py-3">
            <span className="text-gray-500">Nama</span>
            <span className="font-medium text-gray-900 dark:text-white">{result.nama_lengkap}</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-900 dark:text-white">{result.email}</span>
          </div>
          {result.gelombang?.nama_gelombang && (
            <div className="flex justify-between px-4 py-3">
              <span className="text-gray-500">Gelombang</span>
              <span className="font-medium text-gray-900 dark:text-white">{result.gelombang.nama_gelombang}</span>
            </div>
          )}
          <div className="flex justify-between px-4 py-3">
            <span className="text-gray-500">Status</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 px-2.5 py-1 rounded-full">
              <Clock size={11} /> Menunggu Verifikasi
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400">Screenshot atau catat nomor pendaftaran Anda, lalu gunakan menu <strong>Cek Status</strong> untuk memantau perkembangan.</p>
        <button
          onClick={() => setResult(null)}
          className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Daftar Lagi
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors._global && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {errors._global}
        </div>
      )}

      {/* Section: Pilih Sekolah & Gelombang */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
          Tujuan Pendaftaran
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
          <div>
            <Label required>Sekolah Tujuan</Label>
            <select name="mst_sekolah_id" value={formData.mst_sekolah_id} onChange={handleChange} disabled={sekolahLoading} className={fieldClass(errors, 'mst_sekolah_id')}>
              <option value="">{sekolahLoading ? 'Memuat...' : '— Pilih Sekolah —'}</option>
              {sekolahOptions.map((s) => <option key={s.id} value={s.id}>{s.nama_sekolah}</option>)}
            </select>
            <FieldError msg={errors.mst_sekolah_id} />
          </div>
          <div>
            <Label required>Gelombang</Label>
            <select name="ppdb_gelombang_id" value={formData.ppdb_gelombang_id} onChange={handleChange} disabled={gelombangLoading || gelombangOptions.length === 0} className={fieldClass(errors, 'ppdb_gelombang_id')}>
              <option value="">{gelombangLoading ? 'Memuat...' : gelombangOptions.length === 0 ? '— Pilih sekolah dahulu —' : '— Pilih Gelombang —'}</option>
              {gelombangOptions.map((g) => <option key={g.id} value={g.id}>{g.nama_gelombang}</option>)}
            </select>
            <FieldError msg={errors.ppdb_gelombang_id} />
          </div>
        </div>
      </div>

      {/* Section: Data Diri */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
          Data Diri Calon Siswa
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="sm:col-span-2">
            <Label required>Nama Lengkap</Label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} placeholder="Sesuai akta kelahiran" className={`${fieldClass(errors, 'nama_lengkap')} pl-9`} />
            </div>
            <FieldError msg={errors.nama_lengkap} />
          </div>
          <div>
            <Label required>Email</Label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" className={`${fieldClass(errors, 'email')} pl-9`} />
            </div>
            <FieldError msg={errors.email} />
          </div>
          <div>
            <Label required>Jenis Kelamin</Label>
            <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} className={fieldClass(errors, 'jenis_kelamin')}>
              <option value="">— Pilih —</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
            <FieldError msg={errors.jenis_kelamin} />
          </div>
          <div>
            <Label>NISN</Label>
            <div className="relative">
              <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="nisn" value={formData.nisn} onChange={handleChange} placeholder="Nomor Induk Siswa Nasional" className={`${fieldClass(errors, 'nisn')} pl-9`} />
            </div>
          </div>
          <div>
            <Label>No. HP / WhatsApp</Label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="telp_hp" value={formData.telp_hp} onChange={handleChange} placeholder="08xxxxxxxxxx" className={`${fieldClass(errors, 'telp_hp')} pl-9`} />
            </div>
          </div>
          <div>
            <Label>Asal Sekolah</Label>
            <div className="relative">
              <School size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="asal_sekolah" value={formData.asal_sekolah} onChange={handleChange} placeholder="Nama sekolah asal" className={`${fieldClass(errors, 'asal_sekolah')} pl-9`} />
            </div>
          </div>
          <div>
            <Label>Password Akun</Label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 karakter (opsional)" className={`${fieldClass(errors, 'password')} pl-9`} />
            </div>
          </div>
        </div>
      </div>

      {/* Section: Dokumen */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
          Unggah Dokumen <span className="font-normal text-gray-400 normal-case tracking-normal ml-1">(PDF/gambar, maks. 2 MB)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
          {DOC_LIST.map(({ name, label }) => (
            <div key={name} className={`p-3 rounded-xl border-2 border-dashed transition-colors ${files[name] ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : errors[name] ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
              <div className="flex items-center gap-2 mb-2">
                {files[name]
                  ? <CheckCircle size={15} className="text-green-500 shrink-0" />
                  : <Upload size={15} className={`shrink-0 ${errors[name] ? 'text-red-400' : 'text-gray-400'}`} />
                }
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label} <span className="text-red-500">*</span></span>
              </div>
              {files[name]
                ? <p className="text-xs text-green-700 dark:text-green-400 truncate">{files[name].name}</p>
                : <p className="text-xs text-gray-400">Belum ada file dipilih</p>
              }
              <label className="mt-2 block">
                <input type="file" name={name} accept="image/*,application/pdf" onChange={handleFileChange} className="sr-only" />
                <span className="inline-block text-xs font-medium text-primary-600 dark:text-primary-400 cursor-pointer hover:underline">
                  {files[name] ? 'Ganti file' : 'Pilih file'}
                </span>
              </label>
              <FieldError msg={errors[name]} />
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary-500/20"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
            Mengirim Pendaftaran...
          </>
        ) : (
          <><Send size={16} /> Kirim Pendaftaran</>
        )}
      </button>
    </form>
  )
}

// ─── Tab: Cek Status ──────────────────────────────────────────────────────────

const CekStatusTab = () => {
  const [noPendaftaran, setNoPendaftaran] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCek = async (e) => {
    e.preventDefault()
    if (!noPendaftaran.trim() || !email.trim()) { setError('Nomor pendaftaran dan email wajib diisi'); return }
    setLoading(true)
    setError('')
    setStatus(null)
    const { data, error: apiErr } = await ppdbPublicService.cekStatus(noPendaftaran.trim(), email.trim())
    if (data) setStatus(data.data ?? data)
    else setError(apiErr?.message || 'Nomor pendaftaran tidak ditemukan')
    setLoading(false)
  }

  const statusInfo = status
    ? (STATUS_MAP[status.status_pendaftaran] ?? { label: status.status_pendaftaran, icon: Info, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' })
    : null
  const StatusIcon = statusInfo?.icon

  return (
    <div className="space-y-6">
      <div className="text-center py-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">Masukkan nomor pendaftaran yang Anda terima saat mendaftar</p>
      </div>

      <form onSubmit={handleCek} className="space-y-3">
        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={noPendaftaran}
            onChange={(e) => { setNoPendaftaran(e.target.value); setError('') }}
            placeholder="Contoh: PPDB-2026-001234"
            className={`${inputBase} pl-10 text-base font-mono tracking-wider ${error ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
          />
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError('') }}
          placeholder="Email saat pendaftaran"
          className={`${inputBase} text-base ${error ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
          required
        />
        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1.5"><AlertCircle size={14} />{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary-500/20"
        >
          {loading ? (
            <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Memeriksa...</>
          ) : (
            <><Search size={16} /> Cek Status Pendaftaran</>
          )}
        </button>
      </form>

      {status && statusInfo && (
        <div className={`rounded-2xl border ${statusInfo.border} ${statusInfo.bg} overflow-hidden`}>
          {/* Status Header */}
          <div className={`px-5 py-4 flex items-center gap-3 border-b ${statusInfo.border}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusInfo.bg}`}>
              <StatusIcon size={20} className={statusInfo.color} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Status Pendaftaran</p>
              <p className={`font-bold text-lg ${statusInfo.color}`}>{statusInfo.label}</p>
            </div>
          </div>
          {/* Detail */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50 text-sm">
            <div className="flex justify-between px-5 py-3.5">
              <span className="text-gray-500">No. Pendaftaran</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{status.no_pendaftaran}</span>
            </div>
            <div className="flex justify-between px-5 py-3.5">
              <span className="text-gray-500">Nama Pendaftar</span>
              <span className="font-semibold text-gray-900 dark:text-white">{status.nama_lengkap}</span>
            </div>
            {status.gelombang?.nama_gelombang && (
              <div className="flex justify-between px-5 py-3.5">
                <span className="text-gray-500">Gelombang</span>
                <span className="font-medium text-gray-900 dark:text-white">{status.gelombang.nama_gelombang}</span>
              </div>
            )}
            {status.tanggal_daftar && (
              <div className="flex justify-between px-5 py-3.5">
                <span className="text-gray-500">Tanggal Daftar</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(status.tanggal_daftar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PortalPpdb = () => {
  const [activeTab, setActiveTab] = useState('daftar')

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col items-center">
      {/* Hero */}
      <div className="w-full bg-gradient-to-r from-primary-700 to-primary-900 dark:from-primary-900 dark:to-gray-900">
        <div className="max-w-2xl mx-auto px-4 py-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Portal PPDB</h1>
          <p className="mt-2 text-primary-200 text-sm sm:text-base">Penerimaan Peserta Didik Baru — Daftar sekarang dan raih masa depan terbaik</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs">
            {[
              { icon: FileText, text: 'Pendaftaran Online' },
              { icon: CheckCircle, text: 'Verifikasi Cepat' },
              { icon: Search, text: 'Pantau Status Real-time' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-primary-200 bg-white/10 px-3 py-1.5 rounded-full">
                <Icon size={13} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-2xl px-4 py-8 space-y-5">
        {/* Tab Bar */}
        <div className="flex rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm p-1 gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === id
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 sm:p-7">
          {activeTab === 'daftar' && <DaftarTab />}
          {activeTab === 'status' && <CekStatusTab />}
        </div>

        {/* Note */}
        {activeTab === 'daftar' && (
          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-400">
            <Info size={15} className="shrink-0 mt-0.5" />
            <span>Pastikan data yang diisi sudah benar. Setelah mendaftar, Anda akan mendapat <strong>nomor pendaftaran</strong> untuk memantau status seleksi.</span>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 pb-4">
          &copy; {new Date().getFullYear()} <a href="https://akademihub.id/" className="text-primary-600 dark:text-primary-400">Akademihub</a> · Portal PPDB
        </p>
      </div>
    </div>
  )
}


export default PortalPpdb
