import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Plus,
  RefreshCw,
  LayoutGrid,
  Clock,
  Table as TableIcon,
  CalendarDays,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import useAuthStore from '../../../store/useAuthStore'
import { jadwalPelajaranService } from '../services/jadwalPelajaranService'
import { kelasService } from '../../kelas/services/kelasService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import JadwalTimelineView from '../components/JadwalTimelineView'

const HARI_MAP = {
  MON: 'Senin',
  TUE: 'Selasa',
  WED: 'Rabu',
  THU: 'Kamis',
  FRI: 'Jumat',
  SAT: 'Sabtu',
  SUN: 'Minggu',
}

const JadwalPelajaranList = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const gridRef = useRef(null)

  // View mode: 'timeline' | 'table'
  const [viewMode, setViewMode] = useState('timeline')
  const [cardSchedules, setCardSchedules] = useState([])
  const [kelasList, setKelasList] = useState([])
  const [loadingCards, setLoadingCards] = useState(true)

  // Filters
  const [activeDayTab, setActiveDayTab] = useState('TODAY')
  const [selectedKelasId, setSelectedKelasId] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Determine user identity
  const isSiswa =
    user?.role?.toLowerCase?.() === 'siswa' ||
    user?.roles?.some?.((r) => (r.code || r)?.toLowerCase?.() === 'siswa')

  const studentKelasId =
    user?.siswa?.mst_kelas_id ??
    user?.siswa?.kelas?.id ??
    user?.profile?.mst_kelas_id ??
    null

  // Load classes
  useEffect(() => {
    let isMounted = true
    const fetchKelas = async () => {
      try {
        const { data } = await kelasService.getAll({ per_page: 200 })
        if (isMounted && data?.data) {
          const raw = Array.isArray(data.data) ? data.data : []
          setKelasList(raw)
          if (isSiswa && studentKelasId) {
            setSelectedKelasId(String(studentKelasId))
          }
        }
      } catch (err) {
        console.error('Failed to load kelas list:', err)
      }
    }
    fetchKelas()
    return () => {
      isMounted = false
    }
  }, [isSiswa, studentKelasId])

  // Load cards schedule data
  const fetchCardData = useCallback(async () => {
    setLoadingCards(true)
    try {
      if (selectedKelasId && selectedKelasId !== 'all') {
        const { data, error } = await jadwalPelajaranService.getByKelas(selectedKelasId)
        if (!error && data) {
          const items = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
          setCardSchedules(items)
        } else {
          setCardSchedules([])
        }
      } else {
        const { data, error } = await jadwalPelajaranService.getAll({
          per_page: 300,
          sort_by: 'jam_mulai',
          sort_dir: 'asc',
        })
        if (!error && data) {
          const items = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
          setCardSchedules(items)
        } else {
          setCardSchedules([])
        }
      }
    } catch (err) {
      console.error('Failed to load card schedule data:', err)
      setCardSchedules([])
    } finally {
      setLoadingCards(false)
    }
  }, [selectedKelasId])

  useEffect(() => {
    if (viewMode === 'timeline') {
      fetchCardData()
    }
  }, [viewMode, fetchCardData])

  const staticParams = useMemo(
    () => ({
      sort_by: 'id',
      sort_dir: 'desc',
      filter: '{}',
    }),
    []
  )

  const handleEdit = useCallback(
    (data) => {
      navigate(`/jadwal-pelajaran/${data.id}/edit`)
    },
    [navigate]
  )

  const handleDetail = useCallback(
    (data) => {
      navigate(`/jadwal-pelajaran/${data.id}`)
    },
    [navigate]
  )

  const handleDelete = useCallback(
    async (data) => {
      const label = `Jadwal ${data.kelas?.nama_kelas || ''} - ${HARI_MAP[data.hari] || data.hari}`
      const result = await showDeleteConfirm(label)
      if (result.isConfirmed) {
        const { error } = await jadwalPelajaranService.delete(data.id)
        if (!error) {
          showSuccess(`${label} berhasil dihapus!`)
          fetchCardData()
          if (gridRef.current?.refreshGrid) {
            gridRef.current.refreshGrid()
          }
        } else {
          showError('Gagal menghapus jadwal pelajaran')
        }
      }
    },
    [fetchCardData]
  )

  const handleRefresh = useCallback(() => {
    fetchCardData()
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
    if (gridRef.current?.api) {
      gridRef.current.api.refreshInfiniteCache()
    }
  }, [fetchCardData])

  // AG Grid columnDefs for Table Mode
  const columnDefs = useMemo(
    () => [
      {
        field: 'id',
        backendField: 'id',
        headerName: 'ID',
        sortable: true,
        filter: true,
        width: 80,
        minWidth: 70,
      },
      {
        field: 'kelas.nama_kelas',
        backendField: 'kelas.nama_kelas',
        headerName: 'Kelas',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 120,
        cellRenderer: (params) => params.value || '-',
      },
      {
        field: 'hari',
        backendField: 'hari',
        headerName: 'Hari',
        sortable: true,
        filter: true,
        width: 120,
        minWidth: 100,
        cellRenderer: (params) => {
          const hari = params.value
          if (!hari) return '-'
          return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              {HARI_MAP[hari] || hari}
            </span>
          )
        },
      },
      {
        field: 'jam_mulai',
        backendField: 'jam_mulai',
        headerName: 'Jam Mulai',
        sortable: true,
        filter: true,
        width: 120,
        minWidth: 100,
        cellRenderer: (params) => params.value || '-',
      },
      {
        field: 'jam_selesai',
        backendField: 'jam_selesai',
        headerName: 'Jam Selesai',
        sortable: true,
        filter: true,
        width: 120,
        minWidth: 100,
        cellRenderer: (params) => params.value || '-',
      },
      {
        field: 'guru_mapel.mapel.nama',
        backendField: 'guru_mapel.mapel.nama',
        headerName: 'Mata Pelajaran',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 150,
        valueGetter: (params) => {
          const mapel = params.data?.guru_mapel?.mapel
          return mapel?.nama || mapel?.nama_mapel || '-'
        },
      },
      {
        field: 'guru_mapel.guru.nama',
        backendField: 'guru_mapel.guru.nama',
        headerName: 'Guru',
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 150,
        cellRenderer: (params) => params.value || '-',
      },
      {
        headerName: 'Aksi',
        width: 80,
        minWidth: 80,
        maxWidth: 80,
        suppressSizeToFit: true,
        sortable: false,
        filter: false,
        cellRenderer: (params) => {
          return (
            <div className="h-full flex items-center justify-center">
              <ActionsMenu
                onDetail={() => handleDetail(params.data)}
                onEdit={() => handleEdit(params.data)}
                onDelete={() => handleDelete(params.data)}
                detailPermission="jadwal-pelajaran.view"
                editPermission="jadwal-pelajaran.update"
                deletePermission="jadwal-pelajaran.delete"
              />
            </div>
          )
        },
      },
    ],
    [handleDetail, handleEdit, handleDelete]
  )

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
    }),
    []
  )

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="text-indigo-600 dark:text-indigo-400" size={26} />
            Jadwal Pelajaran
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Visualisasi timeline dan kartu jadwal pelajaran mingguan interaktif.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Clock size={14} />
              Cards & Timeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <TableIcon size={14} />
              Tabel
            </button>
          </div>

          <Button onClick={handleRefresh} variant="secondary" title="Segarkan Data">
            <RefreshCw size={16} />
          </Button>

          <PermissionGuard permission="jadwal-pelajaran.create">
            <Button
              onClick={() => navigate('/jadwal-pelajaran/matriks')}
              variant="secondary"
              className="border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              title="Penyusunan Jadwal Matriks Mingguan"
            >
              <LayoutGrid size={16} className="mr-1.5" />
              Matriks Mingguan
            </Button>
            <Button onClick={() => navigate('/jadwal-pelajaran/create')}>
              <Plus size={16} className="mr-1.5" />
              Tambah Jadwal
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {viewMode === 'timeline' ? (
        <JadwalTimelineView
          cardSchedules={cardSchedules}
          kelasList={kelasList}
          loading={loadingCards}
          selectedKelasId={selectedKelasId}
          setSelectedKelasId={setSelectedKelasId}
          activeDayTab={activeDayTab}
          setActiveDayTab={setActiveDayTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onDetail={handleDetail}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isSiswa={isSiswa}
        />
      ) : (
        <Card>
          <InfiniteGrid
            ref={gridRef}
            endpoint="/jadwal-pelajaran/"
            staticParams={staticParams}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            cacheBlockSize={20}
            paginationPageSize={20}
            paginationPageSizeSelector={[10, 20, 50, 100]}
            height={600}
          />
        </Card>
      )}
    </div>
  )
}

export default JadwalPelajaranList
