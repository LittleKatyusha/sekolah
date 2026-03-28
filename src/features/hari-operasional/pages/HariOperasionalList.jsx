import { useMemo, useCallback, useRef } from 'react'
import { RefreshCw } from 'lucide-react'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { hariOperasionalService } from '../services/hariOperasionalService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const HariOperasionalList = () => {
  const gridRef = useRef(null)

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'asc',
    search: '',
    filter: '{}',
  }), [])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
  }, [])

  const handleToggle = useCallback(async (row) => {
    if (!row?.id) {
      showError('Data hari operasional tidak valid')
      return
    }

    const newValue = !row.is_active
    const { error } = await hariOperasionalService.update(row.id, { is_active: newValue })

    if (!error) {
      showSuccess(`${row?.hari ?? 'Hari'} berhasil ${newValue ? 'diaktifkan' : 'dinonaktifkan'}`)
      if (gridRef.current?.refreshGrid) {
        gridRef.current.refreshGrid()
      }
    } else {
      showError('Gagal mengubah status hari operasional')
    }
  }, [])

  const columnDefs = useMemo(() => [
    {
      field: 'id',
      headerName: 'No',
      width: 80,
      minWidth: 60,
      valueGetter: (params) => params.node.rowIndex + 1,
      sortable: false,
      filter: false,
    },
    {
      field: 'hari',
      headerName: 'Hari',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 150,
      minWidth: 120,
      sortable: true,
      cellRenderer: (params) => {
        const isActive = Boolean(params.value)
        const row = params.data
        const hariLabel = row?.hari ?? 'hari operasional'
        const isDisabled = !row?.id

        return (
          <div className="h-full flex items-center">
            <button
              onClick={() => !isDisabled && handleToggle(row)}
              disabled={isDisabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              role="switch"
              aria-checked={isActive}
              aria-label={`Toggle ${hariLabel}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        )
      },
    },
    {
      field: 'is_active',
      headerName: 'Keterangan',
      width: 160,
      minWidth: 130,
      cellRenderer: (params) => {
        const isActive = params.value
        const colorClass = isActive
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {isActive ? 'Aktif' : 'Tidak Aktif'}
          </span>
        )
      },
    },
  ], [handleToggle])

  const defaultColDef = useMemo(() => ({
    resizable: true,
  }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hari Operasional</h1>
        <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
          <RefreshCw size={18} />
        </Button>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/admin/hari-operasional/"
          staticParams={staticParams}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          cacheBlockSize={20}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          height={450}
        />
      </Card>
    </div>
  )
}

export default HariOperasionalList