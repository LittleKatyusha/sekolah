import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, RefreshCw, Eye, X, Filter, User, Box, Calendar } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { activityLogsService } from '../services/activityLogsService'
import { showError, showSuccess } from '../../../utils/sweetalert'

const ActivityLogsList = () => {
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const gridRef = useRef()

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [totalRows, setTotalRows] = useState(0)

  // Detail modal state
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Filter states
  const [userIdFilter, setUserIdFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [fromDateFilter, setFromDateFilter] = useState('')
  const [toDateFilter, setToDateFilter] = useState('')
  const [dateRangeFilter, setDateRangeFilter] = useState('')
  const [activeFilters, setActiveFilters] = useState([])

  // Fetch with filters
  const fetchActivityLogs = useCallback(async (filters = {}, page = currentPage, size = pageSize) => {
    setLoading(true)
    const params = {
      page: page,
      per_page: size,
      ...filters
    }
    
    const { data, error } = await activityLogsService.getAll(params)
    if (data) {
      const logs = Array.isArray(data) ? data : (data.data || [])
      setRowData(logs)
      setTotalRows(data.meta?.total || logs.length || 0)
    } else {
      console.error('Error fetching activity logs:', error)
      showError('Gagal mengambil data activity logs')
    }
    setLoading(false)
  }, [currentPage, pageSize])

  const fetchByUser = useCallback(async (userId, page = currentPage, size = pageSize) => {
    if (!userId) return
    setLoading(true)
    const params = {
      page: page,
      per_page: size
    }
    const { data, error } = await activityLogsService.getByUser(userId, params)
    if (data) {
      const logs = Array.isArray(data) ? data : (data.data || [])
      setRowData(logs)
      setTotalRows(data.meta?.total || logs.length || 0)
      showSuccess(`Data filtered by user ID: ${userId}`)
    } else {
      console.error('Error fetching activity logs by user:', error)
      showError('Gagal mengambil data activity logs by user')
    }
    setLoading(false)
  }, [currentPage, pageSize])

  const fetchByModule = useCallback(async (module, page = currentPage, size = pageSize) => {
    if (!module) return
    setLoading(true)
    const params = {
      page: page,
      per_page: size
    }
    const { data, error } = await activityLogsService.getByModule(module, params)
    if (data) {
      const logs = Array.isArray(data) ? data : (data.data || [])
      setRowData(logs)
      setTotalRows(data.meta?.total || logs.length || 0)
      showSuccess(`Data filtered by module: ${module}`)
    } else {
      console.error('Error fetching activity logs by module:', error)
      showError('Gagal mengambil data activity logs by module')
    }
    setLoading(false)
  }, [currentPage, pageSize])

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

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const handleViewDetail = async (log) => {
    setLoading(true)
    try {
      const { data, error } = await activityLogsService.getById(log.id)
      if (data) {
        const detailData = data.data || data
        setSelectedLog(detailData)
        setShowDetailModal(true)
      } else {
        console.error('Error fetching activity log detail:', error)
        showError('Gagal mengambil detail activity log')
      }
    } catch (err) {
      console.error('Exception fetching activity log detail:', err)
      showError('Terjadi kesalahan saat mengambil detail')
    } finally {
      setLoading(false)
    }
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedLog(null)
  }

  const handleApplyFilters = async () => {
    // Track active filters for UI
    const active = []
    if (userIdFilter) active.push({ type: 'user_id', value: userIdFilter, label: `User: ${userIdFilter}` })
    if (moduleFilter) active.push({ type: 'module', value: moduleFilter, label: `Module: ${moduleFilter}` })
    if (fromDateFilter) active.push({ type: 'from_date', value: fromDateFilter, label: `From: ${fromDateFilter}` })
    if (toDateFilter) active.push({ type: 'to_date', value: toDateFilter, label: `To: ${toDateFilter}` })
    if (dateRangeFilter) active.push({ type: 'date_range', value: dateRangeFilter, label: `Range: ${dateRangeFilter}` })
    setActiveFilters(active)

    setCurrentPage(1) // Reset to first page when applying filters

    // Use specific endpoints for user/module filters
    if (userIdFilter && !moduleFilter) {
      await fetchByUser(userIdFilter, 1, pageSize)
    } else if (moduleFilter && !userIdFilter) {
      await fetchByModule(moduleFilter, 1, pageSize)
    } else {
      const filters = {}
      if (fromDateFilter) filters.from_date = fromDateFilter
      if (toDateFilter) filters.to_date = toDateFilter
      if (dateRangeFilter) filters.date_range = dateRangeFilter
      if (searchText) filters.search = searchText
      
      if (userIdFilter) {
        await fetchByUser(userIdFilter, 1, pageSize)
      } else {
        await fetchActivityLogs(filters, 1, pageSize)
      }
    }
  }

  const handleClearFilters = () => {
    setUserIdFilter('')
    setModuleFilter('')
    setFromDateFilter('')
    setToDateFilter('')
    setDateRangeFilter('')
    setSearchText('')
    setActiveFilters([])
    setCurrentPage(1) // Reset to first page when clearing filters
    fetchActivityLogs({}, 1, pageSize)
  }

  const removeFilter = (filterType) => {
    switch (filterType) {
      case 'user_id':
        setUserIdFilter('')
        break
      case 'module':
        setModuleFilter('')
        break
      case 'from_date':
        setFromDateFilter('')
        break
      case 'to_date':
        setToDateFilter('')
        break
      case 'date_range':
        setDateRangeFilter('')
        break
      default:
        break
    }
    setTimeout(() => {
      handleApplyFilters()
    }, 0)
  }

  const handleRefresh = () => {
    if (userIdFilter) {
      fetchByUser(userIdFilter, currentPage, pageSize)
    } else if (moduleFilter) {
      fetchByModule(moduleFilter, currentPage, pageSize)
    } else {
      const filters = {}
      if (fromDateFilter) filters.from_date = fromDateFilter
      if (toDateFilter) filters.to_date = toDateFilter
      if (dateRangeFilter) filters.date_range = dateRangeFilter
      if (searchText) filters.search = searchText
      fetchActivityLogs(filters, currentPage, pageSize)
    }
  }

  const onPaginationChanged = useCallback((params) => {
    const newPage = params.api.paginationGetCurrentPage() + 1
    const newPageSize = params.api.paginationGetPageSize()
    
    if (newPage !== currentPage || newPageSize !== pageSize) {
      setCurrentPage(newPage)
      setPageSize(newPageSize)
      
      // Fetch data with new pagination
      if (userIdFilter) {
        fetchByUser(userIdFilter, newPage, newPageSize)
      } else if (moduleFilter) {
        fetchByModule(moduleFilter, newPage, newPageSize)
      } else {
        const filters = {}
        if (fromDateFilter) filters.from_date = fromDateFilter
        if (toDateFilter) filters.to_date = toDateFilter
        if (dateRangeFilter) filters.date_range = dateRangeFilter
        if (searchText) filters.search = searchText
        fetchActivityLogs(filters, newPage, newPageSize)
      }
    }
  }, [currentPage, pageSize, userIdFilter, moduleFilter, fromDateFilter, toDateFilter, dateRangeFilter, searchText, fetchByUser, fetchByModule, fetchActivityLogs])

  const onFilterTextBoxChanged = useCallback((e) => {
    const value = e.target.value
    setSearchText(value)
    setCurrentPage(1) // Reset to first page when searching
    // Debounce the search by using a timeout
    const timeoutId = setTimeout(() => {
      const filters = {}
      if (fromDateFilter) filters.from_date = fromDateFilter
      if (toDateFilter) filters.to_date = toDateFilter
      if (dateRangeFilter) filters.date_range = dateRangeFilter
      if (value) filters.search = value
      fetchActivityLogs(filters, 1, pageSize)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [pageSize, fromDateFilter, toDateFilter, dateRangeFilter, fetchActivityLogs])

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
        return formatDate(params.value)
      }
    },
    {
      headerName: 'Actions',
      width: 100,
      minWidth: 80,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        return (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handleViewDetail(params.data)}
              className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
              title="View Details"
            >
              <Eye size={18} />
            </button>
          </div>
        )
      }
    }
  ], [])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

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
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter size={18} className="text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* User ID Filter */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="number"
                placeholder="Filter by User ID"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Module Filter */}
            <div className="relative">
              <Box className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Filter by Module"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* From Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="date"
                placeholder="From Date"
                value={fromDateFilter}
                onChange={(e) => setFromDateFilter(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* To Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="date"
                placeholder="To Date"
                value={toDateFilter}
                onChange={(e) => setToDateFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button onClick={handleApplyFilters} variant="primary" size="sm">
              <Filter size={16} className="mr-1.5" />
              Apply Filters
            </Button>
            <Button onClick={handleClearFilters} variant="secondary" size="sm">
              Clear Filters
            </Button>

            {/* Active Filter Chips */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 ml-auto">
                <span className="text-sm text-gray-500">Active:</span>
                {activeFilters.map((filter) => (
                  <span
                    key={filter.type}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400 rounded-full"
                  >
                    {filter.label}
                    <button
                      onClick={() => removeFilter(filter.type)}
                      className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="ag-theme-alpine dark:ag-theme-alpine-dark w-full" style={{ height: 600 }}>
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={pageSize}
              paginationPageSizeSelector={[10, 15, 25, 50, 100]}
              paginationNumberFormatter={(params) => `${params.value.toLocaleString()}`}
              onPaginationChanged={onPaginationChanged}
              rowCount={totalRows}
              animateRows={true}
            />
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Eye className="text-primary-600 dark:text-primary-400" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Activity Log Detail
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {selectedLog.id}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDetailModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* User Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">User Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedLog.user?.name || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedLog.user?.email || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">User ID</label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedLog.sys_user_id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getActionBadgeColor(selectedLog.action)}`}>
                    {selectedLog.action || '-'}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Module</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {selectedLog.module || '-'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ref Table</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {selectedLog.reference_table || '-'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ref ID</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {selectedLog.reference_id || '-'}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedLog.description && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {selectedLog.description}
                  </p>
                </div>
              )}

              {/* Technical Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP Address</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1 font-mono">
                    {selectedLog.ip_address || '-'}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created At</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {formatDate(selectedLog.created_at)}
                  </p>
                </div>
              </div>

              {/* User Agent */}
              {selectedLog.user_agent && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">User Agent</label>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 font-mono break-all">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <Button onClick={closeDetailModal} variant="secondary" size="sm">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivityLogsList