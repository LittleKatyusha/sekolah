import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, Clock, AlertTriangle, FileText, DollarSign,
  TrendingUp, BookOpen, Calendar, ClipboardCheck, GraduationCap,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import DashboardAttendanceCard from './DashboardAttendanceCard'

// ── Constants ─────────────────────────────────────────────────────────────────
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

const SISWA_QUICK_ACTIONS = [
  { label: 'Jadwal', icon: Calendar, path: '/jadwal-pelajaran', from: 'from-blue-500', to: 'to-indigo-600' },
  { label: 'Nilai', icon: FileText, path: '/nilai', from: 'from-emerald-500', to: 'to-teal-600' },
  { label: 'Absensi', icon: ClipboardCheck, path: '/absensi-siswa', from: 'from-violet-500', to: 'to-purple-600' },
  { label: 'Tugas', icon: BookOpen, path: '/tugas', from: 'from-pink-500', to: 'to-rose-600' },
  { label: 'SPP', icon: DollarSign, path: '/pembayaran-spp', from: 'from-amber-500', to: 'to-orange-600' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
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
    nextSummary[existingIndex] = { ...currentItem, total: Number(currentItem?.total || 0) + 1 }
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

const getDeadlineUrgency = (tenggatWaktu) => {
  if (!tenggatWaktu) return null
  const days = Math.ceil((new Date(tenggatWaktu) - new Date()) / 86_400_000)
  if (days < 0) return { label: 'Terlambat', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
  if (days <= 2) return { label: `${days}h lagi`, cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
  if (days <= 7) return { label: `${days}h lagi`, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
  return { label: `${days}h lagi`, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' }
}

// ── Sub-components ────────────────────────────────────────────────────────────
const DonutLegend = ({ data, colors }) => (
  <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
    {data.map((item, i) => (
      <div key={item.name} className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: colors[i] }} />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {item.name} <span className="font-semibold text-gray-800 dark:text-gray-200">{item.value}</span>
        </span>
      </div>
    ))}
  </div>
)

// ── Main component ────────────────────────────────────────────────────────────
const SiswaDashboard = ({ data, authUser }) => {
  const navigate = useNavigate()
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

  const attendanceColors = attendanceChartData.map((item) => STATUS_COLORS[item.name] || '#6B7280')

  const totalAttendance = attendanceChartData.reduce((s, i) => s + i.value, 0)
  const hadirCount = attendanceChartData.find((i) => i.name === 'Hadir')?.value || 0
  const hadirPct = totalAttendance > 0 ? Math.round((hadirCount / totalAttendance) * 100) : 0

  const avgNilai = useMemo(() => {
    if (!recent_grades || recent_grades.length === 0) return null
    const sum = recent_grades.reduce((s, g) => s + Number(g.nilai || 0), 0)
    return Math.round(sum / recent_grades.length)
  }, [recent_grades])

  const tunggakanCount = unpaid_spp?.length || 0

  // ── Stat cards config ────────────────────────────────────────────────────
  const statCards = [
    {
      label: 'Kehadiran',
      value: totalAttendance > 0 ? `${hadirPct}%` : '—',
      icon: CheckCircle,
      iconBg: 'bg-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-100 dark:border-emerald-800/40',
      valueColor: 'text-emerald-700 dark:text-emerald-400',
    },
    {
      label: 'Tugas Aktif',
      value: upcoming_tasks?.length ?? 0,
      icon: Clock,
      iconBg: 'bg-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
      border: 'border-violet-100 dark:border-violet-800/40',
      valueColor: 'text-violet-700 dark:text-violet-400',
    },
    {
      label: 'Rata-rata Nilai',
      value: avgNilai !== null ? avgNilai : '—',
      icon: TrendingUp,
      iconBg: 'bg-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-100 dark:border-blue-800/40',
      valueColor: 'text-blue-700 dark:text-blue-400',
    },
    {
      label: 'Status SPP',
      value: tunggakanCount === 0 ? 'Lunas' : `${tunggakanCount} Tlgk`,
      icon: tunggakanCount === 0 ? CheckCircle : AlertTriangle,
      iconBg: tunggakanCount === 0 ? 'bg-emerald-500' : 'bg-orange-500',
      bg: tunggakanCount === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-orange-50 dark:bg-orange-900/20',
      border: tunggakanCount === 0 ? 'border-emerald-100 dark:border-emerald-800/40' : 'border-orange-100 dark:border-orange-800/40',
      valueColor: tunggakanCount === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400',
    },
  ]

  return (
    <div className="space-y-6">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-lg">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-6 right-20 h-28 w-28 rounded-full bg-white/5" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-4 right-4 opacity-20" aria-hidden="true">
          <GraduationCap size={64} />
        </div>

        <div className="relative">
          <p className="text-sm font-medium text-blue-200">Selamat datang kembali 👋</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{profile?.nama || 'Siswa'}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              NIS: {profile?.nis || '—'}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              {profile?.kelas || '—'}
            </span>
            {tunggakanCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-400/30 border border-orange-300/40 px-3 py-1 text-xs font-medium text-orange-100">
                <AlertTriangle size={11} aria-hidden="true" />
                {tunggakanCount} tunggakan SPP
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, iconBg, bg, border, valueColor }) => (
          <div
            key={label}
            className={`${bg} rounded-2xl border ${border} p-4`}
          >
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${iconBg} text-white shadow-sm`}>
              <Icon size={16} aria-hidden="true" />
            </div>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${valueColor}`}>{value}</p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Kehadiran chart + Today attendance ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Kehadiran donut */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Ringkasan Kehadiran</h3>
          {attendanceChartData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-gray-400">
              Belum ada data kehadiran
            </div>
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={attendanceChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {attendanceChartData.map((_, index) => (
                        <Cell key={index} fill={attendanceColors[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                      formatter={(v, n) => [v, n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* centre label */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800 dark:text-white tabular-nums">{hadirPct}%</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Hadir</span>
                </div>
              </div>
              <DonutLegend data={attendanceChartData} colors={attendanceColors} />
            </>
          )}
        </div>

        {/* Today's attendance */}
        <DashboardAttendanceCard
          role="siswa"
          profile={profile}
          authUser={authUser}
          onAttendanceRecorded={handleAttendanceRecorded}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Akses Cepat</h3>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {SISWA_QUICK_ACTIONS.map(({ label, icon: Icon, path, from, to }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="group flex flex-col items-center gap-2 rounded-2xl bg-gray-50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-100 hover:shadow-md dark:bg-gray-700/50 dark:hover:bg-gray-700 cursor-pointer"
              aria-label={label}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${from} ${to} text-white shadow-sm transition-transform duration-200 group-hover:scale-105`}>
                <Icon size={20} aria-hidden="true" />
              </div>
              <span className="text-center text-xs font-medium text-gray-600 dark:text-gray-300">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Nilai + Tugas ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Nilai Terbaru */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Nilai Terbaru</h3>
          {(!recent_grades || recent_grades.length === 0) ? (
            <div className="flex h-24 items-center justify-center text-sm text-gray-400">Belum ada nilai.</div>
          ) : (
            <div className="space-y-3">
              {recent_grades.map((grade) => (
                <div key={grade.id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-700/40">
                  <span
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold tabular-nums ${
                      grade.nilai >= 80
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : grade.nilai >= 60
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {grade.nilai}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                      {grade.ujian?.mapel?.nama || 'Ujian'}
                    </p>
                    <p className="truncate text-xs text-gray-500">{grade.ujian?.nama || ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tugas Mendatang */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Tugas Mendatang</h3>
          {(!upcoming_tasks || upcoming_tasks.length === 0) ? (
            <div className="flex h-24 items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={16} aria-hidden="true" />
              Tidak ada tugas mendatang
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming_tasks.map((task) => {
                const urgency = getDeadlineUrgency(task.tenggat_waktu)
                return (
                  <div key={task.id} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-700/40">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                      <Clock size={16} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                        {task.judul || task.nama || 'Tugas'}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {task.tenggat_waktu
                          ? new Date(task.tenggat_waktu).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </p>
                    </div>
                    {urgency && (
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${urgency.cls}`}>
                        {urgency.label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── SPP Tunggakan detail (only shown when there are unpaid items) ── */}
      {tunggakanCount > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm dark:border-orange-800/40 dark:bg-orange-900/20">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white">
              <AlertTriangle size={15} aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300">
              Tunggakan SPP ({tunggakanCount} bulan)
            </h3>
          </div>
          <div className="space-y-2">
            {unpaid_spp.map((spp) => (
              <div
                key={spp.id}
                className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-2.5 dark:bg-gray-800/60"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {spp.bulan_nama} {spp.tahun}
                </span>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums">
                  Rp {Number(spp.jumlah_bayar || 0).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}

export default SiswaDashboard