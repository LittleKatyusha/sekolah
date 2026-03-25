import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ClipboardCheck, Clock3, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { absensiGuruService } from '../../absensi-guru/services/absensiGuruService'
import { absensiSiswaService } from '../../absensi-siswa/services/absensiSiswaService'
import { guruService } from '../../guru/services/guruService'
import { siswaService } from '../../siswa/services/siswaService'
import { showConfirm, showError, showSuccess } from '../../../utils/sweetalert'

const STATUS_META = {
  '1': { label: 'Hadir', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  '2': { label: 'Sakit', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  '3': { label: 'Izin', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  '4': { label: 'Alpha', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  hadir: { label: 'Hadir', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  sakit: { label: 'Sakit', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  izin: { label: 'Izin', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  alpha: { label: 'Alpha', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  alpa: { label: 'Alpha', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  tidak_hadir: { label: 'Tidak Hadir', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const getTodayString = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getTodayLabel = () => new Date().toLocaleDateString('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const normalizeStatus = (record) => {
  if (!record) return null
  const value = record.status_absensi ?? record.status ?? null
  if (value === null || value === undefined || value === '') return null
  return String(value).toLowerCase()
}

const extractRows = (responseData) => {
  const payload = responseData?.data
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const resolveEntityId = (role, profile, authUser) => {
  const authProfile = authUser?.profile || null
  const authRoleData = role === 'guru'
    ? (authUser?.guru || authProfile)
    : role === 'siswa'
      ? (authUser?.siswa || authProfile)
      : authProfile

  if (role === 'guru') {
    return profile?.mst_guru_id
      || authProfile?.mst_guru_id
      || profile?.guru_id
      || authProfile?.guru_id
      || authRoleData?.id
      || profile?.id
      || null
  }

  if (role === 'siswa') {
    return profile?.mst_siswa_id
      || authProfile?.mst_siswa_id
      || profile?.siswa_id
      || authProfile?.siswa_id
      || authRoleData?.id
      || profile?.id
      || null
  }

  return null
}

const buildRuntimePayloadSnapshot = (role, profile, authUser, entityId) => ({
  role,
  resolved_entity_id: entityId,
  dashboard_profile: {
    id: profile?.id ?? null,
    mst_guru_id: profile?.mst_guru_id ?? null,
    guru_id: profile?.guru_id ?? null,
    mst_siswa_id: profile?.mst_siswa_id ?? null,
    siswa_id: profile?.siswa_id ?? null,
    nama: profile?.nama ?? null,
    nip: profile?.nip ?? null,
    nis: profile?.nis ?? null,
  },
  auth_user: {
    id: authUser?.id ?? null,
    role: authUser?.role ?? null,
    profile: {
      id: authUser?.profile?.id ?? null,
      mst_guru_id: authUser?.profile?.mst_guru_id ?? null,
      guru_id: authUser?.profile?.guru_id ?? null,
      mst_siswa_id: authUser?.profile?.mst_siswa_id ?? null,
      siswa_id: authUser?.profile?.siswa_id ?? null,
      nama: authUser?.profile?.nama ?? null,
      nip: authUser?.profile?.nip ?? null,
      nis: authUser?.profile?.nis ?? null,
    },
  },
})

const extractCollectionRows = (responseData) => {
  const payload = responseData?.data
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const DashboardAttendanceCard = ({ role, profile, authUser, onAttendanceRecorded, onAttendanceStateChange }) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [todayRecord, setTodayRecord] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [fallbackEntityId, setFallbackEntityId] = useState(null)

  const today = useMemo(() => getTodayString(), [])
  const directEntityId = useMemo(() => resolveEntityId(role, profile, authUser), [authUser, role, profile])
  const entityId = directEntityId || fallbackEntityId
  const runtimeSnapshot = useMemo(
    () => buildRuntimePayloadSnapshot(role, profile, authUser, entityId),
    [authUser, entityId, profile, role]
  )

  const historyPath = role === 'guru' ? '/absensi-guru' : '/absensi-siswa'
  const title = role === 'guru' ? 'Absen Guru Hari Ini' : 'Absen Siswa Hari Ini'
  const nameLabel = role === 'guru' ? 'guru' : 'siswa'

  useEffect(() => {
    if (!import.meta.env.DEV) return

    console.groupCollapsed(`[DashboardAttendanceCard] ${role} runtime payload`)
    console.log(runtimeSnapshot)
    console.groupEnd()
  }, [role, runtimeSnapshot])

  useEffect(() => {
    if (directEntityId) {
      setFallbackEntityId(null)
      return
    }

    const identifier = role === 'guru'
      ? (profile?.nip || authUser?.profile?.nip || '')
      : (profile?.nis || authUser?.profile?.nis || '')

    if (!identifier) {
      setFallbackEntityId(null)
      return
    }

    let cancelled = false

    const resolveFromMasterData = async () => {
      const response = role === 'guru'
        ? await guruService.getAll({ search: identifier, per_page: 10 })
        : await siswaService.getAll({ search: identifier, per_page: 10 })

      if (cancelled || response.error) return

      const rows = extractCollectionRows(response.data)
      const matchedRecord = rows.find((item) => {
        if (role === 'guru') {
          return String(item?.nip || '') === String(identifier)
        }

        return String(item?.nis || '') === String(identifier)
      })

      if (matchedRecord?.id) {
        setFallbackEntityId(matchedRecord.id)
      }
    }

    resolveFromMasterData()

    return () => {
      cancelled = true
    }
  }, [authUser?.profile?.nip, authUser?.profile?.nis, directEntityId, profile?.nip, profile?.nis, role])

  const fetchTodayAttendance = useCallback(async () => {
    if (!entityId) {
      setTodayRecord(null)
      onAttendanceStateChange?.(null)
      setLoadError(`Data ${nameLabel} tidak ditemukan`)
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError('')

    let result
    if (role === 'guru') {
      result = await absensiGuruService.getByGuru(entityId, {
        params: {
          tanggal_mulai: today,
          tanggal_akhir: today,
          per_page: 10,
          sort_by: 'tanggal',
          sort_dir: 'desc',
        },
      })
    } else {
      result = await absensiSiswaService.getAbsensiBySiswa(entityId, {
        tanggal_mulai: today,
        tanggal_akhir: today,
        per_page: 10,
        sort_by: 'tanggal',
        sort_dir: 'desc',
      })
    }

    if (result.error) {
      setLoadError('Gagal memuat status absensi hari ini')
      setTodayRecord(null)
      onAttendanceStateChange?.(null)
      setLoading(false)
      return
    }

    const rows = extractRows(result.data)
    const record = rows.find((item) => item?.tanggal === today) || null
    setTodayRecord(record)
    onAttendanceStateChange?.(record)
    setLoading(false)
  }, [entityId, nameLabel, onAttendanceStateChange, role, today])

  useEffect(() => {
    fetchTodayAttendance()
  }, [fetchTodayAttendance])

  const handleSubmitAttendance = useCallback(async () => {
    if (!entityId) {
      showError(`Data ${nameLabel} tidak ditemukan`)
      return
    }

    const result = await showConfirm('Tandai kehadiran hari ini sebagai hadir?', 'Konfirmasi Absen')
    if (!result.isConfirmed) return

    setSubmitting(true)

    const payload = role === 'guru'
      ? { mst_guru_id: Number(entityId), tanggal: today, status: 1, keterangan: null }
      : { mst_siswa_id: Number(entityId), tanggal: today, status: 1, keterangan: null }

    const response = role === 'guru'
      ? await absensiGuruService.create(payload)
      : await absensiSiswaService.createAbsensiSiswa(payload)

    if (response.error) {
      showError(response.error?.message || 'Gagal menyimpan absensi hari ini')
      setSubmitting(false)
      return
    }

    const createdRecord = response.data?.data || {
      ...payload,
      id: null,
    }

    setTodayRecord(createdRecord)
    onAttendanceRecorded?.(createdRecord)
    onAttendanceStateChange?.(createdRecord)
    showSuccess('Absensi hari ini berhasil disimpan', 'Absen Berhasil')
    setSubmitting(false)
  }, [entityId, nameLabel, onAttendanceRecorded, onAttendanceStateChange, role, today])

  const statusKey = normalizeStatus(todayRecord)
  const statusMeta = STATUS_META[statusKey] || null
  const hasCheckedIn = Boolean(todayRecord)

  return (
    <Card title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-teal-100 p-3 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
            <ClipboardCheck size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {profile?.nama || '-'}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {getTodayLabel()}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
            <Clock3 size={16} />
            Memuat status absensi hari ini...
          </div>
        ) : loadError ? (
          <div className="space-y-3 rounded-xl bg-red-50 px-3 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <p>{loadError}</p>
            {import.meta.env.DEV && (
              <pre className="overflow-x-auto rounded-lg bg-black/5 p-3 text-[11px] leading-5 text-red-700 dark:bg-white/5 dark:text-red-300">
                {JSON.stringify(runtimeSnapshot, null, 2)}
              </pre>
            )}
          </div>
        ) : hasCheckedIn ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-900/40 dark:bg-green-900/10">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 size={16} />
              <span className="text-sm font-medium">Absensi hari ini sudah tercatat</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta?.className || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                {statusMeta?.label || 'Tercatat'}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            Anda belum melakukan absensi untuk hari ini.
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleSubmitAttendance}
            loading={submitting}
            disabled={loading || hasCheckedIn || !entityId}
            className="sm:flex-1"
          >
            <ClipboardCheck size={18} className="mr-2" />
            {hasCheckedIn ? 'Sudah Absen' : 'Absen Sekarang'}
          </Button>
          <Button variant="secondary" onClick={() => navigate(historyPath)} className="sm:flex-1">
            <ExternalLink size={18} className="mr-2" />
            Lihat Riwayat
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default DashboardAttendanceCard