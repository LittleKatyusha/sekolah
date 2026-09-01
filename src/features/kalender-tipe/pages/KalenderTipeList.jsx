import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, RefreshCw, Edit, Trash2, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { kalenderTipeService } from '../services/kalenderTipeService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const ActionsMenu = ({ data, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const handleAction = (action) => { setIsOpen(false); action() }
  const handleButtonClick = (e) => {
    e.stopPropagation()
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + window.scrollY, left: rect.right + window.scrollX - 192 })
    }
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target) && (!menuRef.current || !menuRef.current.contains(e.target))) setIsOpen(false)
    }
    if (isOpen) { document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside) }
  }, [isOpen])

  return (
    <div className="relative">
      <button ref={buttonRef} onClick={handleButtonClick} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Actions">
        <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
      </button>
      {isOpen && createPortal(
        <div ref={menuRef} className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[10000]" style={{ top: `${position.top}px`, left: `${position.left}px` }}>
          <div className="py-1">
            <PermissionGuard permission="kalender-tipe.manage">
              <button onClick={() => handleAction(onEdit)} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                <Edit size={16} className="text-yellow-600" /> Edit
              </button>
            </PermissionGuard>
            <PermissionGuard permission="kalender-tipe.manage">
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button onClick={() => handleAction(onDelete)} className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                  <Trash2 size={16} /> Hapus
                </button>
              </>
            </PermissionGuard>
          </div>
        </div>, document.body
      )}
    </div>
  )
}

const KalenderTipeList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    filter: '{}',
  }), [])

  const handleDelete = useCallback(async (data) => {
    const result = await showDeleteConfirm(data.nama)
    if (result.isConfirmed) {
      const { error } = await kalenderTipeService.delete(data.id)
      if (!error) {
        showSuccess(`${data.nama} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus kalender tipe')
      }
    }
  }, [])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
    if (gridRef.current?.api) {
      gridRef.current.api.refreshInfiniteCache()
    }
  }, [])

  const BoolBadge = ({ value, trueLabel = 'Ya', falseLabel = 'Tidak' }) => {
    const colorClass = value ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>{value ? trueLabel : falseLabel}</span>
  }

  const columnDefs = useMemo(() => [
    { field: 'kode', headerName: 'Kode', sortable: true, filter: true, width: 120, minWidth: 100 },
    { field: 'nama', headerName: 'Nama', sortable: true, filter: true, flex: 1, minWidth: 180 },
    {
      field: 'warna', headerName: 'Warna', width: 120, minWidth: 100,
      cellRenderer: (params) => params.value ? (
        <div className="h-full flex items-center gap-2">
          <div className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: params.value }}></div>
          <span className="text-xs">{params.value}</span>
        </div>
      ) : '-'
    },
    { field: 'keterangan', headerName: 'Keterangan', sortable: true, filter: true, width: 200, minWidth: 150, cellRenderer: (p) => p.value || '-' },
    { field: 'is_libur', headerName: 'Libur', width: 90, cellRenderer: (p) => <BoolBadge value={p.value} /> },
    { field: 'is_ujian', headerName: 'Ujian', width: 90, cellRenderer: (p) => <BoolBadge value={p.value} /> },
    { field: 'is_penting', headerName: 'Penting', width: 100, cellRenderer: (p) => <BoolBadge value={p.value} /> },
    {
      headerName: 'Aksi', width: 80, minWidth: 80, maxWidth: 80, sortable: false, filter: false,
      cellRenderer: (params) => (
        <div className="h-full flex items-center justify-center">
          <ActionsMenu data={params.data}
            onEdit={() => navigate(`/admin/kalender-tipe/${params.data.id}/edit`)}
            onDelete={() => handleDelete(params.data)}
          />
        </div>
      )
    }
  ], [navigate, handleDelete])

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true, filter: true }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kalender Akademik Tipe</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary"><RefreshCw size={18} /></Button>
          <PermissionGuard permission="kalender-tipe.manage">
            <Button onClick={() => navigate('/admin/kalender-tipe/create')}><Plus size={18} className="mr-2" /> Tambah Tipe</Button>
          </PermissionGuard>
        </div>
      </div>
      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/admin/kalender-tipe/"
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

export default KalenderTipeList
