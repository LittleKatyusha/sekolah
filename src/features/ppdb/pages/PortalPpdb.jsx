import { useState } from 'react'
import { Search, Send, CheckCircle, XCircle, Clock, Info, BookOpen } from 'lucide-react'
import { ppdbPublicService } from '../services/ppdbService'

const TABS = [
  { id: 'gelombang', label: 'Gelombang Aktif', icon: BookOpen },
  { id: 'daftar', label: 'Pendaftaran Mandiri', icon: Send },
  { id: 'status', label: 'Cek Status', icon: Search },
]

const STATUS_MAP = {
  draft: { label: 'Draft', icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-800' },
  terverifikasi: { label: 'Terverifikasi', icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  seleksi: { label: 'Dalam Seleksi', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  diterima: { label: 'Diterima', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  cadangan: { label: 'Cadangan', icon: Info, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ditolak: { label: 'Tidak Diterima', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
}

// ─── Tab: Gelombang Aktif ────────────────────────────────────────────────────

const GelombangTab = () => {
  const [sekolahId, setSekolahId] = useState('')
  const [gelombang, setGelombang] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCari = async (e) => {
    e.preventDefault()
    if (!sekolahId.trim()) {
      setError('ID Sekolah wajib diisi')
      return
    }
    setLoading(true)
    setError('')
    setGelombang(null)
    const { data, error: apiErr } = await ppdbPublicService.getActiveGelombang(sekolahId)
    if (data) {
      setGelombang(data.data ?? data)
    } else {
      setError(apiErr?.message || 'Tidak ada gelombang aktif saat ini')
    }
    setLoading(false)
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'

  return (
    <div className="space-y-6">
      <form onSubmit={handleCari} className="flex flex-col sm:flex-row gap-3">
        <input
          type="number"
          value={sekolahId}
          onChange={(e) => setSekolahId(e.target.value)}
          placeholder="Masukkan ID Sekolah"
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? 'Mencari...' : 'Cari Gelombang'}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {gelombang && (
        <div className="p-6 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 space-y-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold text-lg">
            <CheckCircle size={22} />
            {gelombang.nama_gelombang}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Tanggal Mulai</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatDate(gelombang.tanggal_mulai)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Tanggal Selesai</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatDate(gelombang.tanggal_selesai)}</p>
            </div>
            {gelombang.biaya_pendaftaran !== undefined && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Biaya Pendaftaran</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {gelombang.biaya_pendaftaran > 0
                    ? `Rp ${Number(gelombang.biaya_pendaftaran).toLocaleString('id-ID')}`
                    : 'Gratis'}
                </p>
              </div>
            )}
            {gelombang.kuota && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Kuota</p>
                <p className="font-medium text-gray-900 dark:text-white">{gelombang.kuota} siswa</p>
              </div>
            )}
          </div>
          {gelombang.keterangan && (
            <p className="text-sm text-gray-600 dark:text-gray-400 border-t border-green-200 dark:border-green-800 pt-4">
              {gelombang.keterangan}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Form Pendaftaran ───────────────────────────────────────────────────

const INITIAL_FORM = {
  mst_sekolah_id: '',
  ppdb_gelombang_id: '',
  nama_lengkap: '',
  email: '',
  nisn: '',
  jenis_kelamin: '',
  telp_hp: '',
  asal_sekolah: '',
}

const DaftarTab = () => {
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!formData.mst_sekolah_id) e.mst_sekolah_id = 'ID Sekolah wajib diisi'
    if (!formData.ppdb_gelombang_id) e.ppdb_gelombang_id = 'ID Gelombang wajib diisi'
    if (!formData.nama_lengkap.trim()) e.nama_lengkap = 'Nama lengkap wajib diisi'
    if (!formData.email.trim()) e.email = 'Email wajib diisi'
    if (!formData.jenis_kelamin) e.jenis_kelamin = 'Jenis kelamin wajib dipilih'
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

    const { data, error } = await ppdbPublicService.daftar(fd)
    if (data) {
      setResult(data.data ?? data)
      setFormData(INITIAL_FORM)
      setErrors({})
    } else {
      if (error?.errors) {
        setErrors(error.errors)
      } else {
        setErrors({ _global: error?.message || 'Pendaftaran gagal, silakan coba lagi' })
      }
    }
    setLoading(false)
  }

  if (result) {
    return (
      <div className="p-6 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 space-y-4 text-center">
        <CheckCircle size={48} className="text-green-600 mx-auto" />
        <h3 className="text-xl font-bold text-green-800 dark:text-green-300">Pendaftaran Berhasil!</h3>
        <p className="text-gray-600 dark:text-gray-400">Simpan nomor pendaftaran Anda untuk memantau status:</p>
        <div className="text-3xl font-mono font-bold text-primary-600 dark:text-primary-400 tracking-widest py-2">
          {result.no_pendaftaran}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>Nama: <span className="font-medium text-gray-900 dark:text-white">{result.nama_lengkap}</span></p>
          <p>Email: <span className="font-medium text-gray-900 dark:text-white">{result.email}</span></p>
        </div>
        <button
          onClick={() => setResult(null)}
          className="mt-4 px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Daftar Lagi
        </button>
      </div>
    )
  }

  const fieldClass = (name) =>
    `w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm ${errors[name] ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors._global && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 dark:text-red-400 text-sm">
          {errors._global}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Sekolah *</label>
          <input type="number" name="mst_sekolah_id" value={formData.mst_sekolah_id} onChange={handleChange} placeholder="ID Sekolah" className={fieldClass('mst_sekolah_id')} />
          {errors.mst_sekolah_id && <p className="mt-1 text-xs text-red-500">{errors.mst_sekolah_id}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Gelombang *</label>
          <input type="number" name="ppdb_gelombang_id" value={formData.ppdb_gelombang_id} onChange={handleChange} placeholder="ID Gelombang" className={fieldClass('ppdb_gelombang_id')} />
          {errors.ppdb_gelombang_id && <p className="mt-1 text-xs text-red-500">{errors.ppdb_gelombang_id}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap *</label>
          <input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} placeholder="Masukkan nama lengkap sesuai akta" className={fieldClass('nama_lengkap')} />
          {errors.nama_lengkap && <p className="mt-1 text-xs text-red-500">{errors.nama_lengkap}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" className={fieldClass('email')} />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenis Kelamin *</label>
          <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleChange} className={fieldClass('jenis_kelamin')}>
            <option value="">-- Pilih --</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
          {errors.jenis_kelamin && <p className="mt-1 text-xs text-red-500">{errors.jenis_kelamin}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NISN</label>
          <input type="text" name="nisn" value={formData.nisn} onChange={handleChange} placeholder="Nomor Induk Siswa Nasional" className={fieldClass('nisn')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. HP / WA</label>
          <input type="text" name="telp_hp" value={formData.telp_hp} onChange={handleChange} placeholder="08xxxxxxxxxx" className={fieldClass('telp_hp')} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asal Sekolah</label>
          <input type="text" name="asal_sekolah" value={formData.asal_sekolah} onChange={handleChange} placeholder="Nama sekolah asal" className={fieldClass('asal_sekolah')} />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Send size={18} />
          {loading ? 'Mendaftar...' : 'Kirim Pendaftaran'}
        </button>
      </div>
    </form>
  )
}

// ─── Tab: Cek Status ─────────────────────────────────────────────────────────

const CekStatusTab = () => {
  const [noPendaftaran, setNoPendaftaran] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCek = async (e) => {
    e.preventDefault()
    if (!noPendaftaran.trim()) {
      setError('Nomor pendaftaran wajib diisi')
      return
    }
    setLoading(true)
    setError('')
    setStatus(null)
    const { data, error: apiErr } = await ppdbPublicService.cekStatus(noPendaftaran.trim())
    if (data) {
      setStatus(data.data ?? data)
    } else {
      setError(apiErr?.message || 'Nomor pendaftaran tidak ditemukan')
    }
    setLoading(false)
  }

  const statusInfo = status ? (STATUS_MAP[status.status_pendaftaran] ?? { label: status.status_pendaftaran, icon: Info, color: 'text-gray-600', bg: 'bg-gray-50' }) : null
  const StatusIcon = statusInfo?.icon

  return (
    <div className="space-y-6">
      <form onSubmit={handleCek} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={noPendaftaran}
          onChange={(e) => setNoPendaftaran(e.target.value)}
          placeholder="Masukkan nomor pendaftaran"
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? 'Memeriksa...' : 'Cek Status'}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {status && statusInfo && (
        <div className={`p-6 rounded-xl border ${statusInfo.bg} space-y-4`}>
          <div className={`flex items-center gap-3 ${statusInfo.color} font-semibold text-lg`}>
            <StatusIcon size={24} />
            {statusInfo.label}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">No. Pendaftaran</p>
              <p className="font-mono font-bold text-gray-900 dark:text-white">{status.no_pendaftaran}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Nama</p>
              <p className="font-medium text-gray-900 dark:text-white">{status.nama_lengkap}</p>
            </div>
            {status.gelombang && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Gelombang</p>
                <p className="font-medium text-gray-900 dark:text-white">{status.gelombang}</p>
              </div>
            )}
            {status.tanggal_daftar && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">Tanggal Daftar</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {new Date(status.tanggal_daftar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const PortalPpdb = () => {
  const [activeTab, setActiveTab] = useState('gelombang')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portal PPDB</h1>
          <p className="text-gray-500 dark:text-gray-400">Penerimaan Peserta Didik Baru</p>
        </div>

        {/* Tab Bar */}
        <div className="flex rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-primary-600 text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          {activeTab === 'gelombang' && <GelombangTab />}
          {activeTab === 'daftar' && <DaftarTab />}
          {activeTab === 'status' && <CekStatusTab />}
        </div>
      </div>
    </div>
  )
}

export default PortalPpdb
