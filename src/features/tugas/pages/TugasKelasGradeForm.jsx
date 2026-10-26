import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
  GraduationCap,
  Download,
  FileText,
  Clock,
  X,
  ExternalLink
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { tugasService, tugasSiswaService } from '../services/tugasService'
import { kelasService } from '../../kelas/services/kelasService'
import { formatDateTime } from '../../../utils/formatters'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { isImageFile, getFileName, hasAttachment, getAttachmentPath, openAttachment } from '../utils/tugasFileUtils'

const TugasKelasGradeForm = () => {
  const navigate = useNavigate()
  const { id: paramId, tugasId: paramTugasId } = useParams()
  const [searchParams] = useSearchParams()

  const initialTugasId = paramId || paramTugasId || searchParams.get('tugas_id') || ''

  const [selectedTugasId, setSelectedTugasId] = useState(initialTugasId)
  const [selectedTugasOption, setSelectedTugasOption] = useState(null)
  const [tugasDetail, setTugasDetail] = useState(null)

  const [siswaList, setSiswaList] = useState([])
  const [siswaRows, setSiswaRows] = useState({})
  const [loadingData, setLoadingData] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterKeyword, setFilterKeyword] = useState('')
  const [bulkFillScore, setBulkFillScore] = useState('')

  // Answer preview modal
  const [previewModal, setPreviewModal] = useState({
    open: false,
    siswaNama: '',
    jawaban: '',
    fileJawaban: null,
  })

  const inputRefs = useRef({})

  const buildTugasOption = useCallback((t) => {
    const mapel = t.guru_mapel?.mapel?.nama || t.guru_mapel?.mapel?.nama_mapel || ''
    const kelas = t.kelas?.nama_kelas || t.kelas?.nama || ''
    const labelParts = [t.judul]
    if (kelas) labelParts.push(`Kelas ${kelas}`)
    if (mapel) labelParts.push(mapel)
    return {
      value: String(t.id),
      label: labelParts.join(' • '),
      tugas: t
    }
  }, [])

  const searchTugasOptions = useCallback(async (keyword = '') => {
    const { data, error } = await tugasService.getAll({
      search: keyword || undefined,
      per_page: 30
    })
    if (Array.isArray(data?.data)) return data.data.map(buildTugasOption)
    if (error) console.error('Failed to fetch tugas options:', error)
    return []
  }, [buildTugasOption])

  const hydrateTugasOption = useCallback(async (tugasId) => {
    if (!tugasId) {
      setSelectedTugasOption(null)
      setTugasDetail(null)
      return
    }
    const { data } = await tugasService.getById(tugasId)
    const t = data?.data
    if (t) {
      setSelectedTugasOption(buildTugasOption(t))
      setTugasDetail(t)
    }
  }, [buildTugasOption])

  useEffect(() => {
    if (initialTugasId) {
      hydrateTugasOption(initialTugasId)
    }
  }, [initialTugasId, hydrateTugasOption])

  const handleTugasChange = (e) => {
    const val = e.target.value
    setSelectedTugasId(val)
    if (!val) {
      setSelectedTugasOption(null)
      setTugasDetail(null)
      setSiswaList([])
      setSiswaRows({})
      return
    }
    hydrateTugasOption(val)
  }

  const loadData = useCallback(async () => {
    if (!selectedTugasId) {
      setSiswaList([])
      setSiswaRows({})
      return
    }

    setLoadingData(true)
    try {
      let currentTugas = tugasDetail
      if (!currentTugas || String(currentTugas.id) !== String(selectedTugasId)) {
        const { data: resTugas } = await tugasService.getById(selectedTugasId)
        currentTugas = resTugas?.data
        setTugasDetail(currentTugas)
        if (currentTugas) {
          setSelectedTugasOption(buildTugasOption(currentTugas))
        }
      }

      const kelasId = currentTugas?.mst_kelas_id || currentTugas?.kelas?.id
      if (!kelasId) {
        setSiswaList([])
        setSiswaRows({})
        setLoadingData(false)
        return
      }

      const [siswaRes, submissionsRes] = await Promise.all([
        kelasService.getSiswaByKelasId(kelasId),
        tugasSiswaService.getByTugas(selectedTugasId),
      ])

      const list = siswaRes.data?.data?.siswa || (Array.isArray(siswaRes.data?.data) ? siswaRes.data.data : [])
      const submissions = Array.isArray(submissionsRes.data?.data) ? submissionsRes.data.data : []

      const submissionMap = new Map()
      submissions.forEach((sub) => {
        const sid = String(sub.siswa_id || sub.siswa?.id)
        submissionMap.set(sid, sub)
      })

      const rows = {}
      list.forEach((siswa) => {
        const sid = String(siswa.id)
        const sub = submissionMap.get(sid)

        let status = 0
        let statusLabel = 'Belum Mengumpulkan'

        if (sub) {
          status = sub.status
          if (sub.status === 3) {
            statusLabel = 'Sudah Dinilai'
          } else if (sub.status === 2) {
            statusLabel = 'Terlambat'
          } else if (sub.status === 1) {
            statusLabel = 'Tepat Waktu'
          } else {
            statusLabel = 'Belum Mengumpulkan'
          }
        }

        rows[sid] = {
          nilai: sub && sub.nilai !== null && sub.nilai !== undefined ? String(sub.nilai) : '',
          catatan_guru: sub?.catatan_guru || '',
          status,
          statusLabel,
          waktu_kumpul: sub?.waktu_kumpul || null,
          jawaban: sub?.jawaban || null,
          file_jawaban: sub?.file_jawaban || sub?.file_siswa || sub?.file_path || null,
          file_url: sub?.file_url || null,
          submissionId: sub?.id || null,
        }
      })

      setSiswaList(list)
      setSiswaRows(rows)
    } catch (err) {
      console.error('Error loading tugas data:', err)
      showError('Gagal memuat data tugas dan siswa')
    } finally {
      setLoadingData(false)
    }
  }, [selectedTugasId, tugasDetail, buildTugasOption])

  useEffect(() => {
    if (selectedTugasId) {
      loadData()
    }
  }, [selectedTugasId, loadData])

  const handleInputChange = (siswaId, field, val) => {
    setSiswaRows((prev) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        [field]: val,
      },
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
            nilai: String(numScore),
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
    let submittedCount = 0
    let scoredCount = 0
    let totalScore = 0

    Object.values(siswaRows).forEach((row) => {
      if (row.status === 1 || row.status === 2 || row.status === 3 || row.waktu_kumpul) {
        submittedCount++
      }
      const n = parseFloat(row.nilai)
      if (row.nilai !== '' && !isNaN(n)) {
        scoredCount++
        totalScore += n
      }
    })

    const avg = scoredCount > 0 ? (totalScore / scoredCount).toFixed(1) : '-'
    return {
      total,
      submittedCount,
      unsubmittedCount: total - submittedCount,
      scoredCount,
      unScoredCount: total - scoredCount,
      avg,
    }
  }, [siswaList, siswaRows])

  const handleSaveAll = async () => {
    if (!selectedTugasId) {
      showError('Silakan pilih tugas terlebih dahulu')
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
            siswa_id: parseInt(sid),
            nilai: num,
            catatan_guru: row.catatan_guru ? row.catatan_guru.trim() : null,
          })
        }
      }
    })

    if (invalidEntries.length > 0) {
      showError(`Terdapat ${invalidEntries.length} input nilai yang tidak valid (harus 0 - 100)`)
      return
    }

    if (validItems.length === 0) {
      showError('Belum ada nilai yang diinputkan untuk disimpan')
      return
    }

    setSaving(true)
    const { data, error } = await tugasSiswaService.batchStore({
      tugas_id: parseInt(selectedTugasId),
      items: validItems,
    })

    setSaving(false)

    if (error) {
      showError(error.message || 'Gagal menyimpan nilai tugas')
      return
    }

    const msg = data?.message || `${validItems.length} nilai tugas berhasil disimpan`
    showSuccess(msg)
    loadData()
  }

  const getStatusBadge = (status, label) => {
    switch (status) {
      case 3:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <CheckCircle2 size={12} className="mr-1" />
            {label || 'Sudah Dinilai'}
          </span>
        )
      case 1:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 size={12} className="mr-1" />
            {label || 'Tepat Waktu'}
          </span>
        )
      case 2:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock size={12} className="mr-1" />
            {label || 'Terlambat'}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
            <AlertCircle size={12} className="mr-1" />
            {label || 'Belum Kumpul'}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/akademik/tugas')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="text-primary-600" size={26} />
              Penilaian Tugas Siswa Per Kelas
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Input dan kelola penilaian pengumpulan tugas siswa secara massal dalam satu tampilan
            </p>
          </div>
        </div>

        {selectedTugasId && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={loadData}
              disabled={loadingData || saving}
              title="Muat Ulang Data"
            >
              <RefreshCw size={18} className={loadingData ? 'animate-spin' : ''} />
            </Button>
            <PermissionGuard permission="tugas-siswa.nilai">
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

      {/* Tugas Selection Card */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-primary-600" />
          Pilih Tugas
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tugas <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            name="tugas_id"
            value={selectedTugasId}
            onChange={handleTugasChange}
            options={selectedTugasOption ? [selectedTugasOption] : []}
            loadOptions={searchTugasOptions}
            placeholder="Cari atau pilih tugas..."
            searchPlaceholder="Ketik judul tugas atau mapel..."
          />
        </div>

        {/* Selected Tugas Info Banner */}
        {tugasDetail && (
          <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200/60 dark:border-gray-700/60 pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  {tugasDetail.guru_mapel?.mapel?.nama || tugasDetail.guru_mapel?.mapel?.nama_mapel || 'Tugas'}
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                  {tugasDetail.judul}
                </h3>
              </div>
              {hasAttachment(tugasDetail) ? (
                <button
                  type="button"
                  onClick={() => openAttachment(getAttachmentPath(tugasDetail), tugasDetail.file_url)}
                  className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 text-xs font-medium gap-1 hover:underline"
                  title="Unduh Lampiran Soal"
                >
                  <Download size={14} />
                  Unduh Lampiran Soal
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm pt-1">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Guru Pengampu</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {tugasDetail.guru_mapel?.guru?.nama || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Target Kelas</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {tugasDetail.kelas?.nama_kelas || tugasDetail.kelas?.nama || `Kelas #${tugasDetail.mst_kelas_id}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tenggat Waktu</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatDateTime(tugasDetail.tenggat_waktu)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Stats Bar */}
      {selectedTugasId && !loadingData && siswaList.length > 0 && (
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
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sudah Mengumpulkan</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.submittedCount}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Sudah Dinilai</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{stats.scoredCount}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <Sparkles size={20} />
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
            <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data siswa dan pengumpulan tugas...</p>
          </div>
        ) : !selectedTugasId ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center mb-3">
              <BookOpen size={28} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pilih Tugas</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-1">
              Silakan pilih tugas pada kolom di atas untuk menampilkan daftar pengumpulan siswa dan menginput nilai.
            </p>
          </div>
        ) : siswaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center mb-3">
              <Users size={28} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tidak Ada Siswa</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-1">
              Belum ada siswa yang terdaftar di kelas target tugas ini.
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
                  placeholder="Skor (0-100)"
                  className="w-28 px-3 py-1.5 text-sm text-center rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleQuickFillBlank}
                  className="text-xs font-medium"
                  title="Terapkan nilai ini untuk semua siswa yang belum dinilai"
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
                    <th scope="col" className="px-4 py-3 text-left w-28">NIS</th>
                    <th scope="col" className="px-4 py-3 text-left min-w-[180px]">Nama Siswa</th>
                    <th scope="col" className="px-4 py-3 text-center w-36">Waktu Kumpul</th>
                    <th scope="col" className="px-4 py-3 text-center w-36">Status</th>
                    <th scope="col" className="px-4 py-3 text-center w-36">Jawaban / File</th>
                    <th scope="col" className="px-4 py-3 text-center w-32">
                      Skor <span className="text-red-500">*</span>
                    </th>
                    <th scope="col" className="px-4 py-3 text-left min-w-[200px]">Catatan Guru</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {filteredSiswa.map((siswa, index) => {
                    const sid = String(siswa.id)
                    const row = siswaRows[sid] || { nilai: '', catatan_guru: '', status: 0 }
                    const numNilai = parseFloat(row.nilai)
                    const isFilled = row.nilai !== '' && !isNaN(numNilai)

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
                        <td className="px-4 py-2.5 text-center text-xs text-gray-600 dark:text-gray-400">
                          {row.waktu_kumpul ? formatDateTime(row.waktu_kumpul) : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {getStatusBadge(row.status, row.statusLabel)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {(row.file_jawaban || row.file_url) && (
                              <button
                                type="button"
                                onClick={() => openAttachment(row.file_jawaban, row.file_url)}
                                className="p-1 rounded text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                                title={`Unduh File Jawaban (${getFileName(row.file_jawaban || row.file_url)})`}
                              >
                                <Download size={15} />
                              </button>
                            )}
                            {row.jawaban && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewModal({
                                    open: true,
                                    siswaNama: siswa.nama,
                                    jawaban: row.jawaban,
                                    fileJawaban: row.file_jawaban,
                                    fileUrl: row.file_url,
                                  })
                                }
                                className="p-1 rounded text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-1 text-xs font-medium"
                                title="Lihat Teks Jawaban"
                              >
                                <FileText size={15} />
                                <span>Lihat</span>
                              </button>
                            )}
                            {!row.file_jawaban && !row.file_url && !row.jawaban && (
                              <span className="text-gray-400 text-xs italic">-</span>
                            )}
                          </div>
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
                              row.nilai !== '' && (isNaN(numNilai) || numNilai < 0 || numNilai > 100)
                                ? 'border-red-500 focus:ring-red-400 bg-red-50 dark:bg-red-950/20 text-red-600'
                                : isFilled
                                ? 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-primary-500'
                                : 'border-gray-300 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/30 text-gray-500 focus:ring-primary-500'
                            }`}
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            ref={(el) => (inputRefs.current[`${index}-catatan_guru`] = el)}
                            type="text"
                            value={row.catatan_guru}
                            onChange={(e) => handleInputChange(sid, 'catatan_guru', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 'catatan_guru')}
                            placeholder="Catatan guru..."
                            className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom count notice */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1 pt-1">
              <p>Menampilkan {filteredSiswa.length} dari {siswaList.length} siswa</p>
              <p className="text-gray-400">Gunakan tombol panah Atas/Bawah atau Enter untuk navigasi input skor</p>
            </div>
          </div>
        )}
      </Card>

      {/* Answer Preview Modal */}
      {previewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="text-primary-600" size={20} />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Jawaban: {previewModal.siswaNama}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModal({ open: false, siswaNama: '', jawaban: '', fileJawaban: null })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {previewModal.jawaban || <span className="italic text-gray-400">Tidak ada jawaban teks</span>}
            </div>

            {(previewModal.fileJawaban || previewModal.fileUrl) && (
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => openAttachment(previewModal.fileJawaban, previewModal.fileUrl)}
                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium hover:underline text-left"
                >
                  <ExternalLink size={16} className="shrink-0" />
                  <span>Buka / Unduh File Jawaban ({getFileName(previewModal.fileJawaban || previewModal.fileUrl)})</span>
                </button>
                {isImageFile(previewModal.fileUrl || previewModal.fileJawaban) && (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-h-60 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-2">
                    <img
                      src={previewModal.fileUrl || previewModal.fileJawaban}
                      alt="Lampiran Jawaban"
                      className="max-h-56 object-contain rounded cursor-pointer hover:opacity-95"
                      onClick={() => openAttachment(previewModal.fileJawaban, previewModal.fileUrl)}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewModal({ open: false, siswaNama: '', jawaban: '', fileJawaban: null })}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TugasKelasGradeForm
