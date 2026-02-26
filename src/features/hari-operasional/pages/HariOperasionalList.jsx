import { useState, useEffect, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { RefreshCw } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { hariOperasionalService } from '../services/hariOperasionalService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const HariOperasionalList = () => {
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data, error } = await hariOperasionalService.getAll({ per_page: 50 })
    if (data) {
      setRowData(data.data || [])
    } else {
      console.error('Error fetching hari operasional:', error)
      showError('Gagal mengambil data hari operasional')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const handleToggle = async (row) => {
    const newValue = !row.is_active
    const { error } = await hariOperasionalService.update(row.id, { is_active: newValue })
    if (!error) {
      showSuccess(`${row.hari} berhasil ${newValue ? 'diaktifkan' : 'dinonaktifkan'}`)
      setRowData(prev => prev.map(item =>
        item.id === row.id ? { ...item, is_active: newValue } : item
      ))
    } else {
      showError('Gagal mengubah status hari operasional')
    }
  }

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
        const isActive = params.value
        return (
          <div className="h-full flex items-center">
            <button
              onClick={() => handleToggle(params.data)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              role="switch"
              aria-checked={isActive}
              aria-label={`Toggle ${params.data.hari}`}
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
  ], [])

  const defaultColDef = useMemo(() => ({
    resizable: true,
  }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hari Operasional</h1>
        <Button onClick={fetchData} variant="secondary" title="Refresh Data">
          <RefreshCw size={18} />
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="ag-theme-alpine dark:ag-theme-alpine-dark w-full" style={{ height: 450 }}>
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              animateRows={true}
              domLayout="normal"
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default HariOperasionalList