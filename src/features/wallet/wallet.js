import api from '../../utils/api'
import { checkPermission } from '../../hooks/usePermission'

export const MAX_AMOUNT = 9000000000000
export const walletRoles = (user) => [user?.role, ...(user?.roles || [])].map(r => String(typeof r === 'string' ? r : r?.code || '').toLowerCase())
export const isStudent = user => walletRoles(user).includes('siswa')
export const isGuardian = user => walletRoles(user).some(r => ['wali', 'wali_siswa'].includes(r))
export const canUseWallet = user => !walletRoles(user).includes('pedagang') && (isStudent(user) || isGuardian(user) || ['view-all', 'cash-topup', 'manage-merchants', 'process-payout', 'reset-pin', 'handle-cases'].some(p => checkPermission(user, `wallet.${p}`)))
export function qrToken(value, origin = window.location.origin) {
  const text = value.trim()
  if (/^[a-f0-9]{48}$/.test(text)) return text
  try {
    const url = new URL(text)
    if (url.origin === origin && !url.search && !url.hash && !url.username && !url.password) {
      const match = url.pathname.match(/^\/wallet\/pay\/([a-f0-9]{48})$/)
      if (match) return match[1]
    }
  } catch { /* Invalid input stays in the form. */ }
  throw new Error('QR tidak valid. Gunakan QR kantin sekolah ini atau kode 48 karakter.')
}
export function safeWalletReturn(path) {
  if (/^\/wallet\/pay\/[a-f0-9]{48}$/.test(path || '')) return path
  if (path?.startsWith('/wallet?')) {
    const id = new URLSearchParams(path.slice(8)).get('topup')
    if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id || '')) return `/wallet?topup=${id}`
  }
  return '/dashboard'
}
export function amount(value, allowZero = false) {
  if (!/^\d+$/.test(String(value))) throw new Error('Nominal harus berupa rupiah bulat.')
  const n = Number(value)
  if (!Number.isSafeInteger(n) || n < (allowZero ? 0 : 1) || n > MAX_AMOUNT) throw new Error('Nominal di luar batas yang diizinkan.')
  return n
}
export const money = n => n == null ? 'Tanpa batas' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
export const date = value => value ? new Date(value).toLocaleString('id-ID') : '-'
export async function request(path, method = 'get', data) {
  const response = await api.request({ url: `/wallet/${path}`, method, ...(method === 'get' ? { params: data } : { data }) })
  return response.data.data
}
export const walletError = error => {
  const message = error.response?.data?.message || error.message
  const messages = {
    WALLET_DISABLED: 'Transaksi saldo dinonaktifkan sekolah. Riwayat tetap tersedia.',
    ONLINE_TOPUP_NOT_CONFIGURED: 'Isi saldo online belum diaktifkan sekolah.',
    STALE_LIMIT_VERSION: 'Batas telah diubah wali lain. Muat ulang sebelum menyimpan kembali.',
    FEE_QUOTE_CHANGED: 'Biaya berubah. Minta rincian biaya terbaru sebelum melanjutkan.',
    INSUFFICIENT_BALANCE: 'Saldo tidak cukup.', DAILY_LIMIT_EXCEEDED: 'Batas belanja harian terlampaui.',
    ACCOUNT_FROZEN: 'Belanja dibekukan. Hubungi petugas sekolah.', INVALID_PIN: 'PIN salah.',
    PIN_LOCKED: 'PIN terkunci selama 15 menit. Jangan ulangi sekarang.',
    REAUTHENTICATION_FAILED: 'Kata sandi akun tidak sesuai.', MERCHANT_INACTIVE: 'Pedagang tidak aktif.',
  }
  return messages[message] || message || 'Jaringan terputus. Periksa status sebelum mencoba ulang.'
}
