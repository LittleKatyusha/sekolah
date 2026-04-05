import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, RefreshCw } from 'lucide-react'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { absensiGuruService } from '../services/absensiGuruService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const DEBOUNCE_DELAY = 400

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}


const StatusBadge = memo(({ status }) => {
  const statusConfig = {
    1: { label: 'Hadir', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    2: { label: 'Sakit', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    3: { label: 'Izin', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    4: { label: 'Alpha', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  }
  const config = statusConfig[status] || { label: status || '-', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400' }
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>{config.label}</span>
})

StatusBadge.displayName = 'StatusBadge'

const AbsensiGuruList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [searchText, setSearchText] = useState('')
  const [debouncedSearchText, setDebouncedSearchText] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText)
    }, DEBOUNCE_DELAY)
    return () => clearTimeout(timer)
  }, [searchText])

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    search: debouncedSearchText || '',
    filter: '{}',
  }), [debouncedSearchText])

  const handleDetail = useCallback((data) => {
    if (!data?.id) return
    navigate(`/absensi-guru/${data.id}`)
  }, [navigate])

  const handleEdit = useCallback((data) => {
    if (!data?.id) return
    navigate(`/absensi-guru/edit/${data.id}`)
  }, [navigate])

  const handleDelete = useCallback(async (data) => {
    if (!data?.id) {
      showError('Data absensi guru tidak valid')
      return
    }

    const result = await showDeleteConfirm(data.guru?.nama || 'absensi ini')
    if (result.isConfirmed) {
      const { error } = await absensiGuruService.deleteById(data.id)
      if (!error) {
        showSuccess('Absensi guru berhasil dihapus!')
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus absensi guru')
      }
    }
  }, [])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
  }, [])

  const columnDefs = useMemo(() => [
    {
      field: 'guru.nama',
      backendField: 'guru.nama',
      headerName: 'Nama Guru',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => params.data?.guru?.nama || '-',
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'guru.nip',
      backendField: 'guru.nip',
      headerName: 'NIP',
      sortable: true,
      filter: true,
      width: 160,
      minWidth: 130,
      valueGetter: (params) => params.data?.guru?.nip || '-',
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'tanggal',
      backendField: 'tanggal',
      headerName: 'Tanggal',
      sortable: true,
      filter: true,
      width: 130,
      minWidth: 110,
      cellRenderer: (params) => formatDate(params.value)
    },
    {
      field: 'status',
      backendField: 'status',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => <StatusBadge status={params.value} />
    },
    {
      field: 'keterangan',
      backendField: 'keterangan',
      headerName: 'Keterangan',
      sortable: true,
      filter: true,
      width: 200,
      minWidth: 150,
      cellRenderer: (params) => params.value || '-'
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
        const row = params.data
        if (!row) return null

        return (
          <div className="h-full flex items-center justify-center">
            <ActionsMenu
              onDetail={() => handleDetail(row)}
              onEdit={() => handleEdit(row)}
              onDelete={() => handleDelete(row)}
              detailPermission="absensi-guru.view"
              editPermission="absensi-guru.edit"
              deletePermission="absensi-guru.delete"
            />
          </div>
        )
      }
    }
  ], [handleDelete, handleDetail, handleEdit])

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true, filter: true }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Absensi Guru</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari absensi guru..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="absensi-guru.create">
            <Button onClick={() => navigate('/absensi-guru/tambah')}>
              <Plus size={18} className="mr-2" />
              Tambah Absensi
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/absensi-guru"
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

export default AbsensiGuruList