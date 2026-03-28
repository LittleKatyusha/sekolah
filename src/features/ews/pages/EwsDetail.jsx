import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, BellRing, CheckCircle2, Clock3, RotateCw, ShieldAlert, UserRound } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { siswaService } from '../../siswa/services/siswaService'
import { ewsService } from '../services/ewsService'
import { showConfirm, showError, showSuccess } from '../../../utils/sweetalert'
import usePermission from '../../../hooks/usePermission'

const CATEGORY_META = {
  absensi: {
    label: 'Absensi',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
  nilai: {
    label: 'Nilai',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  perilaku: {
    label: 'Perilaku',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  },
}

const LEVEL_META = {
  1: { label: 'Level 1 · Rendah', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400' },
  2: { label: 'Level 2 · Sedang', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  3: { label: 'Level 3 · Tinggi', badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const FIELD_LABELS = {
  jumlah_hari_absen: 'Jumlah hari absen',
  threshold: 'Ambang minimum',
  periode: 'Periode',
  rata_rata: 'Rata-rata',
  jumlah_kasus: 'Jumlah kasus',
}

const formatDateTime = (value) => {
  if (!value) return '-'

  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getCategoryMeta = (kategori) => {
  return CATEGORY_META[kategori] || {
    label: kategori || '-',
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  }
}

const getLevelMeta = (level) => {
  return LEVEL_META[level] || {
    label: `Level ${level || '-'}`,
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  }
}

const getSiswaLabel = (alert, siswa) => {
  if (siswa?.nama) {
    return siswa.nis ? `${siswa.nama} (${siswa.nis})` : siswa.nama
  }

  if (alert?.siswa?.nama) {
    return alert.siswa.nis ? `${alert.siswa.nama} (${alert.siswa.nis})` : alert.siswa.nama
  }

  return alert?.mst_siswa_id ? `Siswa ID ${alert.mst_siswa_id}` : '-'
}

const InfoRow = ({ label, value }) => (
  <div className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white break-words">{value || '-'}</p>
  </div>
)

const EwsDetail = () => {
  const { can } = usePermission()
  const { id } = useParams()
  const navigate = useNavigate()
  const [alert, setAlert] = useState(null)
  const [siswa, setSiswa] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const hydrateSiswa = useCallback(async (siswaId) => {
    if (!siswaId) return

    const { data } = await siswaService.getById(siswaId)
    if (data?.data) {
      setSiswa(data.data)
    }
  }, [])

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    const { data, error } = await ewsService.getById(id)

    if (error || !data?.data) {
      showError(error?.message || 'Gagal mengambil detail alert EWS')
      navigate('/ews')
      setLoading(false)
      return
    }

    const nextAlert = data.data
    setAlert(nextAlert)
    setSiswa(nextAlert.siswa || null)
    setLoading(false)

    if (!nextAlert.siswa?.nama && nextAlert.mst_siswa_id) {
      hydrateSiswa(nextAlert.mst_siswa_id)
    }
  }, [hydrateSiswa, id, navigate])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  const handleResolve = useCallback(async () => {
    if (!alert || alert.is_resolved) return

    const result = await showConfirm(
      `Alert untuk ${getSiswaLabel(alert, siswa)} akan ditandai selesai.`,
      'Selesaikan alert?'
    )

    if (!result.isConfirmed) return

    setSubmitting(true)
    const { error } = await ewsService.resolve(alert.id)
    setSubmitting(false)

    if (error) {
      showError(error.message || 'Gagal menyelesaikan alert EWS')
      return
    }

    showSuccess('Alert EWS berhasil ditandai selesai')
    fetchDetail()
  }, [alert, fetchDetail, siswa])

  const handleTrigger = useCallback(async () => {
    if (!alert?.mst_siswa_id) return

    const result = await showConfirm(
      `Semua rule EWS akan dijalankan ulang untuk ${getSiswaLabel(alert, siswa)}.`,
      'Jalankan trigger EWS?'
    )

    if (!result.isConfirmed) return

    setSubmitting(true)
    const { error } = await ewsService.trigger(alert.mst_siswa_id)
    setSubmitting(false)

    if (error) {
      showError(error.message || 'Gagal menjalankan trigger EWS')
      return
    }

    showSuccess('Trigger EWS berhasil dijalankan')
    fetchDetail()
  }, [alert, fetchDetail, siswa])

  const supportEntries = useMemo(() => {
    return Object.entries(alert?.data_pendukung || {})
  }, [alert])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!alert) {
    return null
  }

  const categoryMeta = getCategoryMeta(alert.kategori)
  const levelMeta = getLevelMeta(Number(alert.level))

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/ews')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Alert EWS</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Alert #{alert.id}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" onClick={handleTrigger} disabled={submitting || !alert.mst_siswa_id}>
            <RotateCw size={18} className="mr-2" />
            Trigger Ulang
          </Button>
          <Button
            variant={alert.is_resolved ? 'success' : 'primary'}
            onClick={handleResolve}
            disabled={submitting || alert.is_resolved}
          >
            <CheckCircle2 size={18} className="mr-2" />
            {alert.is_resolved ? 'Sudah Resolved' : 'Resolve'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1 p-0 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center mb-4">
              <BellRing size={28} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{alert.pesan || 'Alert tanpa pesan'}</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{getSiswaLabel(alert, siswa)}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${categoryMeta.badge}`}>
                {categoryMeta.label}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${levelMeta.badge}`}>
                {levelMeta.label}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${alert.is_resolved ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                {alert.is_resolved ? 'Sudah ditangani' : 'Belum ditangani'}
              </span>
            </div>
          </div>

          <div className="px-6 pb-6">
            <InfoRow label="Alert ID" value={alert.id} />
            <InfoRow label="Siswa ID" value={alert.mst_siswa_id} />
            <InfoRow label="Resolved By" value={alert.resolved_by || '-'} />
            <InfoRow label="Resolved At" value={formatDateTime(alert.resolved_at)} />
            <InfoRow label="Created At" value={formatDateTime(alert.created_at)} />
            <InfoRow label="Updated At" value={formatDateTime(alert.updated_at)} />
          </div>
        </Card>

        <div className="xl:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <UserRound size={18} className="text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informasi Siswa</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Nama</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{siswa?.nama || alert.siswa?.nama || '-'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">NIS</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{siswa?.nis || alert.siswa?.nis || '-'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Jenis Kelamin</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{siswa?.jenis_kelamin || '-'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Kelas</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{siswa?.kelas?.nama_kelas || siswa?.nama_kelas || '-'}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert size={18} className="text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Indikator Alert</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Kategori</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{categoryMeta.label}</p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Level</p>
                <p className="mt-1 font-medium text-gray-900 dark:text-white">{levelMeta.label}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-900/40">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pesan alert</p>
                  <p className="mt-1 text-base font-medium text-gray-900 dark:text-white">{alert.pesan || '-'}</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock3 size={18} className="text-gray-500 dark:text-gray-400" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Data Pendukung</h3>
              </div>

              {supportEntries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-5 text-sm text-gray-500 dark:text-gray-400">
                  Tidak ada data pendukung tambahan pada alert ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supportEntries.map(([key, value]) => (
                    <div key={key} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{FIELD_LABELS[key] || key}</p>
                      <p className="mt-1 font-medium text-gray-900 dark:text-white break-words">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default EwsDetail