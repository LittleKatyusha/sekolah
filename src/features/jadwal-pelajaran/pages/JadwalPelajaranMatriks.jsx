import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, CheckCircle, AlertCircle, AlertTriangle, RefreshCw, Plus, Trash2, Clock, Sparkles } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { jadwalPelajaranService } from '../services/jadwalPelajaranService'
import { kelasService } from '../../kelas/services/kelasService'
import { guruMapelService } from '../../guru-mapel/services/guruMapelService'
import { hariOperasionalService } from '../../hari-operasional/services/hariOperasionalService'
import { showSuccess, showError, showConfirm } from '../../../utils/sweetalert'

const DEFAULT_DAYS = [
  { key: 'MON', label: 'Senin' },
  { key: 'TUE', label: 'Selasa' },
  { key: 'WED', label: 'Rabu' },
  { key: 'THU', label: 'Kamis' },
  { key: 'FRI', label: 'Jumat' },
  { key: 'SAT', label: 'Sabtu' },
]

const DEFAULT_PERIODS = [
  { id: '1', label: 'Jam 1', jam_mulai: '07:00', jam_selesai: '07:45' },
  { id: '2', label: 'Jam 2', jam_mulai: '07:45', jam_selesai: '08:30' },
  { id: '3', label: 'Jam 3', jam_mulai: '08:30', jam_selesai: '09:15' },
  { id: '4', label: 'Jam 4', jam_mulai: '09:15', jam_selesai: '10:00' },
  { id: '5', label: 'Jam 5', jam_mulai: '10:15', jam_selesai: '11:00' },
  { id: '6', label: 'Jam 6', jam_mulai: '11:00', jam_selesai: '11:45' },
  { id: '7', label: 'Jam 7', jam_mulai: '12:30', jam_selesai: '13:15' },
  { id: '8', label: 'Jam 8', jam_mulai: '13:15', jam_selesai: '14:00' },
]

const JadwalPelajaranMatriks = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [kelasList, setKelasList] = useState([])
  const [selectedKelasId, setSelectedKelasId] = useState(searchParams.get('kelas_id') || '')
  const [guruMapelOptions, setGuruMapelOptions] = useState([])
  const [periods, setPeriods] = useState(DEFAULT_PERIODS)
  const [days, setDays] = useState(DEFAULT_DAYS)

  const [matrix, setMatrix] = useState({})
  const [conflicts, setConflicts] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingSchedules, setLoadingSchedules] = useState(false)
  const [validating, setValidating] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMasterData()
  }, [])

  useEffect(() => {
    if (selectedKelasId) {
      setSearchParams({ kelas_id: selectedKelasId })
      fetchClassSchedule(selectedKelasId)
    } else {
      setMatrix({})
      setConflicts([])
    }
  }, [selectedKelasId])

  const fetchMasterData = async () => {
    setLoading(true)
    try {
      const [resKelas, resGM, resHari] = await Promise.all([
        kelasService.getAll({ per_page: 100 }),
        guruMapelService.getGuruMapel({ per_page: 300 }),
        hariOperasionalService.getAll({ per_page: 50 }).catch(() => ({ data: null })),
      ])

      if (resKelas?.data?.data) {
        setKelasList(resKelas.data.data)
        if (!selectedKelasId && resKelas.data.data.length > 0) {
          setSelectedKelasId(String(resKelas.data.data[0].id))
        }
      }

      if (resGM?.data?.data) {
        setGuruMapelOptions(
          resGM.data.data.map((gm) => ({
            value: String(gm.id),
            label: `${gm.mapel?.nama || gm.mapel?.nama_mapel || 'Mapel'} - ${gm.guru?.nama || 'Guru'}`,
          }))
        )
      }

      if (resHari?.data?.data && Array.isArray(resHari.data.data)) {
        const activeDays = resHari.data.data
          .filter((d) => d.is_active)
          .map((d) => DEFAULT_DAYS.find((def) => def.key === d.hari) || { key: d.hari, label: d.hari })
        if (activeDays.length > 0) setDays(activeDays)
      }
    } catch (err) {
      console.error('Failed to load master data:', err)
      showError('Gagal memuat data kelas & guru mapel.')
    } finally {
      setLoading(false)
    }
  }

  const fetchClassSchedule = async (kelasId) => {
    setLoadingSchedules(true)
    setConflicts([])
    try {
      const { data, error } = await jadwalPelajaranService.getByKelas(kelasId)
      if (error) {
        showError('Gagal memuat jadwal pelajaran kelas.')
        return
      }

      const rawItems = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      const currentPeriods = [...DEFAULT_PERIODS]

      rawItems.forEach((item) => {
        const start = item.jam_mulai ? String(item.jam_mulai).slice(0, 5) : ''
        const end = item.jam_selesai ? String(item.jam_selesai).slice(0, 5) : ''
        if (start && end && !currentPeriods.some((p) => p.jam_mulai === start && p.jam_selesai === end)) {
          currentPeriods.push({
            id: `custom_${start}_${end}`,
            label: `${start} - ${end}`,
            jam_mulai: start,
            jam_selesai: end,
          })
        }
      })

      currentPeriods.sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai))
      setPeriods(currentPeriods)

      const newMatrix = {}
      rawItems.forEach((item) => {
        const start = item.jam_mulai ? String(item.jam_mulai).slice(0, 5) : ''
        const end = item.jam_selesai ? String(item.jam_selesai).slice(0, 5) : ''
        const period = currentPeriods.find((p) => p.jam_mulai === start && p.jam_selesai === end)
        if (period && item.hari) {
          newMatrix[`${period.id}_${item.hari}`] = {
            mst_guru_mapel_id: String(item.guru_mapel?.id || item.mst_guru_mapel_id || ''),
            ruangan: item.ruangan || '',
          }
        }
      })

      setMatrix(newMatrix)
    } catch (err) {
      console.error('Failed to load class schedule:', err)
    } finally {
      setLoadingSchedules(false)
    }
  }

  const handleCellChange = useCallback((cellKey, field, value) => {
    setMatrix((prev) => {
      const existing = prev[cellKey] || { mst_guru_mapel_id: '', ruangan: '' }
      const updated = { ...existing, [field]: value }
      if (!updated.mst_guru_mapel_id && !updated.ruangan) {
        const clone = { ...prev }
        delete clone[cellKey]
        return clone
      }
      return { ...prev, [cellKey]: updated }
    })
    setConflicts((prev) => prev.filter((c) => c.cellKey !== cellKey))
  }, [])

  const handleClearCell = useCallback((cellKey) => {
    setMatrix((prev) => {
      const clone = { ...prev }
      delete clone[cellKey]
      return clone
    })
    setConflicts((prev) => prev.filter((c) => c.cellKey !== cellKey))
  }, [])

  const buildPayloadSchedule = useCallback(() => {
    const list = []
    periods.forEach((period) => {
      days.forEach((day) => {
        const cellKey = `${period.id}_${day.key}`
        const cell = matrix[cellKey]
        if (cell && cell.mst_guru_mapel_id) {
          list.push({
            hari: day.key,
            jam_mulai: period.jam_mulai,
            jam_selesai: period.jam_selesai,
            mst_guru_mapel_id: parseInt(cell.mst_guru_mapel_id, 10),
            ruangan: cell.ruangan ? cell.ruangan.trim() : null,
            _cellKey: cellKey,
          })
        }
      })
    })
    return list
  }, [matrix, periods, days])

  const mapBackendConflicts = useCallback((rawConflicts) => {
    if (!Array.isArray(rawConflicts)) return []
    return rawConflicts.map((cd) => {
      const target = periods.find((p) => p.jam_mulai === cd.jam_mulai && p.jam_selesai === cd.jam_selesai)
      return {
        ...cd,
        cellKey: target ? `${target.id}_${cd.hari}` : null,
      }
    })
  }, [periods])

  const handleValidateConflicts = async (silentOnSuccess = false) => {
    if (!selectedKelasId) {
      showError('Pilih kelas terlebih dahulu.')
      return false
    }

    const payloadList = buildPayloadSchedule()
    if (payloadList.length === 0) {
      if (!silentOnSuccess) showSuccess('Matriks kosong (tidak ada jadwal yang dikonfigurasi).')
      setConflicts([])
      return true
    }

    setValidating(true)
    setConflicts([])

    try {
      const { data, error } = await jadwalPelajaranService.batchStore({
        mst_kelas_id: parseInt(selectedKelasId, 10),
        jadwal: payloadList.map(({ _cellKey, ...clean }) => clean),
        validate_only: true,
        replace_existing: true,
      })

      if (error) {
        const details = error.conflict_details || error.errors?.conflict_details || []
        const mapped = mapBackendConflicts(details)
        setConflicts(mapped.length > 0 ? mapped : (error.conflicts || error.errors?.conflicts || []).map((m) => ({ message: m })))
        showError(error.message || `Terdeteksi ${mapped.length || 'beberapa'} bentrok jadwal.`)
        return false
      }

      if (data?.data && data.data.valid === false) {
        const mapped = mapBackendConflicts(data.data.conflicts || [])
        setConflicts(mapped)
        showError(`Terdeteksi ${mapped.length} bentrok jadwal pelajaran.`)
        return false
      }

      setConflicts([])
      if (!silentOnSuccess) showSuccess('Jadwal valid! Tidak terdeteksi bentrok guru maupun ruangan.')
      return true
    } catch (err) {
      console.error('Validation error:', err)
      showError('Gagal memvalidasi bentrok jadwal: ' + err.message)
      return false
    } finally {
      setValidating(false)
    }
  }

  const handleSaveMatrix = async () => {
    if (!selectedKelasId) {
      showError('Pilih kelas terlebih dahulu.')
      return
    }

    const payloadList = buildPayloadSchedule()
    const confirmMsg = payloadList.length === 0
      ? 'Matriks jadwal kosong. Tindakan ini akan mengosongkan seluruh jadwal kelas ini. Lanjutkan?'
      : `Simpan ${payloadList.length} slot jadwal pelajaran untuk kelas ini?`

    const confirmed = await showConfirm(confirmMsg)
    if (!confirmed) return

    setSaving(true)
    try {
      const { data, error } = await jadwalPelajaranService.batchStore({
        mst_kelas_id: parseInt(selectedKelasId, 10),
        jadwal: payloadList.map(({ _cellKey, ...clean }) => clean),
        replace_existing: true,
      })

      if (error) {
        const details = error.conflict_details || error.errors?.conflict_details || []
        const mapped = mapBackendConflicts(details)
        setConflicts(mapped)
        showError(error.message || 'Gagal menyimpan jadwal karena bentrok.')
        return
      }

      setConflicts([])
      showSuccess(data?.message || 'Matriks jadwal pelajaran berhasil disimpan!')
      fetchClassSchedule(selectedKelasId)
    } catch (err) {
      console.error('Save error:', err)
      showError('Terjadi kesalahan saat menyimpan jadwal.')
    } finally {
      setSaving(false)
    }
  }

  const conflictMap = useMemo(() => {
    const map = {}
    conflicts.forEach((c) => {
      if (c.cellKey) map[c.cellKey] = c.message
    })
    return map
  }, [conflicts])

  const filledSlotsCount = useMemo(() => {
    return Object.values(matrix).filter((cell) => cell?.mst_guru_mapel_id).length
  }, [matrix])

  const handleAddPeriod = () => {
    const nextIdx = periods.length + 1
    const lastPeriod = periods[periods.length - 1]
    let start = '14:00'
    let end = '14:45'
    if (lastPeriod?.jam_selesai) {
      start = lastPeriod.jam_selesai
      const [h, m] = start.split(':').map(Number)
      const endTotal = h * 60 + m + 45
      const endH = String(Math.floor(endTotal / 60)).padStart(2, '0')
      const endM = String(endTotal % 60).padStart(2, '0')
      end = `${endH}:${endM}`
    }

    setPeriods((prev) => [
      ...prev,
      { id: String(nextIdx), label: `Jam ${nextIdx}`, jam_mulai: start, jam_selesai: end },
    ])
  }

  // ponytail: drag-and-drop cell swap skipped; add when visual schedule drag-and-drop requested.

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => navigate('/jadwal-pelajaran')} title="Kembali" className="p-2">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="text-indigo-600 dark:text-indigo-400" size={24} />
              Matriks Jadwal Pelajaran Mingguan
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Penyusunan jadwal interaktif per kelas (Senin - Sabtu x Jam 1 - 8) dengan deteksi bentrok otomatis.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => handleValidateConflicts(false)}
            disabled={validating || saving || loadingSchedules || !selectedKelasId}
            title="Validasi bentrok jadwal guru dan ruangan"
            className="flex items-center gap-1.5 border-amber-400 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
          >
            <AlertTriangle size={16} />
            {validating ? 'Mengecek...' : 'Cek Bentrok'}
          </Button>

          <Button
            onClick={handleSaveMatrix}
            disabled={saving || validating || loadingSchedules || !selectedKelasId}
            className="flex items-center gap-1.5"
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : 'Simpan Matriks'}
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <label htmlFor="select-kelas" className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Pilih Kelas:
            </label>
            <select
              id="select-kelas"
              value={selectedKelasId}
              onChange={(e) => setSelectedKelasId(e.target.value)}
              disabled={loading || saving}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900 dark:text-white"
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas} (Tingkat {k.tingkat})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-800">
              <Clock size={14} /> Terisi: <strong className="text-sm">{filledSlotsCount}</strong> slot
            </span>

            {conflicts.length > 0 ? (
              <span className="flex items-center gap-1.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-full border border-red-300 dark:border-red-800 animate-pulse">
                <AlertCircle size={14} /> Bentrok: <strong className="text-sm">{conflicts.length}</strong>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <CheckCircle size={14} /> Bebas Bentrok
              </span>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => selectedKelasId && fetchClassSchedule(selectedKelasId)}
              disabled={loadingSchedules || !selectedKelasId}
              title="Muat Ulang"
            >
              <RefreshCw size={14} className={loadingSchedules ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
      </Card>

      {conflicts.length > 0 && (
        <div role="alert" className="p-4 bg-red-50 dark:bg-red-950/40 border-2 border-red-400 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0" />
            <span>Terdeteksi {conflicts.length} Bentrok Jadwal Mengajar / Ruangan:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs pl-2">
            {conflicts.map((c, idx) => (
              <li key={idx}>{c.message || `${c.type}: ${c.hari} (${c.jam_mulai} - ${c.jam_selesai})`}</li>
            ))}
          </ul>
        </div>
      )}

      <Card className="overflow-hidden p-0 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 sticky left-0 z-20 bg-gray-100 dark:bg-gray-800 min-w-[130px] border-r border-gray-200 dark:border-gray-700 text-center font-bold">
                  Jam / Waktu
                </th>
                {days.map((day) => (
                  <th key={day.key} className="p-3 min-w-[210px] text-center font-bold border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                    <div>{day.label}</div>
                    <span className="text-[11px] font-normal text-gray-500 dark:text-gray-400">({day.key})</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {periods.map((period) => (
                <tr key={period.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                  <td className="p-2.5 sticky left-0 z-10 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 text-center">
                    <div className="font-semibold text-gray-900 dark:text-white text-xs">{period.label}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                      {period.jam_mulai} - {period.jam_selesai}
                    </div>
                  </td>
                  {days.map((day) => {
                    const cellKey = `${period.id}_${day.key}`
                    const cell = matrix[cellKey] || { mst_guru_mapel_id: '', ruangan: '' }
                    const hasConflict = !!conflictMap[cellKey]
                    const conflictMsg = conflictMap[cellKey]
                    const isFilled = !!cell.mst_guru_mapel_id

                    return (
                      <td
                        key={cellKey}
                        className={`p-2 align-top border-r border-gray-200 dark:border-gray-700 last:border-r-0 transition-colors ${
                          hasConflict ? 'bg-red-50 dark:bg-red-950/40' : isFilled ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        <div
                          className={`flex flex-col gap-1.5 p-2 rounded-md border transition-all ${
                            hasConflict
                              ? 'border-red-500 shadow-sm ring-1 ring-red-400 bg-white dark:bg-gray-900'
                              : isFilled
                              ? 'border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-900'
                              : 'border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 bg-transparent'
                          }`}
                        >
                          <select
                            value={cell.mst_guru_mapel_id}
                            onChange={(e) => handleCellChange(cellKey, 'mst_guru_mapel_id', e.target.value)}
                            aria-label={`Pilih guru mapel ${day.label} ${period.label}`}
                            className={`w-full text-xs py-1 px-1.5 rounded border ${
                              hasConflict
                                ? 'border-red-300 text-red-900 dark:text-red-200 bg-red-50/50 dark:bg-red-950/30'
                                : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                          >
                            <option value="">-- Kosong --</option>
                            {guruMapelOptions.map((gm) => (
                              <option key={gm.value} value={gm.value}>
                                {gm.label}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={cell.ruangan}
                              placeholder="Ruang (opsional)"
                              onChange={(e) => handleCellChange(cellKey, 'ruangan', e.target.value)}
                              aria-label={`Ruangan ${day.label} ${period.label}`}
                              className={`flex-1 text-[11px] py-1 px-1.5 rounded border ${
                                hasConflict
                                  ? 'border-red-300 text-red-900 dark:text-red-200 bg-red-50/50 dark:bg-red-950/30'
                                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                              } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                            />

                            {isFilled && (
                              <button
                                type="button"
                                onClick={() => handleClearCell(cellKey)}
                                title="Kosongkan slot"
                                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>

                          {hasConflict && (
                            <div className="text-[10px] text-red-600 dark:text-red-400 leading-tight flex items-start gap-1 font-medium mt-0.5">
                              <AlertCircle size={11} className="shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{conflictMsg}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button variant="secondary" size="sm" onClick={handleAddPeriod} className="flex items-center gap-1 text-xs">
            <Plus size={14} />
            Tambah Jam Pelajaran
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default JadwalPelajaranMatriks

