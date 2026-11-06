import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, Edit, Trash2, Clock, CalendarDays } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import ShiftModal from '../components/ShiftModal'
import { DAYS_OF_WEEK, normalizeTime } from '../constants/shiftConstants'
import { shiftService } from '../services/shiftService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const ShiftList = ({ embedded = false }) => {
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState(null)

  const fetchShifts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await shiftService.getAll({ per_page: 50 })
    setLoading(false)
    if (data?.data) {
      setShifts(data.data)
    } else if (error) {
      showError(error.message || 'Gagal memuat daftar shift')
    }
  }, [])

  useEffect(() => {
    fetchShifts()
  }, [fetchShifts])

  const handleEdit = (shift) => {
    setSelectedShift(shift)
    setModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedShift(null)
    setModalOpen(true)
  }

  const handleDelete = async (shift) => {
    const result = await showDeleteConfirm(`Shift ${shift.nama} (${shift.kode})`)
    if (!result.isConfirmed) return

    const { error } = await shiftService.delete(shift.id)
    if (!error) {
      showSuccess(`Shift ${shift.nama} berhasil dihapus`)
      fetchShifts()
    } else {
      showError(error.message || 'Gagal menghapus shift')
    }
  }


  return (
    <div className="space-y-4">
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="text-primary-600 dark:text-primary-400" />
              Shift & Jam Sekolah
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Atur jam masuk, jam pulang utama, dan jam kepulangan khusus per hari (misal Jumat).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={fetchShifts} disabled={loading} title="Refresh Data">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </Button>
            <PermissionGuard permission="shift.create">
              <Button variant="primary" size="sm" onClick={handleCreate}>
                <Plus size={16} className="mr-1" /> Tambah Shift
              </Button>
            </PermissionGuard>
          </div>
        </div>
      )}

      {loading && shifts.length === 0 ? (
        <Card className="p-8 text-center text-sm text-gray-500">Memuat shift sekolah...</Card>
      ) : shifts.length === 0 ? (
        <Card className="p-8 text-center">
          <Clock className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={36} />
          <p className="text-sm text-gray-500">Belum ada shift sekolah yang terdaftar.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {shifts.map((s) => {
            const jadwal = s.jadwal_harian || {}
            const hasOverrides = Object.keys(jadwal).length > 0

            return (
              <Card key={s.id} className="p-4 sm:p-5 hover:border-primary-300 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300">
                      {s.kode}
                    </span>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{s.nama}</h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${s.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-600'}`}>
                      {s.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    {hasOverrides && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        {Object.keys(jadwal).length} Hari Kustom
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <PermissionGuard permission="shift.update">
                      <Button variant="secondary" size="sm" onClick={() => handleEdit(s)}>
                        <Edit size={14} className="mr-1" /> Atur Jam Pulang
                      </Button>
                    </PermissionGuard>
                    {s.kode !== 'DEFAULT' && (
                      <PermissionGuard permission="shift.delete">
                        <Button variant="danger" size="sm" onClick={() => handleDelete(s)}>
                          <Trash2 size={14} />
                        </Button>
                      </PermissionGuard>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-3">
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <span className="text-[11px] text-gray-500 block">Jam Masuk Utama</span>
                    <span className="font-mono font-bold text-sm text-gray-900 dark:text-white">
                      {normalizeTime(s.jam_masuk) || '-'} WIB
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <span className="text-[11px] text-gray-500 block">Jam Pulang Utama</span>
                    <span className="font-mono font-bold text-sm text-amber-700 dark:text-amber-400">
                      {normalizeTime(s.jam_pulang) || '-'} WIB
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-gray-500 block">Toleransi Terlambat</span>
                    <span className="font-mono font-semibold text-sm text-gray-900 dark:text-white">
                      {s.toleransi_keterlambatan_menit ?? 0} menit
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 font-medium mb-2">
                    <CalendarDays size={14} className="text-primary-500" />
                    <span>Jadwal Kepulangan Per Hari:</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 text-xs">
                    {DAYS_OF_WEEK.map((d) => {
                      const override = jadwal[d.key]
                      const isCustom = Boolean(override)
                      const masuk = normalizeTime(override?.jam_masuk) || normalizeTime(s.jam_masuk)
                      const pulang = normalizeTime(override?.jam_pulang) || normalizeTime(s.jam_pulang)

                      return (
                        <div
                          key={d.key}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            isCustom
                              ? 'bg-amber-50/70 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700'
                              : 'bg-gray-50/50 border-gray-200 dark:bg-gray-800/30 dark:border-gray-800'
                          }`}
                        >
                          <div className="font-bold text-gray-800 dark:text-gray-200 text-[11px]">
                            {d.label}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {masuk} - <span className={isCustom ? 'font-bold text-amber-700 dark:text-amber-300' : ''}>{pulang}</span>
                          </div>
                          {isCustom ? (
                            <span className="inline-block mt-1 text-[9px] px-1 py-0.2 rounded font-semibold bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                              Kustom
                            </span>
                          ) : (
                            <span className="inline-block mt-1 text-[9px] text-gray-400">
                              Default
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ShiftModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        shift={selectedShift}
        onSuccess={fetchShifts}
      />
    </div>
  )
}

export default ShiftList
