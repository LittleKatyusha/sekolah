import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { 
  ShieldCheck, 
  ShieldAlert, 
  Award, 
  School, 
  User, 
  CheckCircle2, 
  Printer, 
  Lock, 
  RefreshCw,
  GraduationCap
} from 'lucide-react'
import { sklVerificationService } from '../services/sklVerificationService'

export const SklVerificationPage = () => {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await sklVerificationService.verify(token)
        if (!active) return
        if (res.error || !res.data?.success) {
          setError(res.error?.message || res.data?.message || 'Dokumen SKL tidak ditemukan atau tanda tangan digital tidak valid.')
        } else {
          setData(res.data.data)
        }
      } catch (err) {
        if (!active) return
        setError(err.response?.data?.message || err.message || 'Gagal memverifikasi dokumen.')
      } finally {
        if (active) setLoading(false)
      }
    }
    if (token) run()
    else { setLoading(false); setError('Token verifikasi tidak ditemukan.') }
    return () => { active = false }
  }, [token])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 py-6 px-4 sm:px-6">
      <header className="max-w-3xl mx-auto flex items-center justify-between pb-4 mb-6 border-b border-gray-200 dark:border-gray-800 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">AkademiHub</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Portal Verifikasi SKL & Ijazah Resmi</p>
          </div>
        </div>
        {data && (
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition"
          >
            <Printer className="w-4 h-4 text-indigo-600" /> Cetak Bukti
          </button>
        )}
      </header>

      <main className="max-w-3xl mx-auto">
        {loading && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-10 text-center border border-gray-200 dark:border-gray-800">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <h2 className="text-base font-bold">Memverifikasi Dokumen SKL...</h2>
            <p className="text-xs text-gray-500 mt-1">Memvalidasi tanda tangan digital dan data kelulusan siswa.</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-8 text-center border border-red-200 dark:border-red-900/50">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <span className="px-2.5 py-0.5 text-xs font-bold text-red-700 bg-red-100 dark:bg-red-900/50 rounded-full">TIDAK VALID</span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-2">Dokumen Tidak Terverifikasi</h2>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-md mx-auto">{error}</p>
          </div>
        )}
        {!loading && data && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/40 text-xs font-bold uppercase tracking-wider mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi Asli
                  </div>
                  <h2 className="text-xl font-extrabold">SURAT KETERANGAN LULUS VALID</h2>
                  <p className="text-xs text-emerald-100 mt-0.5">Terdaftar resmi di pangkalan data kelulusan {data.sekolah?.nama}.</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-gray-800/50 rounded-xl text-xs border border-gray-200/60 dark:border-gray-700/50">
                <div><span className="text-gray-500 block">Nomor SKL:</span><span className="font-bold text-gray-900 dark:text-white">{data.nomor_surat}</span></div>
                <div><span className="text-gray-500 block">Status:</span><span className="font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">{data.status_kelulusan}</span></div>
                <div><span className="text-gray-500 block">Tahun Ajaran:</span><span className="font-semibold">{data.tahun_ajaran}</span></div>
                <div><span className="text-gray-500 block">Tanggal Terbit:</span><span className="font-semibold">{data.tanggal_terbit}</span></div>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <User className="w-4 h-4 text-indigo-600" /> Identitas Peserta Didik
                </h3>
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                  <div className="shrink-0 text-center">
                    <div className="w-28 h-36 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-sm">
                      {data.siswa?.foto_url ? (
                        <img src={data.siswa.foto_url} alt={data.siswa.nama} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-gray-400 text-center p-2"><User className="w-10 h-10 mx-auto" /><span className="text-[10px] block mt-1">Pas Foto 3x4</span></div>
                      )}
                    </div>
                  </div>
                  <dl className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="sm:col-span-2 pb-1.5 border-b border-gray-100 dark:border-gray-800">
                      <dt className="text-gray-500">Nama Lengkap</dt>
                      <dd className="text-base font-bold text-gray-900 dark:text-white">{data.siswa?.nama}</dd>
                    </div>
                    <div><dt className="text-gray-500">Nomor Induk Siswa (NIS)</dt><dd className="font-semibold">{data.siswa?.nis}</dd></div>
                    <div><dt className="text-gray-500">NISN</dt><dd className="font-semibold">{data.siswa?.nisn}</dd></div>
                    <div><dt className="text-gray-500">Tempat, Tgl Lahir</dt><dd className="font-semibold">{data.siswa?.tempat_lahir}, {data.siswa?.tanggal_lahir}</dd></div>
                    <div><dt className="text-gray-500">Jenis Kelamin</dt><dd className="font-semibold">{data.siswa?.jenis_kelamin}</dd></div>
                    <div><dt className="text-gray-500">Rombel / Kelas</dt><dd className="font-semibold">{data.siswa?.kelas}</dd></div>
                    <div><dt className="text-gray-500">Asal Satuan Pendidikan</dt><dd className="font-semibold">{data.siswa?.asal_sekolah}</dd></div>
                  </dl>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300">
                  <Lock className="w-4 h-4 shrink-0 text-blue-600" />
                  <span><strong>Privasi Terlindungi:</strong> NIK, nomor telepon, dan data pribadi sensitif tidak ditampilkan secara publik.</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-slate-50/50 dark:bg-gray-800/40">
                  <div className="flex items-center gap-1.5 font-bold mb-1"><School className="w-4 h-4 text-indigo-600" /> Satuan Pendidikan</div>
                  <p className="font-semibold">{data.sekolah?.nama}</p>
                  {data.sekolah?.npsn && <p className="text-gray-500">NPSN: {data.sekolah.npsn}</p>}
                  {data.sekolah?.alamat && <p className="text-gray-500">{data.sekolah.alamat}</p>}
                </div>
                <div className="p-3.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-slate-50/50 dark:bg-gray-800/40">
                  <div className="flex items-center gap-1.5 font-bold mb-1"><Award className="w-4 h-4 text-indigo-600" /> Kepala Sekolah</div>
                  <p className="font-bold underline">{data.kepala_sekolah?.nama}</p>
                  <p className="text-gray-500">NIP: {data.kepala_sekolah?.nip}</p>
                </div>
              </div>
            </div>
            <footer className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-center text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700">
              Dokumen resmi diterbitkan oleh {data.sekolah?.nama} &middot; Sistem Terverifikasi AkademiHub
            </footer>
          </div>
        )}
      </main>
    </div>
  )
}

export default SklVerificationPage
