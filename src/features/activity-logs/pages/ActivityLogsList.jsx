import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { RefreshCw, Eye, MoreVertical } from 'lucide-react'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ActionBadge from '../components/ActionBadge'

// Module-level pure function — no re-creation per render
const formatDateTime = (val) => {
  if (!val) return '-'
  return new Date(val).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const ActionsMenu = memo(({ onDetail }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const handleButtonClick = useCallback((e) => {
    e.stopPropagation()
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX - 192
      })
    }
    setIsOpen(prev => !prev)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(e.target)
      const isOutsideMenu = !menuRef.current || !menuRef.current.contains(e.target)
      if (isOutsideButton && isOutsideMenu) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
})
ActionsMenu.displayName = 'ActionsMenu'

const ActivityLogsList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    filter: '{}',
  }), [])

  const handleDetail = useCallback((data) => {
    if (!data?.id) return
    navigate(`/admin/activity-logs/${data.id}`)
  }, [navigate])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
    // Also try to purge cache and reload if available
    if (gridRef.current?.api) {
      gridRef.current.api.refreshInfiniteCache()
    }
  }, [])

  const columnDefs = useMemo(() => [
    { field: 'id', headerName: 'ID', width: 80, minWidth: 60, sortable: true },
    {
      field: 'user',
      backendField: 'user_display',
      headerName: 'User',
      flex: 1,
      minWidth: 150,
      valueGetter: (p) => p.data?.user?.name || p.data?.user?.email || '-',
      cellRenderer: (p) => p.value || '-'
    },
    { field: 'action', headerName: 'Action', width: 120, minWidth: 100, cellRenderer: (p) => <ActionBadge action={p.value} /> },
    { field: 'module', headerName: 'Module', width: 150, minWidth: 120, cellRenderer: (p) => p.value || '-' },
    { field: 'description', headerName: 'Description', flex: 1, minWidth: 200, cellRenderer: (p) => p.value || '-' },
    { field: 'ip_address', headerName: 'IP Address', width: 140, minWidth: 120, cellRenderer: (p) => p.value || '-' },
    { field: 'created_at', headerName: 'Waktu', width: 160, minWidth: 140, cellRenderer: (p) => formatDateTime(p.value) },
    {
      headerName: 'Aksi', width: 80, minWidth: 80, maxWidth: 80, suppressSizeToFit: true, sortable: false, filter: false,
      cellRenderer: (p) => {
        const row = p.data
        if (!row) return null
        return (
          <div className="h-full flex items-center justify-center">
            <ActionsMenu onDetail={() => handleDetail(row)} />
          </div>
        )
      }
    }
  ], [handleDetail])

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true, filter: true }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity Logs</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Refresh">
            <RefreshCw size={18} />
          </Button>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/admin/activity-logs/"
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

export default ActivityLogsList