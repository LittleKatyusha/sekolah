import React, { useEffect, useState } from 'react'
import { Users, BookOpen, DollarSign, AlertTriangle, TrendingUp, GraduationCap, AlertCircle } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'
import { dashboardService } from '../features/dashboard/services/dashboardService'
import StatCard from '../features/dashboard/components/StatCard'
import SPPTrendChart from '../features/dashboard/components/SPPTrendChart'
import PaymentStatusChart from '../features/dashboard/components/PaymentStatusChart'
import Attendance7DaysChart from '../features/dashboard/components/Attendance7DaysChart'
import NilaiDistributionChart from '../features/dashboard/components/NilaiDistributionChart'
import { TopKategoriKasusChart, StatusPenyelesaianChart, KasusPerBulanChart } from '../features/dashboard/components/CounselingCharts'

const Dashboard = () => {
  const { user } = useAuthStore()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await dashboardService.getDashboardData()
        setDashboardData(data)
      } catch (error) {
        console.error('Failed to fetch dashboard data', error)
        setError(error.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          {user && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              User Role: {user.role || 'Not set'}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!dashboardData) {
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

  const { summary_cards, financial, academic_attendance, counseling } = dashboardData

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Dashboard Overview
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          School Management System Analytics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
          description={`${summary_cards?.total_tunggakan_spp?.month || ''} ${summary_cards?.total_tunggakan_spp?.year || ''}`}
        />
        <StatCard
          title="Kasus BK Proses"
          value={summary_cards?.kasus_bk_proses || 0}
          icon={AlertTriangle}
          color="text-red-600"
        />
      </div>

      {/* Financial Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Financial Overview
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SPPTrendChart data={financial?.spp_trend} />
          <PaymentStatusChart data={financial?.payment_status_distribution} />
        </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Attendance7DaysChart data={academic_attendance?.attendance_7_days} />
          <NilaiDistributionChart data={academic_attendance?.nilai_distribution} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TopKategoriKasusChart data={counseling?.top_kategori_kasus} />
          <StatusPenyelesaianChart data={counseling?.status_penyelesaian} />
        </div>
        <div className="mb-6">
          <KasusPerBulanChart data={counseling?.kasus_per_bulan} />
        </div>
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
    </div>
  )
}

export default Dashboard
