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
  BookOpen,
} from 'lucide-react'
import { raporVerificationService } from '../services/raporVerificationService'

export const RaporVerificationPage = () => {
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
        const res = await raporVerificationService.verify(token)
        if (!active) return
        if (res.error || !res.data?.success) {
          setError(res.error?.message || res.data?.message || 'Dokumen Rapor tidak ditemukan atau barcode verifikasi tidak valid.')
        } else {
          setData(res.data.data)
        }
      } catch (err) {
        if (!active) return
        setError(err.response?.data?.message || err.message || 'Gagal memverifikasi dokumen rapor.')
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
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white">AkademiHub</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Portal Verifikasi E-Rapor Resmi</p>
          </div>
        </div>
        {data && (
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition"
          >
            <Printer className="w-4 h-4 text-blue-600" /> Cetak Bukti
          </button>
        )}
      </header>

      <main className="max-w-3xl mx-auto">
        {loading && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-10 text-center border border-gray-200 dark:border-gray-800">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <h2 className="text-base font-bold">Memverifikasi Dokumen Rapor...</h2>
            <p className="text-xs text-gray-500 mt-1">Memvalidasi tanda tangan digital dan data capaian belajar siswa.</p>
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
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/40 text-xs font-bold uppercase tracking-wider mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi Asli
                  </div>
                  <h2 className="text-xl font-extrabold">LAPORAN HASIL BELAJAR (E-RAPOR) VALID</h2>
                  <p className="text-xs text-blue-100 mt-0.5">Nomor: {data.nomor_dokumen || '-'}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Identitas Sekolah */}
              <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 tracking-wider mb-3">
                  <School className="w-4 h-4 text-blue-600" /> Satuan Pendidikan
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 block">Nama Sekolah</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{data.sekolah?.nama}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">NPSN</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{data.sekolah?.npsn || '-'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs text-gray-500 block">Alamat</span>
                    <span className="text-xs text-gray-700 dark:text-gray-300">{data.sekolah?.alamat || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Identitas Siswa */}
              <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 tracking-wider mb-3">
                  <User className="w-4 h-4 text-blue-600" /> Peserta Didik
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 block">Nama Lengkap</span>
                    <span className="font-bold text-gray-900 dark:text-white">{data.siswa?.nama}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Kelas / Rombel</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{data.siswa?.kelas}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Nomor Induk Siswa (NIS)</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">{data.siswa?.nis}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">NISN</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">{data.siswa?.nisn || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Semester & Tahun Ajaran</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{data.semester} &bull; {data.tahun_ajaran}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Status Dokumen</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      {data.status || 'PUBLISHED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rekapitulasi Capaian */}
              {data.rekap && (
                <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500 tracking-wider mb-3">
                    <Award className="w-4 h-4 text-blue-600" /> Rekapitulasi Nilai & Kehadiran
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-center">
                      <span className="text-xs text-gray-500 block">Rata-Rata</span>
                      <span className="text-lg font-extrabold text-blue-600">{Number(data.rekap.rata_rata || 0).toFixed(2)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-center">
                      <span className="text-xs text-gray-500 block">Total Nilai</span>
                      <span className="text-lg font-extrabold text-gray-900 dark:text-white">{Number(data.rekap.total_nilai || 0).toFixed(2)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-center">
                      <span className="text-xs text-gray-500 block">Sakit / Izin</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{data.rekap.sakit || 0} / {data.rekap.izin || 0} hr</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-center">
                      <span className="text-xs text-gray-500 block">Tanpa Ket.</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{data.rekap.tanpa_keterangan || 0} hr</span>
                    </div>
                  </div>
                  {data.rekap.catatan_wali && data.rekap.catatan_wali !== '-' && (
                    <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-xs">
                      <span className="font-semibold text-blue-900 dark:text-blue-300 block mb-1">Catatan Wali Kelas:</span>
                      <p className="text-gray-700 dark:text-gray-300 italic">{data.rekap.catatan_wali}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Pengesahan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 block mb-1">Wali Kelas:</span>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{data.wali_kelas?.nama || '-'}</p>
                  {data.wali_kelas?.nip && data.wali_kelas.nip !== '-' && (
                    <p className="text-gray-500">NIP. {data.wali_kelas.nip}</p>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 block mb-1">Kepala Sekolah:</span>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{data.kepala_sekolah?.nama || 'Kepala Sekolah'}</p>
                  {data.kepala_sekolah?.nip && data.kepala_sekolah.nip !== '-' && (
                    <p className="text-gray-500">NIP. {data.kepala_sekolah.nip}</p>
                  )}
                </div>
              </div>

              {/* Footer verifikasi */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <Lock className="w-3.5 h-3.5" /> Privasi Terlindungi: NIK, alamat lengkap, dan nomor kontak tidak dipublikasikan.
                </span>
                <span>Terverifikasi: {data.verified_at ? new Date(data.verified_at).toLocaleString('id-ID') : '-'}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default RaporVerificationPage
