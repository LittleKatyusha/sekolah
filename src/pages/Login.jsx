import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogIn, User, Lock, Eye, EyeOff, BookOpen, Users, Award, TrendingUp, AlertCircle } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'
import { apiService } from '../utils/api'
import logoVertical from '../assets/logo akademihub-01-04.png'
import logoHorizontal from '../assets/logo akademihub-01-03.png'

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

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isGsiRendered, setIsGsiRendered] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const handleGoogleCredential = async (credential) => {
    setGoogleLoading(true)
    setError('')
    try {
      const { data: response, error: apiError } = await apiService.post('/auth/google', {
        id_token: credential,
      })

      if (apiError) {
        setError(apiError.message || apiError.error || 'Gagal masuk dengan akun Google.')
        setGoogleLoading(false)
        return
      }

      if (!response?.success) {
        setError(response?.message || 'Gagal masuk dengan akun Google.')
        setGoogleLoading(false)
        return
      }

      login(response.data)
      setGoogleLoading(false)
      navigate('/dashboard')
    } catch {
      setError('Terjadi kesalahan saat memproses login Google.')
      setGoogleLoading(false)
    }
  }

  // Handle redirect OAuth code in URL if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname)
      setGoogleLoading(true)
      apiService.post('/auth/google', {
        code,
        redirect_uri: window.location.origin + window.location.pathname,
      })
        .then(({ data: response, error: apiError }) => {
          if (apiError || !response?.success) {
            setError(apiError?.message || response?.message || 'Gagal masuk dengan Google.')
            setGoogleLoading(false)
            return
          }
          login(response.data)
          setGoogleLoading(false)
          navigate('/dashboard')
        })
        .catch(() => {
          setError('Gagal memproses otorisasi Google.')
          setGoogleLoading(false)
        })
    }
  }, [])

  // Initialize Google Identity Services (GSI)
  useEffect(() => {
    if (!googleClientId) return

    const initGsi = () => {
      if (!window.google?.accounts?.id) return
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (res) => {
          if (res?.credential) {
            handleGoogleCredential(res.credential)
          }
        },
        auto_select: false,
      })

      const btnContainer = document.getElementById('google-signin-btn-container')
      if (btnContainer) {
        btnContainer.innerHTML = ''
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          shape: 'pill',
          logo_alignment: 'center',
        })
        setIsGsiRendered(true)
      }
    }

    if (window.google?.accounts?.id) {
      initGsi()
    } else {
      const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]')
      if (!existingScript) {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client?hl=id'
        script.async = true
        script.defer = true
        script.onload = initGsi
        document.body.appendChild(script)
      } else {
        existingScript.addEventListener('load', initGsi)
      }
    }
  }, [googleClientId])

  const handleGoogleClick = async () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt()
    } else {
      try {
        const { data: res } = await apiService.get('/auth/google/url')
        if (res?.data?.url) {
          window.location.href = res.data.url
        }
      } catch {
        setError('Layanan Google Sign-In belum tersedia saat ini.')
      }
    }
  }

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
        <div className="relative z-10 px-12 py-12 my-auto">
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
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col justify-center items-center px-6 py-12 bg-gradient-to-br from-slate-50 to-blue-50/50">

        {/* Card */}
        <div className="w-full max-w-[420px] bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 px-8 py-10 animate-fade-in">

          {/* Heading */}
          <div className="mb-8">
            <div className="mb-6 flex items-center justify-start">
              <img src={logoHorizontal} alt="Akademihub Logo" className="h-10 w-auto" />
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
              disabled={loading || googleLoading}
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

            {/* Divider */}
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-medium">atau</span>
              </div>
            </div>

            {/* Google Sign-In */}
            <div className="w-full space-y-2">
              <div id="google-signin-btn-container" className="w-full flex justify-center empty:hidden" />
              {!isGsiRendered && (
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={loading || googleLoading}
                  className="w-full h-11 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  {googleLoading ? 'Menghubungkan Google...' : 'Masuk dengan Google'}
                </button>
              )}
            </div>
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
