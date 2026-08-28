import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogIn, User, Lock, Eye, EyeOff, BookOpen, Users, Award, TrendingUp, AlertCircle } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'
import { apiService } from '../utils/api'
import logoVertical from '../assets/logo akademihub-01-04.png'

const REMEMBER_ME_KEY = 'login_remember_me'

const getSavedCredentials = () => {
  try {
    const saved = localStorage.getItem(REMEMBER_ME_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // ignore parse errors
  }
  return null
}

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username wajib diisi').max(100, 'Username maksimal 100 karakter').regex(/^[A-Za-z0-9._-]+$/, 'Format username tidak valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
})

const FEATURES = [
  { icon: BookOpen,   text: 'Manajemen kurikulum & materi pembelajaran' },
  { icon: Users,      text: 'Data siswa, guru, dan staf terpusat' },
  { icon: Award,      text: 'Pelaporan nilai & rapor otomatis' },
  { icon: TrendingUp, text: 'Analitik performa sekolah real-time' },
]

const STATS = [
  { label: 'Siswa Aktif',     value: '2.400+' },
  { label: 'Tenaga Pengajar', value: '120+' },
  { label: 'Mata Pelajaran',  value: '48' },
]

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const savedCredentials = getSavedCredentials()
  const [rememberMe, setRememberMe] = useState(!!savedCredentials)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: savedCredentials?.username || '',
      password: '',
    },
  })

  const onSubmit = async (data) => {
    setLoading(true)
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({ username: data.username }))
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY)
    }

    try {
      const { data: response, error: apiError } = await apiService.post('/auth/login', {
        username: data.username,
        password: data.password,
      })

      if (apiError) {
        setError(apiError.message || apiError.error || 'Gagal masuk. Periksa kembali username dan kata sandi Anda.')
        setLoading(false)
        return
      }

      if (!response?.success) {
        setError(response?.message || 'Gagal masuk. Periksa kembali username dan kata sandi Anda.')
        setLoading(false)
        return
      }

      login(response.data)
      setLoading(false)
      navigate('/dashboard')
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi beberapa saat.')
      setLoading(false)
    }
  }

  const inputClass = (hasError) =>
    `w-full h-11 pl-10 pr-4 border rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-slate-50/60 outline-none transition-all duration-200 ${
      hasError
        ? 'border-red-400 ring-2 ring-red-100'
        : 'border-slate-200 hover:border-slate-300 focus:border-[#0f2d5a] focus:ring-2 focus:ring-[#0f2d5a]/10 focus:bg-white'
    }`

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
      <div
        className="relative hidden lg:flex lg:w-[55%] flex-col justify-between overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #040e1f 0%, #0b2245 50%, #143872 100%)' }}
      >
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        {/* Ambient glow orbs */}
        <div
          className="absolute -top-32 -right-32 w-[560px] h-[560px] rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-40 -left-20 w-[480px] h-[480px] rounded-full opacity-[0.13] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }}
        />

        {/* Logo */}
        <div className="relative z-10 px-12 pt-12">
          <img src={logoVertical} alt="Akademihub Logo" className="h-14 w-auto drop-shadow-xl" />
        </div>

        {/* Hero text + features */}
        <div className="relative z-10 px-12 py-8">
          <h2 className="text-white text-[2.75rem] font-black leading-[1.15] tracking-tight mb-4">
            Platform Pendidikan<br />
            <span className="text-amber-400">Terpadu &amp; Modern</span>
          </h2>
          <p className="text-blue-200/75 text-[0.95rem] leading-relaxed max-w-[360px] mb-10">
            Kelola seluruh aktivitas akademik — dari absensi, nilai, hingga komunikasi orang tua — dalam satu sistem terintegrasi.
          </p>

          <ul className="space-y-3.5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5">
                <span
                  className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                  style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.22)' }}
                >
                  <Icon className="text-amber-400" size={17} />
                </span>
                <span className="text-blue-100/85 text-sm leading-snug">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Stats */}
        <div className="relative z-10 px-12 pb-12">
          <div className="flex gap-10 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {STATS.map(({ label, value }) => (
              <div key={label}>
                <p className="text-amber-400 text-2xl font-extrabold tracking-tight">{value}</p>
                <p className="text-blue-300/60 text-[0.7rem] mt-0.5 font-semibold uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col justify-center items-center px-6 py-12 bg-gradient-to-br from-slate-50 to-blue-50/50">

        {/* Mobile logo */}
        <div className="flex lg:hidden mb-10">
          <img src={logoVertical} alt="Akademihub Logo" className="h-12 w-auto" />
        </div>

        {/* Card */}
        <div className="w-full max-w-[420px] bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 px-8 py-10 animate-fade-in">

          {/* Heading */}
          <div className="mb-8">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(15,45,90,0.07)' }}
            >
              <LogIn className="text-[#0f2d5a]" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Selamat Datang</h2>
            <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
              Masuk ke akun Akademihub Anda untuk melanjutkan.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            {/* Global error */}
            {error && (
              <div role="alert" className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="nama@sekolah.id"
                  {...register('username')}
                  className={inputClass(!!errors.username)}
                />
              </div>
              {errors.username && (
                <p role="alert" className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} />
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  {...register('password')}
                  className={`${inputClass(!!errors.password)} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p role="alert" className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none group w-fit">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-[#0f2d5a] cursor-pointer"
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                Ingat saya
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0f2d5a] to-[#1a4a8a] hover:from-[#0a2249] hover:to-[#143a72] shadow-lg shadow-[#0f2d5a]/20 hover:shadow-[#0f2d5a]/30 focus:outline-none focus:ring-2 focus:ring-[#0f2d5a] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn size={17} />
                  Masuk
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-400">
            &copy; 2026 Akademihub. Hak cipta dilindungi.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
