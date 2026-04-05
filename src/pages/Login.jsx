import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogIn, Mail, Lock, Eye, EyeOff, GraduationCap, BookOpen, Users, Award, Star, CheckCircle2 } from 'lucide-react'
import Button from '../components/ui/Button'
import useAuthStore from '../store/useAuthStore'
import { apiService } from '../utils/api'

const REMEMBER_ME_KEY = 'login_remember_me'

const getSavedCredentials = () => {
  try {
    const saved = localStorage.getItem(REMEMBER_ME_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {
    // ignore parse errors
  }
  return null
}

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
})

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const savedCredentials = getSavedCredentials()
  const [rememberMe, setRememberMe] = useState(!!savedCredentials)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: savedCredentials?.email || '',
      password: savedCredentials?.password || '',
    },
  })

  const [error, setError] = useState('')

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')

    // Save or clear remembered credentials
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify({
        email: data.email,
        password: data.password,
      }))
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY)
    }

    try {
      const { data: response, error: apiError } = await apiService.post('/auth/login', {
        email: data.email,
        password: data.password,
      })

      if (apiError) {
        // Handle API errors - stay on page, show error
        const errorMessage = apiError.message || apiError.error || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.'
        setError(errorMessage)
        setLoading(false)
        return
      }

      // Response format: { success, message, data: { access_token, refresh_token, token_type, expires_in, user } }
      if (!response?.success) {
        // Handle unsuccessful response - stay on page, show error
        const errorMessage = response?.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.'
        setError(errorMessage)
        setLoading(false)
        return
      }

      // Only navigate on successful login
      login(response.data)
      setLoading(false)
      navigate('/dashboard')
    } catch (err) {
      // Handle unexpected errors - stay on page, show error
      setError('Terjadi kesalahan. Silakan coba lagi beberapa saat.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">

      {/* ── LEFT PANEL – School Branding ─────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-[55%] flex-col justify-between overflow-hidden bg-[#0f2d5a]">

        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5"></div>
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-[#1a4a8a]/60"></div>
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full bg-white/5"></div>

        {/* Top: logo + name */}
        <div className="relative z-10 px-12 pt-12">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-400 shadow-lg">
              <GraduationCap className="text-[#0f2d5a]" size={28} />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold tracking-wide leading-tight">Akademihub</h1>
              <p className="text-amber-300 text-xs font-medium tracking-widest uppercase">Sistem Informasi Akademik</p>
            </div>
          </div>
        </div>

        {/* Center: tagline + feature list */}
        <div className="relative z-10 px-12 py-10">
          <h2 className="text-white text-4xl font-extrabold leading-tight mb-3">
            Platform Pendidikan<br />
            <span className="text-amber-400">Terpadu &amp; Modern</span>
          </h2>
          <p className="text-blue-200 text-base leading-relaxed mb-10 max-w-sm">
            Kelola seluruh aktivitas akademik — dari absensi, nilai, hingga komunikasi orang tua — dalam satu sistem yang terintegrasi.
          </p>

          <ul className="space-y-4">
            {[
              { icon: BookOpen,  text: 'Manajemen kurikulum & materi pembelajaran' },
              { icon: Users,     text: 'Data siswa, guru, dan staf terpusat' },
              { icon: Award,     text: 'Pelaporan nilai & rapor otomatis' },
              { icon: Star,      text: 'Analitik performa sekolah real-time' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-400/20 shrink-0">
                  <Icon className="text-amber-400" size={16} />
                </span>
                <span className="text-blue-100 text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: stats bar */}
        <div className="relative z-10 px-12 pb-10">
          <div className="flex gap-8 border-t border-white/10 pt-6">
            {[
              { label: 'Siswa Aktif', value: '2.400+' },
              { label: 'Tenaga Pengajar', value: '120+' },
              { label: 'Mata Pelajaran', value: '48' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-amber-400 text-xl font-bold">{value}</p>
                <p className="text-blue-300 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL – Login Form ──────────────────────────────────── */}
      <div className="flex flex-1 flex-col justify-center items-center px-6 py-12 bg-white">

        {/* Mobile-only logo */}
        <div className="flex lg:hidden items-center gap-3 mb-10">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#0f2d5a]">
            <GraduationCap className="text-amber-400" size={24} />
          </div>
          <div>
            <p className="text-[#0f2d5a] font-bold text-lg leading-tight">Akademihub</p>
            <p className="text-gray-500 text-xs tracking-widest uppercase">Sistem Informasi Akademik</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Masuk ke Akun Anda</h2>
            <p className="mt-1 text-sm text-gray-500">Selamat datang kembali. Silakan masukkan kredensial Anda.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-red-400" />
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="nama@sekolah.id"
                  {...register('email')}
                  className={`w-full pl-10 pr-4 py-2.5 border ${
                    errors.email ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-[#0f2d5a]'
                  } rounded-lg bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan kata sandi"
                  {...register('password')}
                  className={`w-full pl-10 pr-11 py-2.5 border ${
                    errors.password ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-[#0f2d5a]'
                  } rounded-lg bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-[#0f2d5a] cursor-pointer rounded"
                />
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  Ingat saya
                </span>
              </label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              loading={loading}
              className="w-full bg-[#0f2d5a] hover:bg-[#1a4a8a] text-white py-2.5 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <LogIn size={17} className="mr-2" />
                  Masuk
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-gray-400">
            &copy; 2026 Akademihub. Hak cipta dilindungi.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
