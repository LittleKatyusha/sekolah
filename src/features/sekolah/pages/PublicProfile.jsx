import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  School,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Award,
  ChevronRight,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Compass,
  ArrowRight,
  LogIn,
  CheckCircle2,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { ppdbPublicService } from '../../ppdb/services/ppdbService'
import { getTenantFromHostname } from '../../../utils/api'

export const getSubdomain = () => {
  if (typeof window === 'undefined') return null
  const searchParams = new URLSearchParams(window.location.search)
  const param = searchParams.get('subdomain') || searchParams.get('tenant') || searchParams.get('sekolah') || searchParams.get('identifier')
  if (param) return param.toLowerCase().trim()

  const tenant = getTenantFromHostname(window.location.hostname)
  if (tenant && tenant !== 'app' && tenant !== 'www') {
    return tenant.toLowerCase().trim()
  }

  return import.meta.env.VITE_DEV_SUBDOMAIN || null
}

const HARI_MAP = {
  MON: 'Senin',
  TUE: 'Selasa',
  WED: 'Rabu',
  THU: 'Kamis',
  FRI: 'Jumat',
  SAT: 'Sabtu',
  SUN: 'Minggu',
}

const PENDIDIKAN_MAP = {
  1: 'SD / Sederajat',
  2: 'SMP / Sederajat',
  3: 'SMA / Sederajat',
  4: 'Diploma (D3/D4)',
  5: 'Sarjana (S1)',
  6: 'Magister (S2)',
  7: 'Doktor (S3)',
}

const PublicProfile = () => {
  const [searchParams] = useSearchParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const currentIdentifier = searchParams.get('identifier') || searchParams.get('sekolah') || getSubdomain()

  const fetchProfileData = async (identifier) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: apiError } = await ppdbPublicService.getPublicProfile(identifier)
      if (apiError) {
        throw new Error(typeof apiError === 'string' ? apiError : (apiError.message || 'Gagal memuat profil sekolah'))
      }
      const payload = data?.data ?? data
      if (payload && (payload.id || payload.nama_sekolah)) {
        setProfile(payload)
      } else {
        throw new Error('Data profil tidak ditemukan')
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memuat data profil')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfileData(currentIdentifier)
  }, [currentIdentifier])

  // ponytail: dynamic DOM head injection covers JS-aware bots (Googlebot/Bingbot); add edge prerender worker when non-JS scrapers (WhatsApp/FB) demand server-rendered OG tags.
  useEffect(() => {
    if (!profile?.nama_sekolah) return

    const prevTitle = document.title
    const title = `Profil Sekolah — ${profile.nama_sekolah}`
    document.title = title

    const desc = `${profile.nama_sekolah} — Profil resmi lembaga pendidikan. ${profile.alamat ? profile.alamat + '. ' : ''}Informasi akademik, PPDB online, dan profil tenaga pendidik.`
    const canonicalUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''

    const setMeta = (attr, key, content) => {
      if (!content) return
      let el = document.querySelector(`meta[${attr}="${key}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('name', 'description', desc)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', desc)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('name', 'twitter:card', profile.logo_url ? 'summary_large_image' : 'summary')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', desc)

    if (profile.logo_url) {
      setMeta('property', 'og:image', profile.logo_url)
      setMeta('name', 'twitter:image', profile.logo_url)
    }

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', canonicalUrl)

    const schemaId = 'school-jsonld'
    let script = document.getElementById(schemaId)
    if (!script) {
      script = document.createElement('script')
      script.id = schemaId
      script.type = 'application/ld+json'
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'School',
      name: profile.nama_sekolah,
      description: desc,
      url: canonicalUrl,
      ...(profile.npsn ? { identifier: profile.npsn } : {}),
      ...(profile.logo_url ? { image: profile.logo_url } : {}),
      ...(profile.alamat ? {
        address: {
          '@type': 'PostalAddress',
          streetAddress: profile.alamat,
          addressCountry: 'ID',
        }
      } : {}),
    })

    return () => {
      document.title = prevTitle
      script?.remove()
    }
  }, [profile])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Memuat profil sekolah...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-800 p-8 text-center">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={30} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Gagal Memuat Profil</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{error || 'Profil sekolah tidak ditemukan.'}</p>
          <button
            onClick={() => fetchProfileData(currentIdentifier)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition"
          >
            <RefreshCw size={16} />
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  const { stats, settings, ppdb, jurusan = [], ekskul = [], guru = [] } = profile
  const ppdbActive = ppdb?.is_active && Array.isArray(ppdb?.gelombang) && ppdb.gelombang.length > 0
  const activeGelombang = ppdbActive ? ppdb.gelombang[0] : null
  const ppdbLink = `/ppdb/portal${profile.identifier ? `?sekolah=${profile.identifier}` : ''}`

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-slate-800 dark:text-slate-100 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-slate-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {profile.logo_url ? (
              <img src={profile.logo_url} alt={profile.nama_sekolah} className="w-10 h-10 rounded-xl object-contain border border-slate-200 dark:border-gray-700" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center shadow-md font-bold shrink-0">
                <School size={22} />
              </div>
            )}
            <div className="truncate">
              <h1 className="text-base font-bold text-slate-900 dark:text-white truncate">{profile.nama_sekolah}</h1>
              {profile.npsn && <p className="text-xs text-slate-500 dark:text-slate-400">NPSN: {profile.npsn}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={ppdbLink} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition">
              <GraduationCap size={15} />
              <span>PPDB Online</span>
            </Link>
            <Link to="/login" className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-200 transition">
              <LogIn size={15} />
              <span>Login</span>
            </Link>
          </div>
        </div>
      </header>
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-900 via-primary-800 to-indigo-950 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-primary-200 mb-4">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Profil Resmi Lembaga Pendidikan</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
              {profile.nama_sekolah}
            </h1>
            {profile.alamat && (
              <p className="flex items-start gap-2 text-sm sm:text-base text-primary-100/90 mb-6 leading-relaxed">
                <MapPin size={18} className="shrink-0 mt-0.5 text-primary-300" />
                <span>{profile.alamat}</span>
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={ppdbLink}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary-900 font-semibold text-sm shadow-lg hover:bg-primary-50 transition"
              >
                <GraduationCap size={18} className="text-primary-600" />
                <span>Daftar Peserta Didik Baru</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* PPDB Alert Banner */}
      {ppdbActive && (
        <div className="bg-emerald-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
              <span className="font-semibold">PPDB Dibuka:</span>
              <span>{activeGelombang?.nama_gelombang || 'Gelombang Aktif'}</span>
            </div>
            <Link to={ppdbLink} className="inline-flex items-center gap-1 font-semibold underline hover:opacity-90 transition text-xs sm:text-sm">
              <span>Daftar Sekarang</span>
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Stats Counter */}
      <section className="-mt-6 relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-gray-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"><Users size={22} /></div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{stats?.total_siswa ?? 0}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Siswa</div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-gray-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"><Award size={22} /></div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{stats?.total_guru ?? 0}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Guru</div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-gray-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"><BookOpen size={22} /></div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{stats?.total_kelas ?? 0}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kelas</div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-gray-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"><Compass size={22} /></div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{stats?.total_jurusan ?? jurusan.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Jurusan</div>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-gray-800 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"><Sparkles size={22} /></div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{stats?.total_ekskul ?? ekskul.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ekskul</div>
            </div>
          </div>
        </div>
      </section>
      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 flex-1">
        {/* Jam Operasional */}
        {settings && (settings.jam_masuk_sekolah || settings.timezone) && (
          <section className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-gray-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Clock size={18} className="text-primary-600" />
              <span>Informasi Operasional Sekolah</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {settings.jam_masuk_sekolah && settings.jam_pulang_sekolah && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Jam Belajar</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {settings.jam_masuk_sekolah} - {settings.jam_pulang_sekolah} WIB
                  </span>
                </div>
              )}
              {settings.timezone && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Zona Waktu</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{settings.timezone}</span>
                </div>
              )}
              {settings.lokasi_sekolah_latitude && settings.lokasi_sekolah_longitude && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-100 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Koordinat</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      {settings.lokasi_sekolah_latitude}, {settings.lokasi_sekolah_longitude}
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${settings.lokasi_sekolah_latitude},${settings.lokasi_sekolah_longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-primary-600 hover:text-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-700"
                    title="Buka Peta"
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Program Jurusan */}
        {jurusan.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Program Keahlian & Jurusan</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pilihan program keahlian untuk mengasah potensi siswa</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jurusan.map((j) => (
                <div key={j.id} className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-gray-800">
                  <div className="inline-flex items-center px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold text-xs mb-2">
                    {j.kode}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{j.nama}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                    {j.deskripsi || 'Program pendidikan terstruktur dengan kurikulum terpadu.'}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        {/* Ekstrakurikuler */}
        {ekskul.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ekstrakurikuler & Minat Bakat</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Wadah kreativitas, olahraga, dan kepemimpinan</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ekskul.map((e) => (
                <div key={e.id} className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-gray-800 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{e.nama}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                      {e.deskripsi || 'Kegiatan pembinaan minat dan bakat peserta didik.'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-gray-800 flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
                    {e.hari && (
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-primary-500" />
                        <span>Hari: <strong className="text-slate-700 dark:text-slate-200">{HARI_MAP[e.hari] || e.hari}</strong></span>
                      </div>
                    )}
                    {e.jam_mulai && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-primary-500" />
                        <span>Pukul: <strong className="text-slate-700 dark:text-slate-200">{e.jam_mulai.slice(0, 5)} - {e.jam_selesai ? e.jam_selesai.slice(0, 5) : 'selesai'}</strong></span>
                      </div>
                    )}
                    {e.lokasi && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-primary-500" />
                        <span>Lokasi: <strong className="text-slate-700 dark:text-slate-200">{e.lokasi}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Guru */}
        {guru.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tenaga Pendidik</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Didukung oleh dewan guru dan pendidik berdedikasi</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {guru.map((g) => (
                <div key={g.id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-gray-800 text-center flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm mb-2">
                    {g.nama ? g.nama.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2 mb-1">{g.nama}</div>
                  {g.pendidikan_terakhir && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {PENDIDIKAN_MAP[g.pendidikan_terakhir] || 'Pendidik'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA PPDB */}
        <section className="bg-gradient-to-r from-primary-700 to-indigo-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-extrabold mb-2 text-white">Siap Bergabung dengan {profile.nama_sekolah}?</h2>
            <p className="text-primary-100 text-xs sm:text-sm mb-5">
              Pendaftaran peserta didik baru dapat dilakukan secara online melalui portal PPDB resmi.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link to={ppdbLink} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary-900 font-bold text-xs shadow hover:bg-primary-50 transition">
                <CheckCircle2 size={16} className="text-primary-600" />
                <span>Pendaftaran PPDB</span>
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-800/80 hover:bg-primary-800 border border-white/20 text-white font-medium text-xs transition">
                <span>Login Portal Sekolah</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <p>© {new Date().getFullYear()} {profile.nama_sekolah}. Seluruh hak cipta dilindungi.</p>
            {profile.npsn && <p className="mt-0.5">NPSN: {profile.npsn}</p>}
          </div>
          <div className="flex items-center gap-4">
            <Link to={ppdbLink} className="hover:text-primary-600 transition">Portal PPDB</Link>
            <Link to="/login" className="hover:text-primary-600 transition">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicProfile
