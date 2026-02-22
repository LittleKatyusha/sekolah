import { useState, useEffect, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, RefreshCw } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { activityLogsService } from '../services/activityLogsService'
import { showError } from '../../../utils/sweetalert'

const ActivityLogsList = () => {
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')

  const fetchActivityLogs = async () => {
    setLoading(true)
    const { data, error } = await activityLogsService.getAll()
    if (data) {
      // Handle both direct array or nested .data structure
      const logs = Array.isArray(data) ? data : (data.data || [])
      setRowData(logs)
    } else {
      console.error('Error fetching activity logs:', error)
      showError('Gagal mengambil data activity logs')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchActivityLogs()
  }, [])

  const getUserDisplay = (user) => {
    if (!user) return '-'
    if (typeof user === 'string') return user
    if (typeof user === 'object') {
      return user.name || user.email || '-'
    }
    return '-'
  }

  const getActionBadgeColor = (action) => {
    const actionColors = {
      'create': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'store': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'read': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'show': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'update': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'edit': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'delete': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'destroy': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'login': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'logout': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    }
    return actionColors[action?.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }

  const columnDefs = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      sortable: true,
      filter: true,
      width: 80,
      minWidth: 60,
    },
    {
      field: 'user',
      headerName: 'User',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 180,
      cellRenderer: (params) => {
        const display = getUserDisplay(params.value)
        return (
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {display}
          </span>
        )
      }
    },
    {
      field: 'action',
      headerName: 'Action',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => {
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(params.value)}`}>
            {params.value || '-'}
          </span>
        )
      }
    },
    {
      field: 'module',
      headerName: 'Module',
      sortable: true,
      filter: true,
      width: 150,
      minWidth: 120,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'reference_table',
      headerName: 'Ref Table',
      sortable: true,
      filter: true,
      width: 150,
      minWidth: 120,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'reference_id',
      headerName: 'Ref ID',
      sortable: true,
      filter: true,
      width: 100,
      minWidth: 80,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'description',
      headerName: 'Description',
      sortable: true,
      filter: true,
      flex: 2,
      minWidth: 200,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'ip_address',
      headerName: 'IP Address',
      sortable: true,
      filter: true,
      width: 140,
      minWidth: 120,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      sortable: true,
      filter: true,
      width: 180,
      minWidth: 160,
      valueFormatter: (params) => {
        if (!params.value) return '-'
        const date = new Date(params.value)
        return date.toLocaleString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }
    }
  ], [])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  const onFilterTextBoxChanged = useCallback((e) => {
    setSearchText(e.target.value)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari activity logs..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={fetchActivityLogs} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="ag-theme-alpine dark:ag-theme-alpine-dark w-full" style={{ height: 600 }}>
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={15}
              paginationPageSizeSelector={[10, 15, 25, 50, 100]}
              quickFilterText={searchText}
              animateRows={true}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default ActivityLogsList