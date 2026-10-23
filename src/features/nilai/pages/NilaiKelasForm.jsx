import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  BookOpen,
  GraduationCap
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { nilaiService } from '../services/nilaiService'
import { ujianService } from '../../ujian/services/ujianService'
import { kelasService } from '../../kelas/services/kelasService'
import { formatUjianOptionLabel } from '../../ujian/utils/ujianFormatters'
import { showSuccess, showError, showConfirm } from '../../../utils/sweetalert'

const NilaiKelasForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialUjianId = searchParams.get('ujian_id') || ''
  const initialKelasId = searchParams.get('kelas_id') || ''

  const [selectedUjianId, setSelectedUjianId] = useState(initialUjianId)
  const [selectedKelasId, setSelectedKelasId] = useState(initialKelasId)
  const [selectedUjianOption, setSelectedUjianOption] = useState(null)
  const [selectedKelasOption, setSelectedKelasOption] = useState(null)

  const [siswaList, setSiswaList] = useState([])
  const [siswaRows, setSiswaRows] = useState({})
  const [loadingData, setLoadingData] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterKeyword, setFilterKeyword] = useState('')
  const [bulkFillScore, setBulkFillScore] = useState('')

  const inputRefs = useRef({})

  const buildUjianOption = useCallback((ujian) => ({
    value: String(ujian.id),
    label: formatUjianOptionLabel(ujian),
    ujian
  }), [])

  const buildKelasOption = useCallback((kelas) => ({
    value: String(kelas.id),
    label: kelas.nama_kelas || `Kelas #${kelas.id}`
  }), [])

  const searchUjianOptions = useCallback(async (keyword = '') => {
    const { data, error } = await ujianService.getAll({
      search: keyword || undefined,
      per_page: 20
    })
    if (Array.isArray(data?.data)) return data.data.map(buildUjianOption)
    if (error) console.error('Failed to fetch ujian:', error)
    return []
  }, [buildUjianOption])

  const searchKelasOptions = useCallback(async (keyword = '') => {
    const { data, error } = await kelasService.getAll({
      search: keyword || undefined,
      per_page: 50
    })
    if (Array.isArray(data?.data)) return data.data.map(buildKelasOption)
    if (error) console.error('Failed to fetch kelas:', error)
    return []
  }, [buildKelasOption])

  const hydrateUjianOption = useCallback(async (ujianId) => {
    if (!ujianId) {
      setSelectedUjianOption(null)
      return
    }
    const { data } = await ujianService.getById(ujianId)
    const ujian = data?.data
    if (ujian) {
      setSelectedUjianOption(buildUjianOption(ujian))
      if (ujian.mst_kelas_id && !selectedKelasId) {
        setSelectedKelasId(String(ujian.mst_kelas_id))
      }
    }
  }, [buildUjianOption, selectedKelasId])

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
    if (initialUjianId) hydrateUjianOption(initialUjianId)
  }, [initialUjianId, hydrateUjianOption])

  useEffect(() => {
    if (initialKelasId) hydrateKelasOption(initialKelasId)
  }, [initialKelasId, hydrateKelasOption])

  const handleUjianChange = (e) => {
    const val = e.target.value
    setSelectedUjianId(val)
    if (!val) {
      setSelectedUjianOption(null)
      return
    }
    ujianService.getById(val).then(({ data }) => {
      const ujian = data?.data
      if (ujian) {
        setSelectedUjianOption(buildUjianOption(ujian))
        if (ujian.mst_kelas_id) {
          const autoKelasId = String(ujian.mst_kelas_id)
          setSelectedKelasId(autoKelasId)
          hydrateKelasOption(autoKelasId)
        }
      }
    })
  }

  const handleKelasChange = (e) => {
    const val = e.target.value
    setSelectedKelasId(val)
    if (!val) {
      setSelectedKelasOption(null)
      return
    }
    hydrateKelasOption(val)
  }

  const loadClassStudentsAndGrades = useCallback(async () => {
    if (!selectedKelasId || !selectedUjianId) {
      setSiswaList([])
      setSiswaRows({})
      return
    }

    setLoadingData(true)
    try {
      const [siswaRes, nilaiRes] = await Promise.all([
        kelasService.getSiswaByKelasId(selectedKelasId),
        nilaiService.getByUjian(selectedUjianId)
      ])

      const list = siswaRes.data?.data?.siswa || []
      const existingGrades = Array.isArray(nilaiRes.data?.data) ? nilaiRes.data.data : []

      const gradeMap = new Map()
      existingGrades.forEach((g) => {
        gradeMap.set(String(g.mst_siswa_id), g)
      })

      const rows = {}
      list.forEach((siswa) => {
        const sid = String(siswa.id)
        const grade = gradeMap.get(sid)

        rows[sid] = {
          nilai: grade && grade.nilai !== null && grade.nilai !== undefined ? String(grade.nilai) : '',
          keterangan: grade?.keterangan || '',
          originalNilai: grade && grade.nilai !== null && grade.nilai !== undefined ? String(grade.nilai) : '',
          originalKeterangan: grade?.keterangan || '',
          existingId: grade?.id || null
        }
      })

      setSiswaList(list)
      setSiswaRows(rows)
    } catch (err) {
      console.error('Error loading data:', err)
      showError('Gagal memuat data siswa dan nilai')
    } finally {
      setLoadingData(false)
    }
  }, [selectedKelasId, selectedUjianId])

  useEffect(() => {
    if (selectedKelasId && selectedUjianId) {
      loadClassStudentsAndGrades()
    }
  }, [selectedKelasId, selectedUjianId, loadClassStudentsAndGrades])

  const handleInputChange = (siswaId, field, val) => {
    setSiswaRows((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        [field]: val
      }
    }))
  }

  const handleKeyDown = (e, index, field) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault()
      const nextKey = `${index + 1}-${field}`
      if (inputRefs.current[nextKey]) inputRefs.current[nextKey].focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prevKey = `${index - 1}-${field}`
      if (inputRefs.current[prevKey]) inputRefs.current[prevKey].focus()
    }
  }

  const handleQuickFillBlank = () => {
    if (bulkFillScore === '' || isNaN(parseFloat(bulkFillScore))) {
      showError('Masukkan nilai default yang valid (0 - 100)')
      return
    }

    const numScore = parseFloat(bulkFillScore)
    if (numScore < 0 || numScore > 100) {
      showError('Nilai harus di antara 0 dan 100')
      return
    }

    setSiswaRows((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((sid) => {
        if (!updated[sid].nilai || updated[sid].nilai === '') {
          updated[sid] = {
            ...updated[sid],
            nilai: String(numScore)
          }
        }
      })
      return updated
    })

    showSuccess(`Nilai ${numScore} berhasil diisikan untuk siswa yang belum dinilai`)
  }

  const filteredSiswa = useMemo(() => {
    if (!filterKeyword.trim()) return siswaList
    const kw = filterKeyword.toLowerCase().trim()
    return siswaList.filter(
      (s) =>
        (s.nama && s.nama.toLowerCase().includes(kw)) ||
        (s.nis && s.nis.toLowerCase().includes(kw))
    )
  }, [siswaList, filterKeyword])

  const stats = useMemo(() => {
    const total = siswaList.length
    let scoredCount = 0
    let totalScore = 0

    Object.values(siswaRows).forEach((row) => {
      const n = parseFloat(row.nilai)
      if (row.nilai !== '' && !isNaN(n)) {
        scoredCount++
        totalScore += n
      }
    })

    const avg = scoredCount > 0 ? (totalScore / scoredCount).toFixed(1) : '-'
    return {
      total,
      scoredCount,
      unScoredCount: total - scoredCount,
      avg
    }
  }, [siswaList, siswaRows])

  const handleSaveAll = async () => {
    if (!selectedUjianId) {
      showError('Silakan pilih ujian terlebih dahulu')
      return
    }

    const validItems = []
    const invalidEntries = []

    Object.entries(siswaRows).forEach(([sid, row]) => {
      if (row.nilai !== '' && row.nilai !== null && row.nilai !== undefined) {
        const num = parseFloat(row.nilai)
        if (isNaN(num) || num < 0 || num > 100) {
          invalidEntries.push(sid)
        } else {
          validItems.push({
            mst_siswa_id: parseInt(sid),
            nilai: num,
            keterangan: row.keterangan ? row.keterangan.trim() : null
          })
        }
      }
    })

    if (invalidEntries.length > 0) {
      showError('Ada nilai yang tidak valid. Nilai harus berupa angka antara 0 dan 100.')
      return
    }

    if (validItems.length === 0) {
      showError('Belum ada nilai yang diisi. Masukkan nilai siswa sebelum menyimpan.')
      return
    }

    const confirmed = await showConfirm(
      'Simpan Semua Nilai?',
      `Menyimpan nilai untuk ${validItems.length} siswa di kelas ini.`
    )

    if (!confirmed.isConfirmed) return

    setSaving(true)
    const { data, error } = await nilaiService.batchStore({
      trx_ujian_id: parseInt(selectedUjianId),
      items: validItems
    })

    if (error) {
      showError(error?.message || 'Gagal menyimpan nilai')
    } else {
      showSuccess(data?.message || `${validItems.length} nilai berhasil disimpan!`)
      await loadClassStudentsAndGrades()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/akademik/nilai')}
            className="flex items-center"
          >
            <ArrowLeft size={18} className="mr-1" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Input Nilai Per Kelas
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Isi nilai seluruh siswa dalam satu kelas sekaligus secara massal
            </p>
          </div>
        </div>

        {selectedKelasId && selectedUjianId && siswaList.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={loadClassStudentsAndGrades}
              disabled={loadingData || saving}
              title="Muat Ulang Data"
            >
              <RefreshCw size={18} className={loadingData ? 'animate-spin' : ''} />
            </Button>
            <PermissionGuard permission="nilai.create">
              <Button
                variant="primary"
                onClick={handleSaveAll}
                disabled={saving || loadingData}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium"
              >
                <Save size={18} className="mr-2" />
                {saving ? 'Menyimpan...' : 'Simpan Semua Nilai'}
              </Button>
            </PermissionGuard>
          </div>
        )}
      </div>

      {/* Filter Section */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-primary-600" />
          Pilih Ujian & Kelas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ujian <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              name="trx_ujian_id"
              value={selectedUjianId}
              onChange={handleUjianChange}
              options={selectedUjianOption ? [selectedUjianOption] : []}
              loadOptions={searchUjianOptions}
              placeholder="Cari atau pilih ujian..."
              searchPlaceholder="Ketik nama ujian atau mapel..."
            />
            {selectedUjianOption?.ujian && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Mapel: <span className="font-medium text-gray-700 dark:text-gray-300">{selectedUjianOption.ujian.mapel?.nama || selectedUjianOption.ujian.mapel?.nama_mapel || '-'}</span>
                {selectedUjianOption.ujian.kelas && (
                  <> &bull; Kelas: <span className="font-medium text-gray-700 dark:text-gray-300">{selectedUjianOption.ujian.kelas.nama_kelas}</span></>
                )}
              </p>
            )}
          </div>

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
        </div>
      </Card>

      {/* Stats Bar */}
      {selectedUjianId && selectedKelasId && !loadingData && siswaList.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Siswa</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sudah Dinilai</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.scoredCount}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Belum Dinilai</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.unScoredCount}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rata-Rata Nilai</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.avg}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Main Table Card */}
      <Card className="p-6">
        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-3"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data siswa dan nilai...</p>
          </div>
        ) : !selectedUjianId || !selectedKelasId ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center mb-3">
              <BookOpen size={28} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pilih Ujian & Kelas</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-1">
              Silakan pilih ujian dan kelas pada filter di atas untuk menampilkan daftar siswa dan menginput nilai.
            </p>
          </div>
        ) : siswaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center mb-3">
              <Users size={28} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tidak Ada Siswa</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-1">
              Belum ada siswa yang terdaftar di kelas yang dipilih.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table top toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="relative w-full sm:w-72">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filterKeyword}
                  onChange={(e) => setFilterKeyword(e.target.value)}
                  placeholder="Cari siswa (NIS / Nama)..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={bulkFillScore}
                  onChange={(e) => setBulkFillScore(e.target.value)}
                  placeholder="Nilai (0-100)"
                  className="w-28 px-3 py-1.5 text-sm text-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleQuickFillBlank}
                  className="text-xs font-medium"
                  title="Terapkan nilai ini untuk semua siswa yang belum memiliki nilai"
                >
                  <Sparkles size={14} className="mr-1 text-primary-600" />
                  Isi Kosong
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 uppercase text-xs font-semibold">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-center w-12">No</th>
                    <th scope="col" className="px-4 py-3 text-left w-32">NIS</th>
                    <th scope="col" className="px-4 py-3 text-left min-w-[200px]">Nama Siswa</th>
                    <th scope="col" className="px-4 py-3 text-center w-36">
                      Nilai <span className="text-red-500">*</span>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left min-w-[220px]">Keterangan</th>
                    <th scope="col" className="px-4 py-3 text-center w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {filteredSiswa.map((siswa, index) => {
                    const sid = String(siswa.id)
                    const row = siswaRows[sid] || { nilai: '', keterangan: '' }
                    const numNilai = parseFloat(row.nilai)
                    const isFilled = row.nilai !== '' && !isNaN(numNilai)
                    const isTuntas = isFilled && numNilai >= 75

                    return (
                      <tr
                        key={siswa.id}
                        className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
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
                        <td className="px-4 py-2.5">
                          <input
                            ref={(el) => (inputRefs.current[`${index}-nilai`] = el)}
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={row.nilai}
                            onChange={(e) => handleInputChange(sid, 'nilai', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 'nilai')}
                            placeholder="0 - 100"
                            className={`w-full px-3 py-1.5 text-center font-semibold rounded border text-sm transition-colors focus:outline-none focus:ring-2 ${
                              row.nilai !== '' && isNaN(numNilai)
                                ? 'border-red-500 focus:ring-red-400 bg-red-50 dark:bg-red-950/20 text-red-600'
                                : isFilled
                                ? 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500'
                                : 'border-gray-300 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/30 text-gray-500 focus:ring-primary-500'
                            }`}
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            ref={(el) => (inputRefs.current[`${index}-keterangan`] = el)}
                            type="text"
                            value={row.keterangan}
                            onChange={(e) => handleInputChange(sid, 'keterangan', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 'keterangan')}
                            placeholder="Catatan..."
                            className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {isFilled ? (
                            isTuntas ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                Tuntas
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                Remedial
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              Belum Diisi
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Gunakan tombol <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border font-mono">Enter</kbd> atau <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border font-mono">&darr;</kbd> untuk berpindah baris.
              </p>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/akademik/nilai')}
                  disabled={saving}
                >
                  Batal
                </Button>
                <PermissionGuard permission="nilai.create">
                  <Button
                    variant="primary"
                    onClick={handleSaveAll}
                    disabled={saving || loadingData}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-medium"
                  >
                    <Save size={18} className="mr-2" />
                    {saving ? 'Menyimpan...' : 'Simpan Semua Nilai'}
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

export default NilaiKelasForm
