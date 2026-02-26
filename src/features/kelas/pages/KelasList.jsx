import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, Plus, RefreshCw, Eye, Edit, Trash2, Users, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { kelasService } from '../services/kelasService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

// Actions Menu Component
const ActionsMenu = ({ data, onViewSiswa, onDetail, onEdit, onDelete }) => {
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
        left: rect.right + window.scrollX - 192 // 192px = w-48
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
              onClick={() => handleAction(onViewSiswa)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Users size={16} className="text-purple-600" />
              Lihat Siswa
            </button>
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

const KelasList = () => {
  const navigate = useNavigate()
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalRows, setTotalRows] = useState(0)
  const [cursor, setCursor] = useState(null)

  const fetchKelas = useCallback(async (page = 1, size = pageSize, search = searchText, cursorParam = null) => {
    setLoading(true)
    
    const params = {
      per_page: size,
      page: page
    }
    
    // Add search parameter if provided
    if (search && search.trim()) {
      params.search = search.trim()
    }
    
    // Add cursor for pagination if provided
    if (cursorParam) {
      params.cursor = cursorParam
    }
    
    const { data, error } = await kelasService.getAll(params)
    
    if (data) {
      setRowData(data.data || [])
      // Update pagination info from meta
      if (data.meta) {
        setTotalRows(data.meta.total || 0)
        setCurrentPage(data.meta.current_page || 1)
        // Store next cursor if available
        if (data.meta.next_cursor) {
          setCursor(data.meta.next_cursor)
        }
      }
    } else {
      console.error('Error fetching kelas:', error)
      showError('Gagal mengambil data kelas')
    }
    
    setLoading(false)
  }, [pageSize, searchText])

  // Initial load
  useEffect(() => {
    fetchKelas(1, pageSize, searchText)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = (data) => {
    navigate(`/kelas/${data.id}/edit`)
  }

  const handleDetail = (data) => {
    navigate(`/kelas/${data.id}`)
  }

  const handleDelete = async (data) => {
    const result = await showDeleteConfirm(data.nama_kelas)
    if (result.isConfirmed) {
      const { error } = await kelasService.delete(data.id)
      if (!error) {
        showSuccess(`${data.nama_kelas} berhasil dihapus!`)
        fetchKelas(currentPage, pageSize, searchText)
      } else {
        showError('Gagal menghapus kelas')
      }
    }
  }

  const handleViewSiswa = (data) => {
    navigate(`/kelas/${data.id}/siswa`)
  }

  const columnDefs = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      sortable: true,
      filter: true,
      width: 70,
      minWidth: 70,
      maxWidth: 100
    },
    {
      field: 'nama_kelas',
      headerName: 'Nama Kelas',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 120
    },
    {
      field: 'tingkat',
      headerName: 'Tingkat',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => {
        const tingkat = params.value
        let colorClass = 'bg-blue-100 text-blue-800'
        
        if (tingkat === 10) colorClass = 'bg-green-100 text-green-800'
        else if (tingkat === 11) colorClass = 'bg-yellow-100 text-yellow-800'
        else if (tingkat === 12) colorClass = 'bg-red-100 text-red-800'

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            Kelas {tingkat}
          </span>
        )
      }
    },
    {
      field: 'tahun_ajaran',
      headerName: 'Tahun Ajaran',
      sortable: true,
      filter: true,
      width: 130,
      minWidth: 110
    },
    {
      field: 'kapasitas',
      headerName: 'Kapasitas',
      sortable: true,
      filter: true,
      width: 100,
      minWidth: 90,
      cellRenderer: (params) => {
        return params.value || '-'
      }
    },
    {
      field: 'jumlah_siswa',
      headerName: 'Jumlah Siswa',
      sortable: true,
      filter: true,
      width: 130,
      minWidth: 110,
      cellRenderer: (params) => {
        const jumlah = params.value || 0
        const kapasitas = params.data?.kapasitas
        
        return (
          <div className="flex items-center gap-1">
            <Users size={14} className="text-gray-500" />
            <span>{jumlah}</span>
            {kapasitas && (
              <span className="text-gray-400 text-xs">/ {kapasitas}</span>
            )}
          </div>
        )
      }
    },
    {
      field: 'wali_guru',
      headerName: 'Wali Kelas',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 150,
      cellRenderer: (params) => {
        return params.value?.nama || '-'
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
              onViewSiswa={() => handleViewSiswa(params.data)}
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

  const onFilterTextBoxChanged = useCallback((e) => {
    const value = e.target.value
    setSearchText(value)
    // Reset to first page when searching
    setCurrentPage(1)
    setCursor(null)
    // Fetch with new search term
    fetchKelas(1, pageSize, value)
  }, [fetchKelas, pageSize])

  const onRefresh = useCallback(() => {
    setCurrentPage(1)
    setCursor(null)
    fetchKelas(1, pageSize, searchText)
  }, [fetchKelas, pageSize, searchText])

  const onPaginationChanged = useCallback((params) => {
    const newPage = params.api.paginationGetCurrentPage() + 1 // AG Grid uses 0-based index
    const newPageSize = params.api.paginationGetPageSize()
    
    // Only fetch if page or page size actually changed
    if (newPage !== currentPage || newPageSize !== pageSize) {
      setPageSize(newPageSize)
      setCurrentPage(newPage)
      fetchKelas(newPage, newPageSize, searchText)
    }
  }, [currentPage, pageSize, searchText, fetchKelas])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Kelas</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari kelas..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={onRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <Button onClick={() => navigate('/kelas/create')}>
            <Plus size={18} className="mr-2" />
            Tambah Kelas
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
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={pageSize}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              paginationGetRowCount={totalRows}
              onPaginationChanged={onPaginationChanged}
              animateRows={true}
              overlayLoadingTemplate={'<span class="ag-overlay-loading-center">Loading...</span>'}
              overlayNoRowsTemplate={'<span class="ag-overlay-no-rows-center">Tidak ada data</span>'}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default KelasList