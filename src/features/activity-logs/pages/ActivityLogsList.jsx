import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, RefreshCw, Eye, MoreVertical } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { activityLogsService } from '../services/activityLogsService'
import { showError } from '../../../utils/sweetalert'

const ActionsMenu = ({ data, onDetail }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const handleButtonClick = (e) => {
    e.stopPropagation()
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX - 192
      })
    }
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(e.target)
      const isOutsideMenu = !menuRef.current || !menuRef.current.contains(e.target)
      if (isOutsideButton && isOutsideMenu) setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative">
      <button ref={buttonRef} onClick={handleButtonClick} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Actions">
        <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
      </button>
      {isOpen && createPortal(
        <div ref={menuRef} className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[10000]" style={{ top: `${position.top}px`, left: `${position.left}px` }}>
          <div className="py-1">
            <button onClick={() => { setIsOpen(false); onDetail() }} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
              <Eye size={16} className="text-blue-600" />
              Detail
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const ActionBadge = ({ action }) => {
  const config = {
    create: { label: 'Create', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    update: { label: 'Update', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
    delete: { label: 'Delete', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    login: { label: 'Login', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
    logout: { label: 'Logout', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  }
  const c = config[action?.toLowerCase()] || { label: action || '-', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400' }
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.className}`}>{c.label}</span>
}

const ActivityLogsList = () => {
  const navigate = useNavigate()
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalRows, setTotalRows] = useState(0)

  const fetchLogs = useCallback(async (page = 1, perPage = pageSize, search = searchText) => {
    setLoading(true)
    const params = { per_page: perPage, page }
    if (search?.trim()) params.search = search.trim()

    const { data, error } = await activityLogsService.getAll(params)
    if (data) {
      setRowData(data.data || [])
      if (data.meta) {
        setTotalRows(data.meta.total || 0)
        setCurrentPage(data.meta.current_page || page)
      }
    } else {
      showError('Gagal mengambil data activity logs')
    }
    setLoading(false)
  }, [pageSize, searchText])

  useEffect(() => { fetchLogs(1, pageSize) }, [])

  useEffect(() => {
    const t = setTimeout(() => { fetchLogs(1, pageSize, searchText) }, 300)
    return () => clearTimeout(t)
  }, [searchText, pageSize, fetchLogs])

  const handleDetail = (data) => navigate(`/admin/activity-logs/${data.id}`)

  const onPaginationChanged = useCallback((params) => {
    if (params.api) {
      const newPage = params.api.paginationGetCurrentPage() + 1
      const newPageSize = params.api.paginationGetPageSize()
      if (newPage !== currentPage || newPageSize !== pageSize) {
        setPageSize(newPageSize)
        setCurrentPage(newPage)
        fetchLogs(newPage, newPageSize, searchText)
      }
    }
  }, [currentPage, pageSize, searchText, fetchLogs])

  const formatDateTime = (val) => {
    if (!val) return '-'
    return new Date(val).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const columnDefs = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 80, minWidth: 60, sortable: true },
    {
      field: 'user',
      headerName: 'User',
      flex: 1,
      minWidth: 150,
      valueGetter: (p) => p.data.user?.name || p.data.user?.email || '-',
      cellRenderer: (p) => p.value
    },
    { field: 'action', headerName: 'Action', width: 120, minWidth: 100, cellRenderer: (p) => <ActionBadge action={p.value} /> },
    { field: 'module', headerName: 'Module', width: 150, minWidth: 120, cellRenderer: (p) => p.value || '-' },
    { field: 'description', headerName: 'Description', flex: 1, minWidth: 200, cellRenderer: (p) => p.value || '-' },
    { field: 'ip_address', headerName: 'IP Address', width: 140, minWidth: 120, cellRenderer: (p) => p.value || '-' },
    { field: 'created_at', headerName: 'Waktu', width: 160, minWidth: 140, cellRenderer: (p) => formatDateTime(p.value) },
    {
      headerName: 'Aksi', width: 80, minWidth: 80, maxWidth: 80, suppressSizeToFit: true, sortable: false, filter: false,
      cellRenderer: (p) => (
        <div className="h-full flex items-center justify-center">
          <ActionsMenu data={p.data} onDetail={() => handleDetail(p.data)} />
        </div>
      )
    }
  ], [])

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true, filter: true }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari log..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={() => fetchLogs(currentPage, pageSize, searchText)} variant="secondary" title="Refresh">
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
              paginationPageSize={pageSize}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              onPaginationChanged={onPaginationChanged}
              rowCount={totalRows}
              animateRows={true}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default ActivityLogsList