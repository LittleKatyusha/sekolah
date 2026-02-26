import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, Plus, RefreshCw, Edit, Trash2, MoreVertical, Eye } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { absensiGuruService } from '../services/absensiGuruService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const ActionsMenu = ({ data, onEdit, onDelete, onDetail }) => {
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
            <button onClick={() => handleAction(onDetail)} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
              <Eye size={16} className="text-blue-600" /> Detail
            </button>
            <button onClick={() => handleAction(onEdit)} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
              <Edit size={16} className="text-yellow-600" /> Edit
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button onClick={() => handleAction(onDelete)} className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
              <Trash2 size={16} /> Hapus
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const StatusBadge = ({ status }) => {
  const statusConfig = {
    1: { label: 'Hadir', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    2: { label: 'Sakit', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    3: { label: 'Izin', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    4: { label: 'Alpha', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  }
  const config = statusConfig[status] || { label: status || '-', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400' }
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>{config.label}</span>
}

const AbsensiGuruList = () => {
  const navigate = useNavigate()
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalRows, setTotalRows] = useState(0)

  const fetchAbsensi = useCallback(async (page = 1, perPage = pageSize, searchQuery = searchText) => {
    setLoading(true)
    const params = { page, per_page: perPage }
    if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim()

    const { data, error } = await absensiGuruService.getAll(params)
    if (data) {
      setRowData(data.data || [])
      if (data.meta) {
        setTotalRows(data.meta.total || 0)
        setCurrentPage(data.meta.current_page || page)
      }
    } else {
      console.error('Error fetching absensi guru:', error)
      showError('Gagal mengambil data absensi guru')
    }
    setLoading(false)
  }, [pageSize, searchText])

  useEffect(() => { fetchAbsensi(1, pageSize) }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => { fetchAbsensi(1, pageSize, searchText) }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchText, pageSize, fetchAbsensi])

  const handleDetail = (data) => navigate(`/absensi-guru/${data.id}`)
  const handleEdit = (data) => navigate(`/absensi-guru/edit/${data.id}`)

  const handleDelete = async (data) => {
    const result = await showDeleteConfirm(data.guru?.nama || 'absensi ini')
    if (result.isConfirmed) {
      const { error } = await absensiGuruService.deleteById(data.id)
      if (!error) {
        showSuccess('Absensi guru berhasil dihapus!')
        fetchAbsensi(currentPage, pageSize)
      } else {
        showError('Gagal menghapus absensi guru')
      }
    }
  }

  const onPaginationChanged = useCallback((params) => {
    if (params.api) {
      const newPage = params.api.paginationGetCurrentPage() + 1
      const newPageSize = params.api.paginationGetPageSize()
      if (newPage !== currentPage || newPageSize !== pageSize) {
        setPageSize(newPageSize)
        setCurrentPage(newPage)
        fetchAbsensi(newPage, newPageSize, searchText)
      }
    }
  }, [currentPage, pageSize, searchText, fetchAbsensi])

  const columnDefs = useMemo(() => [
    {
      field: 'guru.nama',
      headerName: 'Nama Guru',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => params.data.guru?.nama || '-',
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'guru.nip',
      headerName: 'NIP',
      sortable: true,
      filter: true,
      width: 160,
      minWidth: 130,
      valueGetter: (params) => params.data.guru?.nip || '-',
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'tanggal',
      headerName: 'Tanggal',
      sortable: true,
      filter: true,
      width: 130,
      minWidth: 110,
      cellRenderer: (params) => {
        if (!params.value) return '-'
        return new Date(params.value).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => <StatusBadge status={params.value} />
    },
    {
      field: 'keterangan',
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
      cellRenderer: (params) => (
        <div className="h-full flex items-center justify-center">
          <ActionsMenu
            data={params.data}
            onDetail={() => handleDetail(params.data)}
            onEdit={() => handleEdit(params.data)}
            onDelete={() => handleDelete(params.data)}
          />
        </div>
      )
    }
  ], [])

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
          <Button onClick={() => fetchAbsensi(currentPage, pageSize, searchText)} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <Button onClick={() => navigate('/absensi-guru/tambah')}>
            <Plus size={18} className="mr-2" />
            Tambah Absensi
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
              suppressPaginationPanel={false}
              cacheBlockSize={pageSize}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default AbsensiGuruList