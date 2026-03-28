import { useState, useMemo, useCallback, useRef } from 'react'
import { Search, Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import { eksSiswaService } from '../services/ekstrakurikulerService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import usePermission from '../../../hooks/usePermission'

const STATUS_MAP = {
aktif: { label: 'Aktif', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
keluar: { label: 'Keluar', bg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
}

const EksSiswaList = () => {
  const { can } = usePermission()
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [searchText, setSearchText] = useState('')

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    search: searchText || '',
    filter: '{}',
  }), [searchText])

  const handleEdit = useCallback((data) => navigate(`/ekstrakurikuler/siswa/${data.id}/edit`), [navigate])
  const handleDetail = useCallback((data) => navigate(`/ekstrakurikuler/siswa/${data.id}`), [navigate])

  const handleDelete = useCallback(async (data) => {
    const label = `Pendaftaran #${data.id}`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await eksSiswaService.delete(data.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus pendaftaran')
      }
    }
  }, [])

  const onFilterTextBoxChanged = useCallback((e) => {
    setSearchText(e.target.value)
  }, [])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
  }, [])

  const columnDefs = useMemo(() => [
    { field: 'id', headerName: 'ID', sortable: true, filter: true, width: 80, minWidth: 70 },
    {
      field: 'siswa',
      backendField: 'siswa.nama',
      headerName: 'Siswa',
      sortable: true,
      filter: true,
      flex: 1.5,
      minWidth: 160,
      valueGetter: (params) => params.data?.siswa?.nama || '-'
    },
    {
      field: 'ekstrakurikuler',
      backendField: 'ekstrakurikuler.nama',
      headerName: 'Ekstrakurikuler',
      sortable: true,
      filter: true,
      flex: 1.5,
      minWidth: 160,
      valueGetter: (params) => params.data?.ekstrakurikuler?.nama || '-'
    },
    {
      field: 'tanggal_daftar',
      headerName: 'Tanggal Daftar',
      sortable: true,
      filter: true,
      width: 150,
      minWidth: 130,
      cellRenderer: (params) => {
        if (!params.value) return '-'
        const date = new Date(params.value)
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => {
        const status = params.value
        if (!status) return '-'
        const statusInfo = STATUS_MAP[status] || { label: status, bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg}`}>
            {statusInfo.label}
          </span>
        )
      }
    },
    {
      headerName: 'Aksi',
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      suppressSizeToFit: true,
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
        <div className="h-full flex items-center justify-center">
          <ActionsMenu
            data={params.data}
            onDetail={() => handleDetail(params.data)}
            onEdit={() => handleEdit(params.data)}
            onDelete={() => handleDelete(params.data)}
              canEdit={can('ekstrakurikuler.pendaftaran.update')}
              canDelete={can('ekstrakurikuler.pendaftaran.delete')}
            />
        </div>
      )
    }
  ], [handleDelete, handleDetail, handleEdit])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pendaftaran Ekskul Siswa</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari pendaftaran..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          {can('ekstrakurikuler.pendaftaran.create') && (
            <Button onClick={() => navigate('/ekstrakurikuler/siswa/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Pendaftaran
            </Button>
          )}
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/ekstrakurikuler/pendaftaran/"
          requestMode="ag-grid"
          staticParams={staticParams}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          cacheBlockSize={20}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          height={600}
        />
      </Card>
    </div>
  )
}

export default EksSiswaList