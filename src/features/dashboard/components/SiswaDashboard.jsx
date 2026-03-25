import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle, XCircle, Clock, AlertTriangle, FileText, DollarSign } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import Card from '../../../components/ui/Card'
import QuickActions from './QuickActions'
import DashboardAttendanceCard from './DashboardAttendanceCard'

const STATUS_COLORS = {
  Hadir: '#10B981',
  Izin: '#3B82F6',
  Sakit: '#F59E0B',
  Alpha: '#EF4444',
}

const STATUS_LABELS = {
  '1': 'Hadir',
  '2': 'Sakit',
  '3': 'Izin',
  '4': 'Alpha',
  hadir: 'Hadir',
  sakit: 'Sakit',
  izin: 'Izin',
  alpha: 'Alpha',
  alpa: 'Alpha',
}

const normalizeStatusKey = (value) => {
  if (value === null || value === undefined || value === '') return ''
  return String(value).toLowerCase()
}

const incrementAttendanceSummary = (summary, attendanceRecord) => {
  const statusKey = normalizeStatusKey(attendanceRecord?.status_absensi ?? attendanceRecord?.status)
  if (!statusKey) return summary

  const nextSummary = Array.isArray(summary) ? [...summary] : []
  const existingIndex = nextSummary.findIndex((item) => {
    const itemKey = normalizeStatusKey(item?.status_label ?? item?.status)
    return itemKey === statusKey || item?.status === attendanceRecord?.status
  })

  if (existingIndex >= 0) {
    const currentItem = nextSummary[existingIndex]
    nextSummary[existingIndex] = {
      ...currentItem,
      total: Number(currentItem?.total || 0) + 1,
    }
    return nextSummary
  }

  return [
    ...nextSummary,
    {
      status: attendanceRecord?.status ?? attendanceRecord?.status_absensi ?? statusKey,
      status_label: STATUS_LABELS[statusKey] || `Status ${attendanceRecord?.status ?? attendanceRecord?.status_absensi ?? '-'}`,
      total: 1,
    },
  ]
}

const SiswaDashboard = ({ data, authUser }) => {
  const { profile, attendance_summary, unpaid_spp, recent_grades, upcoming_tasks } = data
  const [attendanceSummaryState, setAttendanceSummaryState] = useState(attendance_summary || [])

  useEffect(() => {
    setAttendanceSummaryState(attendance_summary || [])
  }, [attendance_summary])

  const handleAttendanceRecorded = useMemo(() => (record) => {
    setAttendanceSummaryState((current) => incrementAttendanceSummary(current, record))
  }, [])

  const attendanceChartData = (attendanceSummaryState || []).map((item) => ({
    name: item.status_label || `Status ${item.status}`,
    value: item.total,
  }))

  const attendanceColors = attendanceChartData.map(
    (item) => STATUS_COLORS[item.name] || '#6B7280'
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Selamat Datang, {profile?.nama || 'Siswa'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          NIS: {profile?.nis || '-'} &middot; Kelas: {profile?.kelas || '-'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Attendance Summary */}
        <Card title="Ringkasan Kehadiran">
          {attendanceChartData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
              Belum ada data kehadiran
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={attendanceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  dataKey="value"
                >
                  {attendanceChartData.map((_, index) => (
                    <Cell key={index} fill={attendanceColors[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Unpaid SPP */}
        <Card title="Tunggakan SPP">
          <div className="space-y-3">
            {(!unpaid_spp || unpaid_spp.length === 0) ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={16} />
                <span className="text-sm">Semua SPP lunas</span>
              </div>
            ) : (
              unpaid_spp.map((spp) => (
                <div key={spp.id} className="flex items-center justify-between pb-2 border-b border-gray-100 last:border-0 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-orange-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {spp.bulan_nama} {spp.tahun}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-red-600">
                    Rp {Number(spp.jumlah_bayar || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <DashboardAttendanceCard role="siswa" profile={profile} authUser={authUser} onAttendanceRecorded={handleAttendanceRecorded} />

        {/* Quick Actions */}
        <QuickActions role="siswa" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <Card title="Nilai Terbaru">
          <div className="space-y-3">
            {(!recent_grades || recent_grades.length === 0) ? (
              <p className="text-gray-500 text-sm">Belum ada nilai.</p>
            ) : (
              recent_grades.map((grade) => (
                <div key={grade.id} className="flex items-center justify-between pb-2 border-b border-gray-100 last:border-0 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {grade.ujian?.mapel?.nama || 'Ujian'}
                      </p>
                      <p className="text-xs text-gray-500">{grade.ujian?.nama || ''}</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${
                    grade.nilai >= 80 ? 'text-green-600' :
                    grade.nilai >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {grade.nilai}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming Tasks */}
        <Card title="Tugas Mendatang">
          <div className="space-y-3">
            {(!upcoming_tasks || upcoming_tasks.length === 0) ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={16} />
                <span className="text-sm">Tidak ada tugas mendatang</span>
              </div>
            ) : (
              upcoming_tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 dark:border-gray-700">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-full dark:bg-purple-900/30">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {task.judul || task.nama || 'Tugas'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Deadline: {task.tenggat_waktu ? new Date(task.tenggat_waktu).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default SiswaDashboard