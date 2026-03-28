import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Search, Plus, RefreshCw, Eye, Edit, Trash2, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { gelombangService } from '../services/ppdbService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import usePermission from '../../../hooks/usePermission'

const STATUS_MAP = {
  1: { label: 'Aktif', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  0: { label: 'Nonaktif', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  true: { label: 'Aktif', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  false: { label: 'Nonaktif', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const ActionsMenu = ({ data, onDetail, onEdit, onDelete,
  canEdit = true,
  canDelete = true
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const handleAction = (action) => {
    setIsOpen(false)
    action()
  }

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
      if (isOutsideButton && isOutsideMenu) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        title="Actions"
      >
        <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
      </button>
      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[10000]"
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          <div className="py-1">
            <button onClick={() => handleAction(onDetail)} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
              <Eye size={16} className="text-blue-600" /> Detail
            </button>
            {canEdit && (
              <button onClick={() => handleAction(onEdit)} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
              <Edit size={16} className="text-yellow-600" /> Edit
            </button>
            )}
            {canEdit && canDelete && (
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            )}
            {canDelete && (
              <button onClick={() => handleAction(onDelete)} className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
              <Trash2 size={16} /> Hapus
            </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const GelombangList = () => {
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

  const handleEdit = useCallback((data) => navigate(`/ppdb/gelombang/${data.id}/edit`), [navigate])
  const handleDetail = useCallback((data) => navigate(`/ppdb/gelombang/${data.id}`), [navigate])

  const handleDelete = useCallback(async (data) => {
    const label = `Gelombang "${data.nama_gelombang || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await gelombangService.delete(data.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus gelombang')
      }
    }
  }, [])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
  }, [])

  const onFilterTextBoxChanged = useCallback((e) => {
    setSearchText(e.target.value)
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const columnDefs = useMemo(() => [
    { field: 'id', headerName: 'ID', sortable: true, filter: true, width: 80, minWidth: 70 },
    { field: 'nama_gelombang', headerName: 'Nama Gelombang', sortable: true, filter: true, flex: 2, minWidth: 200, cellRenderer: (params) => params.value || '-' },
    {
      field: 'tahunAjaran',
      backendField: 'tahunAjaran.tahun_ajaran',
      headerName: 'Tahun Ajaran',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 140,
      valueGetter: (params) => params.data?.tahunAjaran?.tahun_ajaran || params.data?.tahun_ajaran?.nama || params.data?.tahun_ajaran_id || '-'
    },
    {
      field: 'tgl_mulai',
      headerName: 'Tgl Mulai',
      sortable: true,
      filter: true,
      width: 130,
      minWidth: 120,
      cellRenderer: (params) => formatDate(params.value)
    },
    {
      field: 'tgl_selesai',
      headerName: 'Tgl Selesai',
      sortable: true,
      filter: true,
      width: 130,
      minWidth: 120,
      cellRenderer: (params) => formatDate(params.value)
    },
    {
      field: 'biaya_pendaftaran',
      headerName: 'Biaya',
      sortable: true,
      filter: true,
      width: 140,
      minWidth: 120,
      cellRenderer: (params) => {
        if (params.value === null || params.value === undefined) return '-'
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(params.value)
      }
    },
    {
      field: 'is_active',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 110,
      minWidth: 100,
      cellRenderer: (params) => {
        const val = params.value
        if (val === null || val === undefined) return '-'
        const key = String(val)
        const info = STATUS_MAP[key] || STATUS_MAP[val] || { label: String(val), bg: 'bg-gray-100 text-gray-800' }
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.bg}`}>{info.label}</span>
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
            canEdit={can('ppdb.gelombang.update')}
            canDelete={can('ppdb.gelombang.delete')}
          />
        </div>
      )
    }
  ], [handleDetail, handleEdit, handleDelete])

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true, filter: true }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gelombang PPDB</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari gelombang..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          {can('ppdb.gelombang.create') && (
            <Button onClick={() => navigate('/ppdb/gelombang/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Gelombang
            </Button>
          )}
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/ppdb/gelombang/"
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

export default GelombangList