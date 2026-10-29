import { useState } from 'react'
import { KeyRound, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { profileService } from '../../../services/profileService'
import { showSuccess, showError } from '../../../utils/sweetalert'

export default function ProfilePasswordTab() {
  const [saving, setSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [formData, setFormData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!formData.current_password) {
      setErrorMsg('Kata sandi saat ini wajib diisi.')
      return
    }
    if (!formData.password) {
      setErrorMsg('Kata sandi baru wajib diisi.')
      return
    }
    if (formData.password.length < 8) {
      setErrorMsg('Kata sandi baru minimal 8 karakter.')
      return
    }
    if (formData.password !== formData.password_confirmation) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok.')
      return
    }

    setSaving(true)
    try {
      await profileService.changePassword(formData)
      showSuccess('Kata sandi berhasil diperbarui!')
      setFormData({
        current_password: '',
        password: '',
        password_confirmation: '',
      })
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal mengubah kata sandi.'
      setErrorMsg(msg)
      showError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xs border border-gray-100 dark:border-gray-700 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Ganti Kata Sandi
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gunakan minimal 8 karakter kombinasi huruf dan angka untuk keamanan optimal.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-center gap-2.5 text-sm text-red-700 dark:text-red-400">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4 max-w-md">
          <div>
            <label
              htmlFor="current_password"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5"
            >
              Kata Sandi Saat Ini <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="current_password"
                type={showCurrent ? 'text' : 'password'}
                value={formData.current_password}
                onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm pr-10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5"
            >
              Kata Sandi Baru <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showNew ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm pr-10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="password_confirmation"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5"
            >
              Konfirmasi Kata Sandi Baru <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password_confirmation"
                type={showConfirm ? 'text' : 'password'}
                value={formData.password_confirmation}
                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                required
                minLength={8}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm pr-10 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-xs disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            <span>Perbarui Kata Sandi</span>
          </button>
        </div>
      </div>
    </form>
  )
}
