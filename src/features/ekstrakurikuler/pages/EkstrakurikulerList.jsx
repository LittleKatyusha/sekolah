import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Search, Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import { ekstrakurikulerService } from '../services/ekstrakurikulerService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import usePermission from '../../../hooks/usePermission'

const STATUS_MAP = {
  aktif: { label: 'Aktif', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  nonaktif: { label: 'Nonaktif', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const DEBOUNCE_MS = 400

const EkstrakurikulerList = () => {
  const { can } = usePermission()
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search to avoid firing API on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchText])

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    search: debouncedSearch || '',
    filter: '{}',
  }), [debouncedSearch])

  const handleEdit = useCallback((data) => navigate(`/ekstrakurikuler/${data.id}/edit`), [navigate])
  const handleDetail = useCallback((data) => navigate(`/ekstrakurikuler/${data.id}`), [navigate])

  const handleDelete = useCallback(async (data) => {
    const label = `Ekstrakurikuler "${data.nama || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await ekstrakurikulerService.delete(data.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        gridRef.current?.refreshGrid?.()
      } else {
        showError('Gagal menghapus ekstrakurikuler')
      }
    }
  }, [])

  const onFilterTextBoxChanged = useCallback((e) => {
    setSearchText(e.target.value)
  }, [])

  const handleRefresh = useCallback(() => {
    gridRef.current?.refreshGrid?.()
  }, [])

  const columnDefs = useMemo(() => [
    { field: 'id', headerName: 'ID', sortable: true, filter: true, width: 80, minWidth: 70 },
    { field: 'nama', headerName: 'Nama', sortable: true, filter: true, flex: 2, minWidth: 180, cellRenderer: (params) => params.value || '-' },
    {
      field: 'pembina_guru',
      backendField: 'pembina.nama',
      headerName: 'Pembina/Guru',
      sortable: true,
      filter: true,
      flex: 1.5,
      minWidth: 160,
      valueGetter: (params) => params.data?.pembina_guru?.nama || params.data?.pembina?.nama || '-'
    },
    { field: 'hari', headerName: 'Hari', sortable: true, filter: true, width: 120, minWidth: 100, cellRenderer: (params) => params.value || '-' },
    {
      headerName: 'Jam',
      sortable: false,
      filter: false,
      width: 140,
      minWidth: 120,
      valueGetter: (params) => {
        const mulai = params.data?.jam_mulai
        const selesai = params.data?.jam_selesai
        if (!mulai && !selesai) return '-'
        return `${mulai || '?'} - ${selesai || '?'}`
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
              canEdit={can('ekstrakurikuler.update')}
              canDelete={can('ekstrakurikuler.delete')}
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ekstrakurikuler</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari ekstrakurikuler..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          {can('ekstrakurikuler.create') && (
            <Button onClick={() => navigate('/ekstrakurikuler/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Ekskul
            </Button>
          )}
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/ekstrakurikuler/"
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

export default EkstrakurikulerList
