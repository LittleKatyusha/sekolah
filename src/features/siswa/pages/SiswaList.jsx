import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, Plus, RefreshCw, Eye, Edit, Trash2, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { siswaService } from '../services/siswaService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

// Actions Menu Component (portal-based dropdown like Guru)
const ActionsMenu = ({ data, onDetail, onEdit, onDelete }) => {
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
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`
          }}
        >
          <div className="py-1">
            <button
              onClick={() => handleAction(onDetail)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Eye size={16} className="text-blue-600" />
              Detail
            </button>
            <button
              onClick={() => handleAction(onEdit)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Edit size={16} className="text-yellow-600" />
              Edit
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={() => handleAction(onDelete)}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <Trash2 size={16} />
              Hapus
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const SiswaList = () => {
  const navigate = useNavigate()
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  
  // Pagination state
  const [pageSize, setPageSize] = useState(10)
  const [totalRows, setTotalRows] = useState(0)
  
  // Use refs to track pagination state without causing re-renders
  const currentPageRef = useRef(1)
  const pageCursorsRef = useRef({ 1: null }) // Map page number to cursor
  const isFetchingRef = useRef(false)

  const gridRef = useRef(null)

  const fetchSiswa = useCallback(async (page = 1, perPage = pageSize, searchQuery = searchText) => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    
    setLoading(true)
    
    // Get cursor for the requested page
    const cursorValue = pageCursorsRef.current[page]
    
    const params = {
      per_page: perPage,
      ...(searchQuery && { search: searchQuery }),
      ...(cursorValue && { cursor: cursorValue })
    }
    
    const { data, error } = await siswaService.getAll(params)
    
    if (data) {
      setRowData(data.data || [])
      if (data.meta) {
        setTotalRows(data.meta.total || 0)
        currentPageRef.current = data.meta.current_page || page
        
        // Store next cursor for the next page
        if (data.meta.next_cursor) {
          pageCursorsRef.current[page + 1] = data.meta.next_cursor
        }
      }
    } else {
      console.error('Error fetching siswa:', error)
      showError('Gagal mengambil data siswa')
    }
    
    setLoading(false)
    isFetchingRef.current = false
  }, [pageSize, searchText])

  // Initial load
  useEffect(() => {
    // Reset cursors on initial load
    pageCursorsRef.current = { 1: null }
    currentPageRef.current = 1
    fetchSiswa(1, pageSize, searchText)
  }, [])

  const handleEdit = (data) => {
    navigate(`/siswa/${data.id}/edit`)
  }

  const handleDetail = (data) => {
    navigate(`/siswa/${data.id}`)
  }

  const handleDelete = async (data) => {
    const result = await showDeleteConfirm(data.nama)
    if (result.isConfirmed) {
      const { error } = await siswaService.delete(data.id)
      if (!error) {
        showSuccess(`${data.nama} berhasil dihapus!`)
        fetchSiswa(currentPageRef.current, pageSize, searchText)
      } else {
        showError('Gagal menghapus siswa')
      }
    }
  }

  // Handle pagination change from AG Grid
  const onPaginationChanged = useCallback((params) => {
    if (!gridRef.current || isFetchingRef.current) return
    
    const newPageNumber = params.api.paginationGetCurrentPage() + 1 // AG Grid is 0-indexed
    const newPageSize = params.api.paginationGetPageSize()
    
    // Handle page size change - reset and refetch from beginning
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize)
      pageCursorsRef.current = { 1: null }
      currentPageRef.current = 1
      fetchSiswa(1, newPageSize, searchText)
      return
    }
    
    // Handle page number change
    if (newPageNumber !== currentPageRef.current) {
      fetchSiswa(newPageNumber, pageSize, searchText)
    }
  }, [pageSize, searchText, fetchSiswa])

  // Handle search with debounce
  const onFilterTextBoxChanged = useCallback((e) => {
    const value = e.target.value
    setSearchText(value)
    
    // Reset pagination when searching
    pageCursorsRef.current = { 1: null }
    currentPageRef.current = 1
    
    // Reset grid to first page
    if (gridRef.current) {
      gridRef.current.api.paginationGoToPage(0)
    }
    
    fetchSiswa(1, pageSize, value)
  }, [fetchSiswa, pageSize])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchSiswa(currentPageRef.current, pageSize, searchText)
  }, [fetchSiswa, pageSize, searchText])

  const columnDefs = useMemo(() => [
    { 
      field: 'nis', 
      headerName: 'NIS',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100
    },
    { 
      field: 'nisn', 
      headerName: 'NISN',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => params.value || '-'
    },
    { 
      field: 'nama', 
      headerName: 'Nama Lengkap',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 180
    },
    {
      field: 'jenis_kelamin',
      headerName: 'Jenis Kelamin',
      sortable: true,
      filter: true,
      width: 140,
      minWidth: 120,
      cellRenderer: (params) => {
        const jk = params.value
        if (!jk) return '-'
        const isLaki = (jk === 'Laki-Laki' || jk === 'Laki-laki')
        const colorClass = isLaki
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400'

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {jk}
          </span>
        )
      }
    },
    { 
      field: 'kelas.nama_kelas', 
      headerName: 'Kelas',
      sortable: true,
      filter: true,
      width: 130,
      minWidth: 110,
      cellRenderer: (params) => params.value || '-'
    },
    { 
      field: 'status', 
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => {
        const status = params.value
        if (!status) return '-'
        let colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
        
        const statusLower = status.toLowerCase()
        if (statusLower === 'aktif') colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        else if (statusLower === 'lulus') colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
        else if (statusLower === 'keluar') colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        else if (statusLower === 'pindah') colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {status}
          </span>
        )
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
      cellRenderer: (params) => {
        return (
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Siswa</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari siswa..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <Button onClick={() => navigate('/siswa/create')}>
            <Plus size={18} className="mr-2" />
            Tambah Siswa
          </Button>
        </div>
      </div>

      <Card>
        {loading && rowData.length === 0 ? (
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
              paginationPageSizeSelector={[10, 20, 50, 100]}
              onPaginationChanged={onPaginationChanged}
              animateRows={true}
              suppressPaginationPanel={false}
              cacheBlockSize={pageSize}
              rowCount={totalRows}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default SiswaList