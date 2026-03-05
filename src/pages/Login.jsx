import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogIn, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react'
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
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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
        const errorMessage = apiError.message || apiError.error || 'Login failed. Please check your credentials.'
        setError(errorMessage)
        setLoading(false)
        return
      }

      // Response format: { success, message, data: { access_token, refresh_token, token_type, expires_in, user } }
      if (!response?.success) {
        // Handle unsuccessful response - stay on page, show error
        const errorMessage = response?.message || 'Login failed. Please check your credentials.'
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
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Login Container */}
      <div className="relative w-full max-w-md animate-fade-in">
        {/* Glassmorphism Card */}
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4 transform hover:scale-110 transition-transform duration-300">
              <Shield className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  {...register('email')}
                  className={`w-full pl-10 pr-4 py-3 border ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-10 pr-12 py-3 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                  Remember me
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              loading={loading} 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <LogIn size={20} className="mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
              >
                Register
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/90 text-sm backdrop-blur-sm bg-white/10 rounded-full px-4 py-2 inline-block">
            &copy; 2024 Admin Dashboard. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
