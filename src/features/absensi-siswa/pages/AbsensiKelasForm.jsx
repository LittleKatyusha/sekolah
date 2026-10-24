import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Users,
  CheckCheck,
  RotateCcw,
  Search,
  AlertCircle,
  Clock,
  UserCheck,
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { absensiSiswaService } from '../services/absensiSiswaService'
import { kelasService } from '../../kelas/services/kelasService'
import { showSuccess, showError, showConfirm } from '../../../utils/sweetalert'

const STATUS_CONFIG = [
  { value: 1, key: 'hadir', label: 'Hadir', short: 'H', keyLabel: '1', activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-sm' },
  { value: 2, key: 'izin', label: 'Izin', short: 'I', keyLabel: '2', activeClass: 'bg-amber-500 text-white border-amber-500 shadow-sm' },
  { value: 3, key: 'sakit', label: 'Sakit', short: 'S', keyLabel: '3', activeClass: 'bg-blue-600 text-white border-blue-600 shadow-sm' },
  { value: 4, key: 'alpha', label: 'Alpha', short: 'A', keyLabel: '4', activeClass: 'bg-rose-600 text-white border-rose-600 shadow-sm' },
  { value: 5, key: 'terlambat', label: 'Terlambat', short: 'T', keyLabel: '5', activeClass: 'bg-purple-600 text-white border-purple-600 shadow-sm' },
]

const formatGender = (gender) => {
  if (!gender) return '-'
  const g = String(gender).toUpperCase()
  if (g === '1' || g === 'L' || g.startsWith('LAKI')) return 'L'
  if (g === '2' || g === 'P' || g.startsWith('PEREM')) return 'P'
  return gender
}

const getTodayString = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const AbsensiKelasForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialKelasId = searchParams.get('kelas_id') || ''
  const initialTanggal = searchParams.get('tanggal') || getTodayString()

  const [selectedKelasId, setSelectedKelasId] = useState(initialKelasId)
  const [selectedKelasOption, setSelectedKelasOption] = useState(null)
  const [tanggal, setTanggal] = useState(initialTanggal)

  const [siswaList, setSiswaList] = useState([])
  const [siswaRows, setSiswaRows] = useState({})
  const [loadingData, setLoadingData] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterKeyword, setFilterKeyword] = useState('')
  const [activeRowIndex, setActiveRowIndex] = useState(0)

  const noteRefs = useRef({})
  const tableRef = useRef(null)

  const buildKelasOption = useCallback((kelas) => ({
    value: String(kelas.id),
    label: kelas.nama_kelas || `Kelas #${kelas.id}`,
  }), [])

  const searchKelasOptions = useCallback(async (keyword = '') => {
    const { data, error } = await kelasService.getAll({
      search: keyword || undefined,
      per_page: 50,
    })
    if (Array.isArray(data?.data)) return data.data.map(buildKelasOption)
    if (error) console.error('Failed to fetch kelas:', error)
    return []
  }, [buildKelasOption])

  const hydrateKelasOption = useCallback(async (kelasId) => {
    if (!kelasId) {
      setSelectedKelasOption(null)
      return
    }
    const { data } = await kelasService.getById(kelasId)
    const kelas = data?.data
    if (kelas) setSelectedKelasOption(buildKelasOption(kelas))
  }, [buildKelasOption])

  useEffect(() => {
    if (initialKelasId) hydrateKelasOption(initialKelasId)
  }, [initialKelasId, hydrateKelasOption])

  const handleKelasChange = (e) => {
    const val = e.target.value
    setSelectedKelasId(val)
    if (!val) {
      setSelectedKelasOption(null)
      setSiswaList([])
      setSiswaRows({})
      return
    }
    hydrateKelasOption(val)
  }

  const loadData = useCallback(async () => {
    if (!selectedKelasId) {
      setSiswaList([])
      setSiswaRows({})
      return
    }

    setLoadingData(true)
    try {
      const [siswaRes, absensiRes] = await Promise.all([
        kelasService.getSiswaByKelasId(selectedKelasId),
        absensiSiswaService.getAbsensiSiswa({
          mst_kelas_id: selectedKelasId,
          tanggal,
          per_page: 1000,
        }),
      ])

      const rawSiswa = siswaRes.data?.data?.siswa || (Array.isArray(siswaRes.data?.data) ? siswaRes.data.data : [])
      const rawAbsensi = absensiRes.data?.data || (Array.isArray(absensiRes.data) ? absensiRes.data : [])
      const absensiList = Array.isArray(rawAbsensi) ? rawAbsensi : (Array.isArray(rawAbsensi?.data) ? rawAbsensi.data : [])

      const absensiMap = new Map()
      absensiList.forEach((a) => {
        absensiMap.set(String(a.mst_siswa_id), a)
      })

      const rows = {}
      rawSiswa.forEach((siswa) => {
        const sid = String(siswa.id)
        const record = absensiMap.get(sid)
        const statusVal = record?.status ?? (record?.status_absensi ? Number(record.status_absensi) : null)

        rows[sid] = {
          status: statusVal !== null && !isNaN(statusVal) ? Number(statusVal) : null,
          keterangan: record?.keterangan || '',
          jam_masuk: record?.jam_masuk || null,
          jam_pulang: record?.jam_pulang || null,
        }
      })

      setSiswaList(rawSiswa)
      setSiswaRows(rows)
      setActiveRowIndex(0)
    } catch (err) {
      console.error('Error loading absensi data:', err)
      showError('Gagal memuat data siswa dan presensi kelas')
    } finally {
      setLoadingData(false)
    }
  }, [selectedKelasId, tanggal])

  useEffect(() => {
    loadData()
  }, [loadData])

  const setRowStatus = useCallback((siswaId, statusNum) => {
    setSiswaRows((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        status: statusNum,
      },
    }))
  }, [])

  const setRowKeterangan = useCallback((siswaId, text) => {
    setSiswaRows((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        keterangan: text,
      },
    }))
  }, [])

  const handleMarkAllHadir = () => {
    if (siswaList.length === 0) return
    setSiswaRows((prev) => {
      const next = { ...prev }
      siswaList.forEach((s) => {
        const sid = String(s.id)
        next[sid] = {
          ...(next[sid] || {}),
          status: 1,
        }
      })
      return next
    })
    showSuccess(`Semua ${siswaList.length} siswa ditandai Hadir`)
  }

  const handleReset = async () => {
    if (siswaList.length === 0) return
    const res = await showConfirm(
      'Reset Pilihan Presensi?',
      'Semua status presensi yang dipilih akan dikosongkan.',
      'Ya, Kosongkan'
    )
    if (!res.isConfirmed) return

    setSiswaRows((prev) => {
      const next = { ...prev }
      siswaList.forEach((s) => {
        const sid = String(s.id)
        next[sid] = {
          ...(next[sid] || {}),
          status: null,
          keterangan: '',
        }
      })
      return next
    })
  }

  const filteredSiswa = useMemo(() => {
    if (!filterKeyword.trim()) return siswaList
    const kw = filterKeyword.toLowerCase().trim()
    return siswaList.filter(
      (s) =>
        (s.nama && s.nama.toLowerCase().includes(kw)) ||
        (s.nis && String(s.nis).toLowerCase().includes(kw))
    )
  }, [siswaList, filterKeyword])

  const stats = useMemo(() => {
    const total = siswaList.length
    let hadir = 0
    let izin = 0
    let sakit = 0
    let alpha = 0
    let terlambat = 0
    let unset = 0

    siswaList.forEach((s) => {
      const row = siswaRows[String(s.id)]
      const st = row?.status
      if (st === 1) hadir++
      else if (st === 2) izin++
      else if (st === 3) sakit++
      else if (st === 4) alpha++
      else if (st === 5) terlambat++
      else unset++
    })

    return { total, hadir, izin, sakit, alpha, terlambat, unset }
  }, [siswaList, siswaRows])

  // Keyboard navigation
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const target = e.target
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      if (isInput) return

      if (filteredSiswa.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveRowIndex((prev) => Math.min(filteredSiswa.length - 1, prev + 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveRowIndex((prev) => Math.max(0, prev - 1))
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault()
        const statusVal = Number(e.key)
        const currentStudent = filteredSiswa[activeRowIndex]
        if (currentStudent) {
          setRowStatus(String(currentStudent.id), statusVal)
          setActiveRowIndex((prev) => Math.min(filteredSiswa.length - 1, prev + 1))
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [filteredSiswa, activeRowIndex, setRowStatus])

  const handleNoteKeyDown = (e, index) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault()
      const nextIndex = index + 1
      if (noteRefs.current[nextIndex]) {
        noteRefs.current[nextIndex].focus()
        setActiveRowIndex(nextIndex)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevIndex = index - 1
      if (noteRefs.current[prevIndex]) {
        noteRefs.current[prevIndex].focus()
        setActiveRowIndex(prevIndex)
      }
    }
  }

  const handleSaveAll = async () => {
    if (!selectedKelasId) {
      showError('Silakan pilih kelas terlebih dahulu')
      return
    }

    if (!tanggal) {
      showError('Tanggal presensi wajib diisi')
      return
    }

    if (siswaList.length === 0) {
      showError('Tidak ada siswa di kelas yang dipilih')
      return
    }

    const unassigned = siswaList.filter((s) => {
      const st = siswaRows[String(s.id)]?.status
      return st === null || st === undefined || isNaN(st) || st < 1 || st > 5
    })

    if (unassigned.length > 0) {
      showError(`Terdapat ${unassigned.length} siswa yang belum memiliki status presensi. Gunakan "Tandai Semua Hadir" untuk mengisi cepat.`)
      return
    }

    const items = siswaList.map((s) => {
      const sid = String(s.id)
      const row = siswaRows[sid] || {}
      return {
        mst_siswa_id: s.id,
        status: Number(row.status),
        keterangan: row.keterangan?.trim() ? row.keterangan.trim() : null,
      }
    })

    const confirmRes = await showConfirm(
      'Simpan Presensi Kelas?',
      `Menyimpan presensi ${items.length} siswa untuk tanggal ${tanggal}.`,
      'Ya, Simpan Presensi'
    )
    if (!confirmRes.isConfirmed) return

    setSaving(true)
    const { data, error } = await absensiSiswaService.bulkAbsensiSiswa({
      tanggal,
      items,
    })

    if (error) {
      showError(error?.message || 'Gagal menyimpan presensi kelas')
    } else {
      showSuccess(data?.message || `Presensi ${items.length} siswa berhasil disimpan!`)
      await loadData()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/absensi-siswa')}
            title="Kembali ke Daftar Absensi"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Presensi Harian Siswa Per Kelas
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Input presensi siswa secara massal untuk satu rombel kelas
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kelas <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              name="mst_kelas_id"
              value={selectedKelasId}
              onChange={handleKelasChange}
              options={selectedKelasOption ? [selectedKelasOption] : []}
              loadOptions={searchKelasOptions}
              placeholder="Pilih kelas..."
              searchPlaceholder="Cari kelas..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tanggal Presensi <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={loadData}
              disabled={loadingData || !selectedKelasId}
              className="w-full sm:w-auto"
              title="Muat ulang data"
            >
              <RefreshCw size={16} className={`mr-2 ${loadingData ? 'animate-spin' : ''}`} />
              Muat Data
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Action Toolbar & Indicator Counter */}
      {selectedKelasId && !loadingData && siswaList.length > 0 && (
        <Card className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleMarkAllHadir}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
              >
                <CheckCheck size={16} className="mr-1.5" />
                Tandai Semua Hadir
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleReset}
                className="text-xs font-medium"
              >
                <RotateCcw size={16} className="mr-1.5" />
                Reset Pilihan
              </Button>
            </div>

            <div className="relative w-full md:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                placeholder="Cari NIS / Nama..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-gray-600 dark:text-gray-400 mr-1">Status:</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-200 dark:border-emerald-800">
              Hadir: {stats.hadir}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-medium border border-amber-200 dark:border-amber-800">
              Izin: {stats.izin}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-medium border border-blue-200 dark:border-blue-800">
              Sakit: {stats.sakit}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-medium border border-rose-200 dark:border-rose-800">
              Alpha: {stats.alpha}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 font-medium border border-purple-200 dark:border-purple-800">
              Terlambat: {stats.terlambat}
            </span>
            {stats.unset > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium border border-gray-300 dark:border-gray-700">
                Belum Diisi: {stats.unset}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Main Table Card */}
      <Card className="p-4 sm:p-6">
        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data siswa dan presensi...</p>
          </div>
        ) : !selectedKelasId ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center mb-3">
              <Users size={28} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pilih Kelas</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-1">
              Silakan pilih rombel kelas terlebih dahulu untuk menampilkan daftar siswa dan menginput presensi.
            </p>
          </div>
        ) : siswaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center mb-3">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tidak Ada Siswa</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-1">
              Belum ada siswa yang terdaftar di kelas yang dipilih.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-primary-500" />
                <span>Navigasi Cepat: Gunakan panah <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border text-[11px] font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border text-[11px] font-mono">↓</kbd> untuk pindah siswa. Tekan <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-700 border text-[11px] font-mono">1-5</kbd> untuk status (1=H, 2=I, 3=S, 4=A, 5=T).</span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
              <table ref={tableRef} className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 uppercase text-xs font-semibold">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-center w-12">No</th>
                    <th scope="col" className="px-4 py-3 text-left w-32">NIS</th>
                    <th scope="col" className="px-4 py-3 text-left min-w-[200px]">Nama Siswa</th>
                    <th scope="col" className="px-3 py-3 text-center w-20">Gender</th>
                    <th scope="col" className="px-4 py-3 text-center min-w-[260px]">Status Presensi</th>
                    <th scope="col" className="px-4 py-3 text-left min-w-[200px]">Catatan / Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {filteredSiswa.map((siswa, index) => {
                    const sid = String(siswa.id)
                    const row = siswaRows[sid] || {}
                    const isActive = index === activeRowIndex

                    return (
                      <tr
                        key={siswa.id}
                        onClick={() => setActiveRowIndex(index)}
                        className={`transition-colors ${
                          isActive
                            ? 'bg-primary-50/60 dark:bg-primary-950/20'
                            : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/40'
                        }`}
                      >
                        <td className="px-3 py-2.5 text-center text-gray-500 dark:text-gray-400 text-xs">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 font-mono text-xs">
                          {siswa.nis || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-gray-900 dark:text-white font-medium">
                          {siswa.nama}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-semibold text-[11px] ${
                              formatGender(siswa.jenis_kelamin) === 'L'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : formatGender(siswa.jenis_kelamin) === 'P'
                                ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {formatGender(siswa.jenis_kelamin)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <div className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-800">
                            {STATUS_CONFIG.map((cfg) => {
                              const isSelected = row.status === cfg.value
                              return (
                                <button
                                  key={cfg.value}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setRowStatus(sid, cfg.value)
                                    setActiveRowIndex(index)
                                  }}
                                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                    isSelected
                                      ? cfg.activeClass
                                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700/60'
                                  }`}
                                  title={`${cfg.label} (Pintasan: ${cfg.keyLabel})`}
                                >
                                  {cfg.short}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            ref={(el) => (noteRefs.current[index] = el)}
                            type="text"
                            value={row.keterangan || ''}
                            onChange={(e) => setRowKeterangan(sid, e.target.value)}
                            onKeyDown={(e) => handleNoteKeyDown(e, index)}
                            onFocus={() => setActiveRowIndex(index)}
                            placeholder="Catatan izin/sakit..."
                            className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Sticky Bottom Bar */}
            <div className="sticky bottom-0 z-20 mt-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <Users size={16} className="text-gray-400" />
                <span>Terisi: <strong className="text-gray-900 dark:text-white">{stats.total - stats.unset}</strong> / {stats.total} siswa</span>
                {stats.unset > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">({stats.unset} belum dipilih)</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <UserCheck size={14} /> Lengkap
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={() => navigate('/absensi-siswa')} disabled={saving}>
                  Batal
                </Button>
                <PermissionGuard permission="absensi-siswa.create">
                  <Button
                    variant="primary"
                    onClick={handleSaveAll}
                    disabled={saving || loadingData || siswaList.length === 0}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-medium"
                  >
                    <Save size={18} className="mr-2" />
                    {saving ? 'Menyimpan...' : 'Simpan Presensi Kelas'}
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default AbsensiKelasForm
