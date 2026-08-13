import React, { lazy, Suspense, useEffect, useState } from 'react'
import { Users, BookOpen, DollarSign, AlertTriangle, TrendingUp, GraduationCap, AlertCircle, UserPlus, UserCheck } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'
import { dashboardService } from '../features/dashboard/services/dashboardService'
import StatCard from '../features/dashboard/components/StatCard'

// ── Role groups ──────────────────────────────────────────────────────────────
const GURU_ROLES = new Set(['GURU', 'WALI_KELAS', 'GURU_BK'])
const SISWA_ROLES = new Set(['SISWA'])
const WALI_ROLES = new Set(['WALI_SISWA'])

const SPPTrendChart = lazy(() => import('../features/dashboard/components/SPPTrendChart'))
const PaymentStatusChart = lazy(() => import('../features/dashboard/components/PaymentStatusChart'))
const Attendance7DaysChart = lazy(() => import('../features/dashboard/components/Attendance7DaysChart'))
const NilaiDistributionChart = lazy(() => import('../features/dashboard/components/NilaiDistributionChart'))
const TopKategoriKasusChart = lazy(() =>
  import('../features/dashboard/components/CounselingCharts').then((module) => ({
    default: module.TopKategoriKasusChart,
  }))
)
const StatusPenyelesaianChart = lazy(() =>
  import('../features/dashboard/components/CounselingCharts').then((module) => ({
    default: module.StatusPenyelesaianChart,
  }))
)
const KasusPerBulanChart = lazy(() =>
  import('../features/dashboard/components/CounselingCharts').then((module) => ({
    default: module.KasusPerBulanChart,
  }))
)
const PpdbStatusChart = lazy(() =>
  import('../features/dashboard/components/PpdbCharts').then((module) => ({
    default: module.PpdbStatusChart,
  }))
)
const PpdbMonthlyChart = lazy(() =>
  import('../features/dashboard/components/PpdbCharts').then((module) => ({
    default: module.PpdbMonthlyChart,
  }))
)
const QuickActions = lazy(() => import('../features/dashboard/components/QuickActions'))
const GuruDashboard = lazy(() => import('../features/dashboard/components/GuruDashboard'))
const SiswaDashboard = lazy(() => import('../features/dashboard/components/SiswaDashboard'))
const WaliDashboard = lazy(() => import('../features/dashboard/components/WaliDashboard'))

const LoadingSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="card p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="card p-6">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4" />
          <div className="h-[300px] bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  </div>
)

const DashboardSectionFallback = ({ height = 'h-[300px]' }) => (
  <div className={`card p-6 animate-pulse ${height}`}>
    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4" />
    <div className="h-full bg-gray-200 dark:bg-gray-700 rounded" />
  </div>
)

const Dashboard = () => {
  const { user } = useAuthStore()
  const [dashboardData, setDashboardData] = useState(null)
  const [summaryCards, setSummaryCards] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    // Fast path: summary cards rendered as soon as they arrive
    dashboardService.getSummaryCards()
      .then((data) => { if (mounted) setSummaryCards(data) })
      .catch(() => {}) // fallback: full data fetch will cover this

    // Full data fetch in parallel — provides role + chart data
    dashboardService.getDashboardData()
      .then((data) => {
        if (!mounted) return
        setDashboardData(data)
        // If summary cards haven't arrived yet, use the ones embedded in full data
        setSummaryCards((current) => current || data?.summary_cards || null)
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Failed to load dashboard data')
      })
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [reloadKey])

  if (loading && !summaryCards) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Dashboard tidak dapat dimuat
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => setReloadKey((value) => value + 1)}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Coba lagi
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData && !summaryCards) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-16 w-16 text-yellow-500" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            No Dashboard Data Available
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please contact support if this issue persists.
          </p>
        </div>
      </div>
    )
  }

  // Role-based rendering — use user.role (available immediately) so routing
  // does not depend on the dashboard API response containing a 'role' field.
  const userRole = user?.role?.toUpperCase()

  if (GURU_ROLES.has(userRole)) {
    if (!dashboardData) return <LoadingSkeleton />
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <GuruDashboard data={dashboardData} authUser={user} />
      </Suspense>
    )
  }

  if (SISWA_ROLES.has(userRole)) {
    if (!dashboardData) return <LoadingSkeleton />
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <SiswaDashboard data={dashboardData} authUser={user} />
      </Suspense>
    )
  }

  if (WALI_ROLES.has(userRole)) {
    if (!dashboardData) return <LoadingSkeleton />
    return (
      <Suspense fallback={<LoadingSkeleton />}>
        <WaliDashboard data={dashboardData} />
      </Suspense>
    )
  }

  // Admin/Staff dashboard (default)
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AdminDashboard data={dashboardData} summaryCardsOverride={summaryCards} user={user} />
    </Suspense>
  )
}

const AdminDashboard = ({ data, summaryCardsOverride, user }) => {
  const { financial, academic_attendance, counseling, ppdb } = data || {}
  const summary_cards = summaryCardsOverride || data?.summary_cards

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            School Management System Analytics
          </p>
        </div>
        {data?.generated_at && (
          <p className="text-xs text-gray-400">
            Updated: {new Date(data?.generated_at).toLocaleString('id-ID')}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Siswa Aktif"
          value={summary_cards?.total_siswa_aktif || 0}
          icon={Users}
          color="text-blue-600"
        />
        <StatCard
          title="Total Guru"
          value={summary_cards?.total_guru || 0}
          icon={BookOpen}
          color="text-green-600"
        />
        <StatCard
          title="Total Kelas"
          value={summary_cards?.total_kelas || 0}
          icon={GraduationCap}
          color="text-purple-600"
        />
        <StatCard
          title="Tunggakan SPP"
          value={summary_cards?.total_tunggakan_spp?.formatted || 'Rp 0'}
          icon={DollarSign}
          color="text-orange-600"
          description={`${summary_cards?.total_tunggakan_spp?.month || ''} ${summary_cards?.total_tunggakan_spp?.year || ''} · ${summary_cards?.total_tunggakan_spp?.jumlah_siswa || 0} siswa`}
        />
        <StatCard
          title="Kasus BK Proses"
          value={summary_cards?.kasus_bk_proses || 0}
          icon={AlertTriangle}
          color="text-red-600"
        />
      </div>

      {/* PPDB Summary Cards */}
      {summary_cards?.ppdb_summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="Total Pendaftar PPDB"
            value={summary_cards.ppdb_summary.total_pendaftar || 0}
            icon={UserPlus}
            color="text-violet-600"
          />
          <StatCard
            title="Pendaftar Diterima"
            value={summary_cards.ppdb_summary.pendaftar_diterima || 0}
            icon={UserCheck}
            color="text-emerald-600"
          />
        </div>
      )}

      {/* Quick Actions */}
      <Suspense fallback={<DashboardSectionFallback height="h-32" />}>
        <QuickActions role="admin" />
      </Suspense>

      {/* Financial Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Financial Overview
        </h2>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <DashboardSectionFallback />
              <DashboardSectionFallback />
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SPPTrendChart data={financial?.spp_trend} />
            <PaymentStatusChart data={financial?.payment_status_distribution} />
          </div>
        </Suspense>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Pendapatan SPP"
            value={financial?.yearly_summary?.formatted_total || 'Rp 0'}
            icon={TrendingUp}
            color="text-green-600"
            description={`Tahun ${financial?.yearly_summary?.year || ''}`}
          />
          <StatCard
            title="Total Lunas"
            value={financial?.yearly_summary?.total_lunas || 0}
            icon={Users}
            color="text-blue-600"
          />
          <StatCard
            title="Total Belum Lunas"
            value={financial?.yearly_summary?.total_belum_lunas || 0}
            icon={AlertCircle}
            color="text-red-600"
          />
        </div>
      </div>

      {/* Academic & Attendance Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Academic & Attendance
        </h2>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <DashboardSectionFallback />
              <DashboardSectionFallback />
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Attendance7DaysChart data={academic_attendance?.attendance_7_days} />
            <NilaiDistributionChart data={academic_attendance?.nilai_distribution} />
          </div>
        </Suspense>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Rata-rata Kehadiran"
            value={`${academic_attendance?.attendance_summary?.rata_rata_kehadiran || 0}%`}
            icon={TrendingUp}
            color="text-green-600"
          />
          <StatCard
            title="Total Hadir (7 Hari)"
            value={academic_attendance?.attendance_summary?.total_hadir_7_hari || 0}
            icon={Users}
            color="text-blue-600"
          />
          <StatCard
            title="Rata-rata Nilai"
            value={academic_attendance?.nilai_summary?.rata_rata || 0}
            icon={GraduationCap}
            color="text-purple-600"
          />
          <StatCard
            title="Total Ujian"
            value={academic_attendance?.nilai_summary?.total_ujian || 0}
            icon={BookOpen}
            color="text-indigo-600"
          />
        </div>
      </div>

      {/* Counseling Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Counseling (BK)
        </h2>
        <Suspense
          fallback={
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <DashboardSectionFallback />
                <DashboardSectionFallback />
              </div>
              <div className="mb-6">
                <DashboardSectionFallback />
              </div>
            </>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <TopKategoriKasusChart data={counseling?.top_kategori_kasus} />
            <StatusPenyelesaianChart data={counseling?.status_penyelesaian} />
          </div>
          <div className="mb-6">
            <KasusPerBulanChart data={counseling?.kasus_per_bulan} />
          </div>
        </Suspense>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Kasus"
            value={counseling?.ringkasan?.total_kasus || 0}
            icon={AlertTriangle}
            color="text-orange-600"
          />
          <StatCard
            title="Kasus Selesai"
            value={counseling?.ringkasan?.kasus_selesai || 0}
            icon={TrendingUp}
            color="text-green-600"
          />
          <StatCard
            title="Persentase Penyelesaian"
            value={`${counseling?.ringkasan?.persentase_penyelesaian || 0}%`}
            icon={GraduationCap}
            color="text-blue-600"
          />
        </div>
      </div>

      {/* PPDB Section */}
      {ppdb && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            PPDB (Penerimaan Peserta Didik Baru)
          </h2>
          <Suspense
            fallback={
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DashboardSectionFallback />
                <DashboardSectionFallback />
              </div>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PpdbStatusChart data={ppdb?.status_distribution} />
              <PpdbMonthlyChart data={ppdb?.registrations_per_month} />
            </div>
          </Suspense>
        </div>
      )}
    </div>
  )
}

export default Dashboard
