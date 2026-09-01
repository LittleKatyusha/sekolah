import { lazy, Suspense } from 'react'
import { AlertCircle } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'

const QuickActions = lazy(() => import('../features/dashboard/components/QuickActions'))
const GURU_ROLES = new Set(['GURU', 'WALI_KELAS', 'GURU_BK'])
const SISWA_ROLES = new Set(['SISWA'])
const WALI_ROLES = new Set(['WALI_SISWA'])

const Dashboard = () => {
  const { user } = useAuthStore()
  const role = user?.role?.toUpperCase()
  const quickActionRole = GURU_ROLES.has(role) ? 'guru' : SISWA_ROLES.has(role) ? 'siswa' : WALI_ROLES.has(role) ? 'wali' : 'admin'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Selamat datang, {user?.name || 'Pengguna'}</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Pilih modul yang tersedia dari navigasi untuk melanjutkan.</p>
      </div>
      <Suspense fallback={null}>
        <QuickActions role={quickActionRole} />
      </Suspense>
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-sm">Ringkasan dashboard dinonaktifkan sampai backend menerbitkan endpoint dashboard aktif.</p>
      </div>
    </div>
  )
}

export default Dashboard
