import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { RefreshCw, Calendar, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { kalenderHarianService } from '../services/kalenderHarianService'
import { tahunAjaranService } from '../../tahun-ajaran/services/tahunAjaranService'
import { semesterService } from '../../semester/services/semesterService'
import { showSuccess, showError } from '../../../utils/sweetalert'

// ── Indonesian locale constants ──────────────────────────────────────────────
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const DAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

// ── Helper: build calendar grid for a month ──────────────────────────────────
const buildCalendarDays = (year, month) => {
  // month is 0-indexed here (JS Date convention)
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  // getDay() returns 0=Sun … 6=Sat → convert to Mon=0 … Sun=6
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const cells = []

  // Leading blanks
  for (let i = 0; i < startDow; i++) {
    cells.push(null)
  }

  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d)
  }

  // Trailing blanks to fill last row
  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

// ── Helper: format date string ───────────────────────────────────────────────
const formatDateNice = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Day Detail Popover ───────────────────────────────────────────────────────
const DayPopover = ({ data, position, onClose, onToggle }) => {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Adjust position to stay within viewport
  const adjustedStyle = useMemo(() => {
    const style = { position: 'fixed', zIndex: 10000 }
    const popoverWidth = 280
    const popoverHeight = 220

    let top = position.top
    let left = position.left

    // Keep within viewport
    if (left + popoverWidth > window.innerWidth) {
      left = window.innerWidth - popoverWidth - 16
    }
    if (left < 8) left = 8
    if (top + popoverHeight > window.innerHeight) {
      top = position.top - popoverHeight - 8
    }
    if (top < 8) top = 8

    style.top = `${top}px`
    style.left = `${left}px`
    return style
  }, [position])

  if (!data) return null

  const toggleItems = [
    { field: 'is_operasional', label: 'Operasional', color: 'green' },
    { field: 'is_libur', label: 'Libur', color: 'red' },
    { field: 'is_efektif', label: 'Efektif', color: 'blue' },
  ]

  return createPortal(
    <div
      ref={menuRef}
      className="w-[280px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      style={adjustedStyle}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {formatDateNice(data.tanggal)}
        </span>
        <button
          onClick={onClose}
          className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
        >
          <X size={16} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Toggle switches */}
      <div className="p-4 space-y-3">
        {toggleItems.map(({ field, label, color }) => (
          <div key={field} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                color === 'green' ? 'bg-green-500' :
                color === 'red' ? 'bg-red-500' : 'bg-blue-500'
              }`} />
              <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            </div>
            <PermissionGuard permission="kalender-harian.edit">
              <button
                onClick={() => onToggle(data, field)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  data[field]
                    ? color === 'green' ? 'bg-green-500 focus:ring-green-500'
                      : color === 'red' ? 'bg-red-500 focus:ring-red-500'
                      : 'bg-blue-500 focus:ring-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600 focus:ring-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    data[field] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </PermissionGuard>
          </div>
        ))}
      </div>

      {/* Status summary */}
      <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
        {data.is_operasional && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Operasional
          </span>
        )}
        {data.is_libur && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Libur
          </span>
        )}
        {data.is_efektif && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Efektif
          </span>
        )}
        {!data.is_operasional && !data.is_libur && !data.is_efektif && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            Tidak ada status
          </span>
        )}
      </div>
    </div>,
    document.body
  )
}

// ── Generate Modal (preserved from original) ─────────────────────────────────
const GenerateModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    tanggal_mulai: '',
    tanggal_selesai: '',
    tahun_ajaran_id: '',
    semester_id: '',
  })
  const [tahunAjaranList, setTahunAjaranList] = useState([])
  const [semesterList, setSemesterList] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoadingOptions(true)
      Promise.all([
        tahunAjaranService.getAll({ per_page: 100 }),
        semesterService.getAll({ per_page: 100 }),
      ])
        .then(([tahunRes, semesterRes]) => {
          if (tahunRes.data) {
            setTahunAjaranList(tahunRes.data.data || [])
          }
          if (semesterRes.data) {
            setSemesterList(semesterRes.data.data || [])
          }
        })
        .catch(() => {
          showError('Gagal mengambil data referensi')
        })
        .finally(() => {
          setLoadingOptions(false)
        })
    }
  }, [isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.tanggal_mulai || !formData.tanggal_selesai || !formData.tahun_ajaran_id || !formData.semester_id) {
      showError('Semua field wajib diisi')
      return
    }
    if (formData.tanggal_selesai <= formData.tanggal_mulai) {
      showError('Tanggal selesai harus setelah tanggal mulai')
      return
    }
    onSubmit({
      ...formData,
      tahun_ajaran_id: parseInt(formData.tahun_ajaran_id),
      semester_id: parseInt(formData.semester_id),
    })
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Kalender Harian</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tanggal Mulai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="tanggal_mulai"
              value={formData.tanggal_mulai}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tanggal Selesai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="tanggal_selesai"
              value={formData.tanggal_selesai}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tahun Ajaran <span className="text-red-500">*</span>
            </label>
            <select
              name="tahun_ajaran_id"
              value={formData.tahun_ajaran_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              required
              disabled={loadingOptions}
            >
              <option value="">-- Pilih Tahun Ajaran --</option>
              {tahunAjaranList.map((ta) => (
                <option key={ta.id} value={ta.id}>
                  {ta.nama || ta.kode || `Tahun Ajaran ${ta.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Semester <span className="text-red-500">*</span>
            </label>
            <select
              name="semester_id"
              value={formData.semester_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              required
              disabled={loadingOptions}
            >
              <option value="">-- Pilih Semester --</option>
              {semesterList.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  {sem.nama || sem.kode || `Semester ${sem.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <PermissionGuard permission="kalender-harian.create">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Calendar size={16} />
                    Generate
                  </span>
                )}
              </Button>
            </PermissionGuard>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

// ── Main Calendar Component ──────────────────────────────────────────────────
const KalenderHarianList = () => {
  const now = new Date()
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()) // 0-indexed
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [popover, setPopover] = useState({ open: false, data: null, position: { top: 0, left: 0 } })

  // ── Fetch data for current month ────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await kalenderHarianService.getByMonth(currentYear, currentMonth + 1)
      if (res.data) {
        setData(res.data.data || [])
      }
    } catch {
      showError('Gagal mengambil data kalender harian')
    } finally {
      setLoading(false)
    }
  }, [currentYear, currentMonth])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Build a lookup map: day number → data record ────────────────────────
  const dayDataMap = useMemo(() => {
    const map = {}
    data.forEach((item) => {
      if (!item.tanggal) return
      const d = new Date(item.tanggal)
      map[d.getDate()] = item
    })
    return map
  }, [data])

  // ── Calendar grid cells ─────────────────────────────────────────────────
  const calendarCells = useMemo(
    () => buildCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  )

  // ── Navigation ──────────────────────────────────────────────────────────
  const goToPrevMonth = useCallback(() => {
    setPopover({ open: false, data: null, position: { top: 0, left: 0 } })
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }, [currentMonth])

  const goToNextMonth = useCallback(() => {
    setPopover({ open: false, data: null, position: { top: 0, left: 0 } })
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }, [currentMonth])

  const goToToday = useCallback(() => {
    setPopover({ open: false, data: null, position: { top: 0, left: 0 } })
    const today = new Date()
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth())
  }, [])

  // ── Toggle handler (same pattern as original) ──────────────────────────
  const handleToggle = useCallback(async (record, field) => {
    const newValue = !record[field]
    const { error } = await kalenderHarianService.update(record.id, { [field]: newValue })
    if (!error) {
      showSuccess(`${field.replace('is_', '').replace(/^\w/, (c) => c.toUpperCase())} berhasil diubah`)
      // Optimistic local update
      setData((prev) =>
        prev.map((item) =>
          item.id === record.id ? { ...item, [field]: newValue } : item
        )
      )
      // Also update popover data if it's the same record
      setPopover((prev) => {
        if (prev.open && prev.data?.id === record.id) {
          return { ...prev, data: { ...prev.data, [field]: newValue } }
        }
        return prev
      })
    } else {
      showError(`Gagal mengubah ${field.replace('is_', '')}`)
    }
  }, [])

  // ── Generate handler (preserved) ───────────────────────────────────────
  const handleGenerate = useCallback(async (formData) => {
    setGenerateLoading(true)
    const { error } = await kalenderHarianService.generate(formData)
    if (!error) {
      showSuccess('Kalender harian berhasil di-generate!')
      setShowGenerateModal(false)
      fetchData()
    } else {
      showError('Gagal generate kalender harian')
    }
    setGenerateLoading(false)
  }, [fetchData])

  // ── Day cell click handler ─────────────────────────────────────────────
  const handleDayClick = useCallback((dayNum, event) => {
    const dayData = dayDataMap[dayNum]
    if (!dayData) return

    const rect = event.currentTarget.getBoundingClientRect()
    setPopover({
      open: true,
      data: dayData,
      position: {
        top: rect.bottom + 4,
        left: rect.left,
      },
    })
  }, [dayDataMap])

  // ── Get cell background class ──────────────────────────────────────────
  const getCellBg = useCallback((dayData) => {
    if (!dayData) return 'bg-gray-50 dark:bg-gray-800/50'
    if (dayData.is_libur) return 'bg-red-50 dark:bg-red-900/20'
    if (dayData.is_efektif) return 'bg-green-50 dark:bg-green-900/20'
    if (dayData.is_operasional) return 'bg-blue-50 dark:bg-blue-900/20'
    return 'bg-gray-50 dark:bg-gray-800/50'
  }, [])

  // ── Check if a day is today ────────────────────────────────────────────
  const isToday = useCallback(
    (dayNum) => {
      const today = new Date()

      return dayNum &&
        currentYear === today.getFullYear() &&
        currentMonth === today.getMonth() &&
        dayNum === today.getDate()
    },
    [currentYear, currentMonth]
  )

  // ── Summary stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let operasional = 0
    let libur = 0
    let efektif = 0
    data.forEach((item) => {
      if (item.is_operasional) operasional++
      if (item.is_libur) libur++
      if (item.is_efektif) efektif++
    })
    return { operasional, libur, efektif, total: data.length }
  }, [data])

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kalender Harian</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola status harian: operasional, libur, dan efektif
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={fetchData} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </Button>
          <PermissionGuard permission="kalender-harian.create">
            <Button onClick={() => setShowGenerateModal(true)}>
              <Calendar size={18} className="mr-2" />
              Generate Kalender
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* ── Month Navigation ────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Bulan sebelumnya"
            >
              <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white min-w-[200px] text-center">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Bulan berikutnya"
            >
              <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={goToToday}
              className="ml-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Hari Ini
            </button>
          </div>

          {/* Stats summary */}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600 dark:text-gray-400">Operasional: {stats.operasional}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-600 dark:text-gray-400">Libur: {stats.libur}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">Efektif: {stats.efektif}</span>
            </span>
          </div>
        </div>

        {/* ── Loading overlay ─────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={32} className="animate-spin text-primary-500" />
            <span className="ml-3 text-gray-500 dark:text-gray-400">Memuat data...</span>
          </div>
        )}

        {/* ── Calendar Grid ───────────────────────────────────────────── */}
        {!loading && (
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_HEADERS.map((day, idx) => (
                  <div
                    key={day}
                    className={`text-center text-xs font-semibold py-2 rounded-lg ${
                      idx >= 5
                        ? 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10'
                        : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((dayNum, idx) => {
                  if (dayNum === null) {
                    return (
                      <div
                        key={`blank-${idx}`}
                        className="aspect-square min-h-[72px] sm:min-h-[88px] rounded-lg bg-gray-50/50 dark:bg-gray-800/30"
                      />
                    )
                  }

                  const dayData = dayDataMap[dayNum]
                  const cellBg = getCellBg(dayData)
                  const todayHighlight = isToday(dayNum)
                  const hasData = !!dayData
                  const isWeekend = idx % 7 >= 5

                  return (
                    <button
                      key={dayNum}
                      onClick={(e) => handleDayClick(dayNum, e)}
                      disabled={!hasData}
                      className={`
                        aspect-square min-h-[72px] sm:min-h-[88px] rounded-lg p-1.5 sm:p-2
                        flex flex-col items-start justify-between
                        border transition-all duration-150
                        ${cellBg}
                        ${todayHighlight
                          ? 'border-primary-500 dark:border-primary-400 ring-2 ring-primary-200 dark:ring-primary-800'
                          : 'border-gray-200 dark:border-gray-700'
                        }
                        ${hasData
                          ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]'
                          : 'cursor-default opacity-60'
                        }
                      `}
                    >
                      {/* Date number */}
                      <span
                        className={`
                          text-sm font-semibold leading-none
                          ${todayHighlight
                            ? 'bg-primary-500 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs'
                            : isWeekend
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-gray-800 dark:text-gray-200'
                          }
                        `}
                      >
                        {dayNum}
                      </span>

                      {/* Dot indicators */}
                      {hasData && (
                        <div className="flex items-center gap-1 mt-auto">
                          {dayData.is_operasional && (
                            <span className="w-2 h-2 rounded-full bg-green-500" title="Operasional" />
                          )}
                          {dayData.is_libur && (
                            <span className="w-2 h-2 rounded-full bg-red-500" title="Libur" />
                          )}
                          {dayData.is_efektif && (
                            <span className="w-2 h-2 rounded-full bg-blue-500" title="Efektif" />
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Legend ───────────────────────────────────────────────────── */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
            Legenda
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Libur</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Efektif</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Operasional</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Tidak ada data</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Dot Operasional</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Dot Libur</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Dot Efektif</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Day Detail Popover ───────────────────────────────────────── */}
      {popover.open && popover.data && (
        <DayPopover
          data={popover.data}
          position={popover.position}
          onClose={() => setPopover({ open: false, data: null, position: { top: 0, left: 0 } })}
          onToggle={handleToggle}
        />
      )}

      {/* ── Generate Modal ──────────────────────────────────────────── */}
      <GenerateModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onSubmit={handleGenerate}
        loading={generateLoading}
      />
    </div>
  )
}

export default KalenderHarianList
