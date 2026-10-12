import { useMemo, useCallback, useRef, useState, useEffect } from 'react'
import { Plus, RefreshCw, Calendar, Clock, MapPin, Users, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import useAuthStore from '../../../store/useAuthStore'
import { eksKegiatanService, ekstrakurikulerService } from '../services/ekstrakurikulerService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_MAP = {
  dijadwalkan: { label: 'Dijadwalkan', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  terlaksana: { label: 'Terlaksana', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  dibatalkan: { label: 'Dibatalkan', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const EksKegiatanList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const { user } = useAuthStore()

  const isWali = user?.role === 'wali'
  const isSiswa = user?.role === 'siswa'

  const [filterEkskulId, setFilterEkskulId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [ekskulList, setEkskulList] = useState([])
  const [viewMode, setViewMode] = useState(isWali || isSiswa ? 'anak' : 'all')
  const [jadwalAnakData, setJadwalAnakData] = useState([])
  const [loadingJadwalAnak, setLoadingJadwalAnak] = useState(false)

  useEffect(() => {
    ekstrakurikulerService.getAktif().then((res) => {
      if (res.data?.data) setEkskulList(res.data.data)
    })
  }, [])

  useEffect(() => {
    if (viewMode === 'anak') {
      setLoadingJadwalAnak(true)
      eksKegiatanService.getJadwalAnak().then((res) => {
        if (res.data?.data) setJadwalAnakData(res.data.data)
        setLoadingJadwalAnak(false)
      })
    }
  }, [viewMode])

  const staticParams = useMemo(() => {
    const params = { sort_by: 'tanggal', sort_dir: 'desc' }
    const filterObj = {}
    if (filterEkskulId) filterObj.ekstrakurikuler_id = filterEkskulId
    if (filterStatus) filterObj.status = filterStatus
    params.filter = JSON.stringify(filterObj)
    return params
  }, [filterEkskulId, filterStatus])

  const handleEdit = useCallback((data) => navigate(`/ekstrakurikuler/kegiatan/${data.id}/edit`), [navigate])
  const handleDetail = useCallback((data) => navigate(`/ekstrakurikuler/kegiatan/${data.id}`), [navigate])

  const handleDelete = useCallback(async (data) => {
    const label = `Kegiatan "${data.nama_kegiatan || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await eksKegiatanService.delete(data.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        gridRef.current?.refreshGrid?.()
      } else {
        showError('Gagal menghapus kegiatan')
      }
    }
  }, [])

  const handleRefresh = useCallback(() => {
    if (viewMode === 'anak') {
      setLoadingJadwalAnak(true)
      eksKegiatanService.getJadwalAnak().then((res) => {
        if (res.data?.data) setJadwalAnakData(res.data.data)
        setLoadingJadwalAnak(false)
      })
    } else {
      gridRef.current?.refreshGrid?.()
      gridRef.current?.api?.refreshInfiniteCache?.()
    }
  }, [viewMode])

  const columnDefs = useMemo(() => [
    { field: 'id', headerName: 'ID', sortable: true, filter: true, width: 70, minWidth: 60 },
    {
      field: 'tanggal',
      headerName: 'Tanggal',
      sortable: true,
      filter: true,
      width: 130,
      cellRenderer: (p) => p.value ? new Date(p.value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'
    },
    {
      field: 'nama_kegiatan',
      headerName: 'Nama Kegiatan',
      sortable: true,
      filter: true,
      flex: 2,
      minWidth: 170,
      cellRenderer: (p) => <span className="font-medium text-gray-900 dark:text-white">{p.value || '-'}</span>
    },
    {
      field: 'ekstrakurikuler',
      backendField: 'ekstrakurikuler.nama',
      headerName: 'Ekstrakurikuler',
      sortable: true,
      filter: true,
      flex: 1.3,
      valueGetter: (p) => p.data?.ekstrakurikuler?.nama || '-'
    },
    {
      headerName: 'Waktu',
      sortable: false,
      filter: false,
      width: 130,
      valueGetter: (p) => p.data?.jadwal_waktu || (p.data?.jam_mulai ? `${p.data.jam_mulai} - ${p.data.jam_selesai || '?'}` : '-')
    },
    { field: 'lokasi', headerName: 'Lokasi', sortable: true, filter: true, width: 130, cellRenderer: (p) => p.value || '-' },
    {
      field: 'status',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 120,
      cellRenderer: (p) => {
        const s = STATUS_MAP[p.value] || { label: p.value || 'dijadwalkan', bg: 'bg-gray-100 text-gray-800' }
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.bg}`}>{s.label}</span>
      }
    },
    {
      headerName: 'Aksi',
      width: 80,
      suppressSizeToFit: true,
      cellRenderer: (p) => (
        <div className="h-full flex items-center justify-center">
          <ActionsMenu
            data={p.data}
            onDetail={() => handleDetail(p.data)}
            onEdit={() => handleEdit(p.data)}
            onDelete={() => handleDelete(p.data)}
            detailPermission="ekstrakurikuler.kegiatan.view"
            editPermission="ekstrakurikuler.kegiatan.manage"
            deletePermission="ekstrakurikuler.kegiatan.manage"
          />
        </div>
      )
    }
  ], [handleDelete, handleDetail, handleEdit])
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kegiatan Ekstrakurikuler</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Jadwal kegiatan, agenda latihan, dan presensi kegiatan ekskul sekolah.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Refresh">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="ekstrakurikuler.kegiatan.manage">
            <Button onClick={() => navigate('/ekstrakurikuler/kegiatan/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Kegiatan
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {(isWali || isSiswa) && (
        <div className="flex border-b border-gray-200 dark:border-gray-700 space-x-4">
          <button
            onClick={() => setViewMode('anak')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'anak'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            {isWali ? 'Jadwal & Kegiatan Anak Saya' : 'Jadwal & Kegiatan Saya'}
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'all'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Semua Kegiatan Ekskul
          </button>
        </div>
      )}

      {viewMode === 'anak' && (
        <div className="space-y-6">
          {loadingJadwalAnak ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : jadwalAnakData.length === 0 ? (
            <Card>
              <div className="p-8 text-center text-gray-500">
                Belum ada pendaftaran ekstrakurikuler aktif.
              </div>
            </Card>
          ) : (
            jadwalAnakData.map((item) => (
              <div key={item.siswa_id} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {item.siswa_nama}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {item.ekstrakurikuler.map((e) => (
                    <Card key={e.id}>
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{e.nama}</h3>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Terdaftar
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                          <p className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-400" />
                            <span>Jadwal: <strong className="text-gray-800 dark:text-gray-200">{e.jadwal}</strong></span>
                          </p>
                          {e.pembina && (
                            <p className="text-xs text-gray-500">Pembina: {e.pembina}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card>
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-semibold text-gray-800 dark:text-white">Agenda & Kegiatan</h3>
                  </div>
                  {item.kegiatan.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-400">
                      Belum ada agenda kegiatan terbaru yang dijadwalkan.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {item.kegiatan.map((k) => (
                        <div
                          key={k.id}
                          onClick={() => navigate(`/ekstrakurikuler/kegiatan/${k.id}`)}
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                {k.ekstrakurikuler_nama}
                              </span>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {k.nama_kegiatan}
                              </h4>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                              <span className="flex items-center gap-1"><Calendar size={13} /> {k.tanggal}</span>
                              {k.jadwal_waktu && <span className="flex items-center gap-1"><Clock size={13} /> {k.jadwal_waktu}</span>}
                              {k.lokasi && <span className="flex items-center gap-1"><MapPin size={13} /> {k.lokasi}</span>}
                            </div>
                          </div>
                          <div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_MAP[k.status]?.bg || ''}`}>
                              {STATUS_MAP[k.status]?.label || k.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            ))
          )}
        </div>
      )}

      {viewMode === 'all' && (
        <Card>
          <InfiniteGrid
            ref={gridRef}
            endpoint="/ekstrakurikuler/kegiatan/"
            requestMode="ag-grid"
            staticParams={staticParams}
            columnDefs={columnDefs}
          />
        </Card>
      )}
    </div>
  )
}

export default EksKegiatanList
