import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Search,
  CheckSquare,
  Square,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Layers,
  User,
  Info,
} from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { guruMapelService } from '../services/guruMapelService'
import { mapelService } from '../../mapel/services/mapelService'
import { apiService } from '../../../utils/api'
import { showSuccess, showError, showConfirm } from '../../../utils/sweetalert'

const GuruMapelBatchForm = () => {
  const navigate = useNavigate()

  const [selectedGuru, setSelectedGuru] = useState('')
  const [selectedGuruOption, setSelectedGuruOption] = useState(null)
  const [existingMapelIds, setExistingMapelIds] = useState([])
  const [selectedMapelIds, setSelectedMapelIds] = useState([])
  const [mapelList, setMapelList] = useState([])
  const [loadingMapels, setLoadingMapels] = useState(false)
  const [loadingTeacherAssignments, setLoadingTeacherAssignments] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [mode, setMode] = useState('sync')

  useEffect(() => {
    const fetchMapels = async () => {
      setLoadingMapels(true)
      const { data, error } = await mapelService.getMapel({ per_page: 'all' })
      if (data?.data) {
        setMapelList(data.data)
      } else if (error) {
        showError('Gagal mengambil daftar mata pelajaran')
      }
      setLoadingMapels(false)
    }

    fetchMapels()
  }, [])

  const searchGuruOptions = useCallback(async (keyword = '') => {
    const { data } = await apiService.get('/guru/', {
      params: { search: keyword || undefined, per_page: 20 },
    })
    if (data?.data) {
      return data.data.map((g) => ({
        value: String(g.id),
        label: `${g.nama}${g.nip ? ` (NIP: ${g.nip})` : ''}`,
      }))
    }
    return []
  }, [])

  const handleGuruChange = useCallback(async (e) => {
    const guruId = e.target.value
    setSelectedGuru(guruId)

    if (!guruId) {
      setExistingMapelIds([])
      setSelectedMapelIds([])
      return
    }

    setLoadingTeacherAssignments(true)
    const { data, error } = await guruMapelService.getByGuru(Number(guruId))
    if (data?.data) {
      const assignedIds = data.data.map((item) => Number(item.mst_mapel_id || item.mapel?.id))
      setExistingMapelIds(assignedIds)
      setSelectedMapelIds(assignedIds)
    } else if (error) {
      showError('Gagal memuat penugasan mapel guru saat ini')
    }
    setLoadingTeacherAssignments(false)
  }, [])

  const filteredMapels = useMemo(() => {
    if (!searchKeyword.trim()) return mapelList
    const kw = searchKeyword.toLowerCase().trim()
    return mapelList.filter(
      (m) =>
        (m.nama_mapel || m.nama || '').toLowerCase().includes(kw) ||
        (m.kode_mapel || m.kode || '').toLowerCase().includes(kw)
    )
  }, [mapelList, searchKeyword])

  const toggleMapel = (mapelId) => {
    const id = Number(mapelId)
    setSelectedMapelIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const selectAllVisible = () => {
    const visibleIds = filteredMapels.map((m) => Number(m.id))
    setSelectedMapelIds((prev) => Array.from(new Set([...prev, ...visibleIds])))
  }

  const unselectAllVisible = () => {
    const visibleIds = new Set(filteredMapels.map((m) => Number(m.id)))
    setSelectedMapelIds((prev) => prev.filter((id) => !visibleIds.has(id)))
  }

  const resetToExisting = () => {
    setSelectedMapelIds([...existingMapelIds])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedGuru) {
      showError('Silakan pilih guru terlebih dahulu')
      return
    }
    if (selectedMapelIds.length === 0) {
      showError('Pilih minimal satu mata pelajaran')
      return
    }

    const confirmRes = await showConfirm(
      `Simpan penugasan ${selectedMapelIds.length} mata pelajaran untuk guru ini?`,
      mode === 'sync'
        ? 'Mode Sinkronisasi: Mata pelajaran yang tidak dicentang akan dinonaktifkan.'
        : 'Mode Tambah: Hanya menambahkan mata pelajaran baru.'
    )
    if (!confirmRes.isConfirmed) return

    setSaving(true)
    const { error } = await guruMapelService.batchStore({
      mst_guru_id: Number(selectedGuru),
      mapel_ids: selectedMapelIds,
      mode,
    })

    if (!error) {
      showSuccess('Penugasan guru mata pelajaran berhasil disimpan!')
      navigate('/guru-mapel')
    } else {
      const msg = error.message || error.errors?.mapel_ids?.[0] || 'Gagal menyimpan penugasan guru mata pelajaran'
      showError(msg)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/guru-mapel')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="text-primary-600 dark:text-primary-400" size={26} />
              Penugasan Massal Guru Mata Pelajaran
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tetapkan beberapa mata pelajaran sekaligus untuk seorang guru dalam 1 transaksi
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User size={20} className="text-blue-500" />
              1. Pilih Guru
            </h2>

            <div className="max-w-xl">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Guru <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                name="mst_guru_id"
                value={selectedGuru}
                onChange={handleGuruChange}
                options={selectedGuruOption ? [selectedGuruOption] : []}
                loadOptions={searchGuruOptions}
                placeholder="Pilih Guru untuk ditugaskan"
                searchPlaceholder="Cari nama atau NIP guru..."
              />
            </div>

            {loadingTeacherAssignments && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Memuat penugasan mata pelajaran saat ini...</span>
              </div>
            )}

            {selectedGuru && !loadingTeacherAssignments && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                <Info size={18} className="flex-shrink-0" />
                <span>
                  Guru ini saat ini ditugaskan pada <strong>{existingMapelIds.length}</strong> mata pelajaran.
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <RotateCcw size={20} className="text-yellow-500" />
              2. Mode Penugasan
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                  mode === 'sync'
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <input
                  type="radio"
                  name="assignment_mode"
                  value="sync"
                  checked={mode === 'sync'}
                  onChange={() => setMode('sync')}
                  className="mt-1 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Mode Sinkronisasi (Sync) - Disarankan
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Seluruh mata pelajaran yang dicentang akan menjadi penugasan aktif guru ini.
                    Mata pelajaran yang tidak dicentang akan dinonaktifkan.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                  mode === 'append'
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <input
                  type="radio"
                  name="assignment_mode"
                  value="append"
                  checked={mode === 'append'}
                  onChange={() => setMode('append')}
                  className="mt-1 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Mode Tambah (Append)
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Hanya menambahkan mata pelajaran baru yang dicentang. Penugasan lama tetap aktif.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen size={20} className="text-green-500" />
                  3. Pilih Mata Pelajaran
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Centang mata pelajaran yang akan diajarkan oleh guru
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300">
                {selectedMapelIds.length} dipilih dari {mapelList.length} total
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
              <div className="relative flex-1 max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari kode atau nama mata pelajaran..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={selectAllVisible}>
                  <CheckSquare size={16} className="mr-1.5" /> Pilih Semua
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={unselectAllVisible}>
                  <Square size={16} className="mr-1.5" /> Kosongkan
                </Button>
                {existingMapelIds.length > 0 && (
                  <Button type="button" variant="secondary" size="sm" onClick={resetToExisting}>
                    <RotateCcw size={16} className="mr-1.5" /> Reset Awal
                  </Button>
                )}
              </div>
            </div>

            {loadingMapels ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
              </div>
            ) : filteredMapels.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400">
                Tidak ada mata pelajaran yang cocok dengan pencarian "{searchKeyword}"
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1">
                {filteredMapels.map((m) => {
                  const id = Number(m.id)
                  const isChecked = selectedMapelIds.includes(id)
                  const isCurrent = existingMapelIds.includes(id)
                  const kode = m.kode_mapel || m.kode || '-'
                  const nama = m.nama_mapel || m.nama || '-'

                  return (
                    <div
                      key={id}
                      onClick={() => toggleMapel(id)}
                      className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/40 shadow-xs'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300 pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs px-2 py-0.5 rounded font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {kode}
                          </span>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                              <CheckCircle2 size={12} /> Aktif
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {nama}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/guru-mapel')}
            disabled={saving}
          >
            Batal
          </Button>

          <PermissionGuard permission="guru-mapel.create">
            <Button
              type="submit"
              disabled={saving || !selectedGuru || selectedMapelIds.length === 0}
            >
              <Save size={18} className="mr-2" />
              {saving
                ? 'Menyimpan...'
                : `Simpan Penugasan (${selectedMapelIds.length} Mapel)`}
            </Button>
          </PermissionGuard>
        </div>
      </form>
    </div>
  )
}

export default GuruMapelBatchForm
