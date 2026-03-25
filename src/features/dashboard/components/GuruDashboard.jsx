import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Users, BookOpen, GraduationCap, ClipboardCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'
import StatCard from './StatCard'
import QuickActions from './QuickActions'
import DashboardAttendanceCard from './DashboardAttendanceCard'
import Card from '../../../components/ui/Card'

const ATTENDANCE_COUNT_KEYS = [
  'total_hadir',
  'total_hadir_hari_ini',
  'kehadiran_hari_ini',
  'absensi_hari_ini',
  'total_absensi_hadir',
]

const ATTENDANCE_FLAG_KEYS = [
  'sudah_absen_hari_ini',
  'has_absen_hari_ini',
  'is_absen_hari_ini',
]

const normalizeStatusKey = (value) => {
  if (value === null || value === undefined || value === '') return ''
  return String(value).toLowerCase()
}

const hasCheckedInFromSummary = (summary) => {
  if (!summary || typeof summary !== 'object') return false

  if (ATTENDANCE_FLAG_KEYS.some((key) => Boolean(summary[key]))) {
    return true
  }

  if (summary.attendance_summary && typeof summary.attendance_summary === 'object') {
    return hasCheckedInFromSummary(summary.attendance_summary)
  }

  return false
}

const incrementKnownAttendanceFields = (target) => {
  if (!target || typeof target !== 'object') return target

  let changed = false
  const nextTarget = { ...target }

  ATTENDANCE_COUNT_KEYS.forEach((key) => {
    if (typeof nextTarget[key] === 'number') {
      nextTarget[key] += 1
      changed = true
    }
  })

  ATTENDANCE_FLAG_KEYS.forEach((key) => {
    if (key in nextTarget) {
      nextTarget[key] = true
      changed = true
    }
  })

  if ('tanggal_absen_terakhir' in nextTarget) {
    nextTarget.tanggal_absen_terakhir = new Date().toISOString().slice(0, 10)
    changed = true
  }

  return changed ? nextTarget : target
}

const updateGuruAttendanceSummary = (summary, attendanceRecord) => {
  const statusKey = normalizeStatusKey(attendanceRecord?.status ?? attendanceRecord?.status_absensi)
  if (!summary || (statusKey !== '1' && statusKey !== 'hadir')) {
    return summary
  }

  const nextSummary = incrementKnownAttendanceFields(summary)
  if (nextSummary !== summary) {
    return nextSummary
  }

  if (summary.attendance_summary && typeof summary.attendance_summary === 'object') {
    const nextAttendanceSummary = incrementKnownAttendanceFields(summary.attendance_summary)
    if (nextAttendanceSummary !== summary.attendance_summary) {
      return {
        ...summary,
        attendance_summary: nextAttendanceSummary,
      }
    }
  }

  return summary
}

const GuruDashboard = ({ data, authUser }) => {
  const { profile, summary, recent_bk_cases } = data
  const [summaryState, setSummaryState] = useState(summary || {})
  const [todayAttendanceRecord, setTodayAttendanceRecord] = useState(null)

  useEffect(() => {
    setSummaryState(summary || {})
  }, [summary])

  useEffect(() => {
    setTodayAttendanceRecord(null)
  }, [profile?.id])

  const handleAttendanceRecorded = useCallback((record) => {
    setSummaryState((current) => updateGuruAttendanceSummary(current, record))
  }, [])

  const handleAttendanceStateChange = useCallback((record) => {
    setTodayAttendanceRecord(record)
  }, [])

  const hasCheckedInToday = useMemo(() => {
    if (todayAttendanceRecord) return true
    return hasCheckedInFromSummary(summaryState)
  }, [summaryState, todayAttendanceRecord])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Selamat Datang, {profile?.nama || 'Guru'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          NIP: {profile?.nip || '-'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Siswa Perwalian"
          value={summaryState?.total_siswa_wali || 0}
          icon={Users}
          color="text-blue-600"
        />
        <StatCard
          title="Mata Pelajaran"
          value={summaryState?.total_mata_pelajaran || 0}
          icon={BookOpen}
          color="text-green-600"
        />
        <StatCard
          title="Kelas Wali"
          value={summaryState?.total_kelas_wali || 0}
          icon={GraduationCap}
          color="text-purple-600"
        />
        <StatCard
          title="Tugas Belum Dinilai"
          value={summaryState?.tugas_belum_dinilai || 0}
          icon={ClipboardCheck}
          color="text-orange-600"
        />
        <StatCard
          title="Sudah Absen Hari Ini"
          value={hasCheckedInToday ? 'Ya' : 'Belum'}
          icon={CheckCircle2}
          color={hasCheckedInToday ? 'text-emerald-600' : 'text-gray-500'}
          description={hasCheckedInToday ? 'Status kehadiran guru hari ini sudah tercatat' : 'Lakukan absen dari kartu di samping'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Kasus BK Terbaru">
            <div className="space-y-3">
              {(!recent_bk_cases || recent_bk_cases.length === 0) ? (
                <p className="text-gray-500 text-sm">Tidak ada kasus BK terbaru.</p>
              ) : (
                recent_bk_cases.map((kasus) => (
                  <div key={kasus.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0 dark:border-gray-700">
                    <div className="p-2 bg-red-50 text-red-600 rounded-full dark:bg-red-900/30">
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {kasus.siswa?.nama || 'Siswa'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {kasus.deskripsi || kasus.judul || 'Kasus BK'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <DashboardAttendanceCard
            role="guru"
            profile={profile}
            authUser={authUser}
            onAttendanceRecorded={handleAttendanceRecorded}
            onAttendanceStateChange={handleAttendanceStateChange}
          />
          <QuickActions role="guru" />
        </div>
      </div>
    </div>
  )
}

export default GuruDashboard