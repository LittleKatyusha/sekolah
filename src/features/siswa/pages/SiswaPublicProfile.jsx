import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { GraduationCap } from 'lucide-react'
import { getBaseURL } from '../../../utils/api'

export default function SiswaPublicProfile() {
  const { token } = useParams()
  const [result, setResult] = useState({ token: null, data: null, error: '' })

  useEffect(() => {
    const controller = new AbortController()
    // Public request deliberately bypasses auth/refresh interceptors and tenant headers.
    axios.get(`${getBaseURL()}/public/siswa/${encodeURIComponent(token)}`, {
      signal: controller.signal,
      timeout: 15000,
      withCredentials: false,
      headers: { Accept: 'application/json' },
    }).then(({ data }) => {
      if (!data?.success || !data.data) throw new Error('Profil tidak tersedia')
      if (!controller.signal.aborted) setResult({ token, data: data.data, error: '' })
    }).catch((error) => {
      if (controller.signal.aborted) return
      setResult({ token, data: null, error: error.response?.status === 404
        ? 'Profil siswa tidak ditemukan atau tautan QR tidak valid.'
        : 'Profil belum dapat dimuat. Silakan muat ulang halaman.' })
    })
    return () => controller.abort()
  }, [token])

  const loading = result.token !== token
  const profile = !loading && result.data

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <meta name="robots" content="noindex, nofollow, noarchive" />
      <meta name="referrer" content="no-referrer" />
      <section className="mx-auto max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="bg-primary-700 px-6 py-8 text-center text-white">
          <GraduationCap size={40} className="mx-auto mb-3" aria-hidden="true" />
          <h1 className="text-xl font-bold">Profil Publik Siswa</h1>
          <p className="mt-1 text-sm">Kartu Pelajar Digital · Akademihub</p>
        </header>
        <div className="p-6">
          {loading && <p role="status">Memuat profil siswa...</p>}
          {!loading && result.error && <p role="alert" className="text-red-700">{result.error}</p>}
          {profile && (
            <>
              <h2 className="break-words text-center text-2xl font-bold">{profile.nama}</h2>
              <dl className="mt-6 space-y-4">
                {[
                  ['Sekolah', profile.sekolah],
                  ['Kelas', profile.kelas],
                  ['Tahun Ajaran', profile.tahun_ajaran],
                  ['Status Siswa', profile.status],
                ].map(([label, value]) => (
                  <div key={label} className="border-b border-slate-100 pb-3">
                    <dt className="text-sm text-slate-500">{label}</dt>
                    <dd className="break-words font-medium">{value || '-'}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          <p className="mt-6 text-xs leading-relaxed text-slate-500">
            Halaman ini hanya menampilkan informasi terbatas untuk identifikasi kartu pelajar. Data sensitif siswa tidak ditampilkan.
          </p>
        </div>
      </section>
    </main>
  )
}