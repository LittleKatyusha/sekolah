import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, Plus, RefreshCw, Eye, Edit, Trash2, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { listSoals, deleteSoal } from '../services/soalService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

// Actions Menu Component
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

const SoalList = () => {
  const navigate = useNavigate()
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalRows, setTotalRows] = useState(0)
  const [cursor, setCursor] = useState(null)

  const fetchSoals = useCallback(async (page = 1, perPage = pageSize, searchQuery = searchText, cursorValue = null) => {
    setLoading(true)
    
    const params = {
      per_page: perPage,
      page: page
    }
    
    // Add search parameter if provided
    if (searchQuery && searchQuery.trim()) {
      params.search = searchQuery.trim()
    }
    
    // Add cursor for pagination if provided
    if (cursorValue) {
      params.cursor = cursorValue
    }
    
    const { data, error } = await listSoals(params)
    
    if (data) {
      setRowData(data.data || [])
      // Update pagination info from meta
      if (data.meta) {
        setTotalRows(data.meta.total || 0)
        setCurrentPage(data.meta.current_page || page)
        setCursor(data.meta.next_cursor || null)
      }
    } else {
      console.error('Error fetching soal:', error)
      showError('Gagal mengambil data soal')
    }
    
    setLoading(false)
  }, [pageSize, searchText])

  // Initial fetch
  useEffect(() => {
    fetchSoals(1, pageSize)
  }, [])

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSoals(1, pageSize, searchText, null)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchText, pageSize, fetchSoals])

  const handleEdit = (data) => {
    navigate(`/akademik/soals/${data.id}/edit`)
  }

  const handleDetail = (data) => {
    navigate(`/akademik/soals/${data.id}`)
  }

  const handleDelete = async (data) => {
    const result = await showDeleteConfirm(`Soal #${data.id}`)
    if (result.isConfirmed) {
      const { error } = await deleteSoal(data.id)
      if (!error) {
        showSuccess(`Soal #${data.id} berhasil dihapus!`)
        // Refresh current page after delete
        fetchSoals(currentPage, pageSize)
      } else {
        showError('Gagal menghapus soal')
      }
    }
  }

  const getTipeLabel = (value) => {
    if (!value) return '-'
    const tipeMap = {
      1: 'Pilihan Ganda',
      2: 'Essay',
      3: 'Isian Singkat',
      4: 'Menjodohkan',
      5: 'Benar/Salah'
    }
    return tipeMap[value] || value
  }

  const getTingkatKesulitanLabel = (value) => {
    if (!value) return '-'
    const tingkatMap = {
      1: 'Mudah',
      2: 'Sedang',
      3: 'Sulit'
    }
    return tingkatMap[value] || value
  }

  // Handle pagination changes from AgGrid
  const onPaginationChanged = useCallback((params) => {
    if (params.api) {
      const newPage = params.api.paginationGetCurrentPage() + 1 // AgGrid uses 0-based index
      const newPageSize = params.api.paginationGetPageSize()
      
      // Only fetch if page or page size actually changed
      if (newPage !== currentPage || newPageSize !== pageSize) {
        setPageSize(newPageSize)
        setCurrentPage(newPage)
        fetchSoals(newPage, newPageSize, searchText)
      }
    }
  }, [currentPage, pageSize, searchText, fetchSoals])

  const columnDefs = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      sortable: true,
      filter: true,
      width: 80,
      minWidth: 70
    },
    {
      field: 'pertanyaan',
      headerName: 'Pertanyaan',
      sortable: true,
      filter: true,
      flex: 2,
      minWidth: 200,
      cellRenderer: (params) => {
        const pertanyaan = params.value || ''
        return pertanyaan.length > 100 
          ? `${pertanyaan.substring(0, 100)}...` 
          : pertanyaan
      }
    },
    {
      field: 'tipe',
      headerName: 'Tipe',
      sortable: true,
      filter: true,
      width: 160,
      minWidth: 140,
      cellRenderer: (params) => {
        const tipe = params.value
        const label = getTipeLabel(tipe)
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
            {label}
          </span>
        )
      }
    },
    {
      field: 'tingkat_kesulitan',
      headerName: 'Tingkat Kesulitan',
      sortable: true,
      filter: true,
      width: 160,
      minWidth: 140,
      cellRenderer: (params) => {
        const tingkat = params.value
        const label = getTingkatKesulitanLabel(tingkat)
        let colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        
        if (tingkat === 2) {
          colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
        } else if (tingkat === 3) {
          colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {label}
          </span>
        )
      }
    },
    {
      field: 'mapel_nama',
      headerName: 'Mata Pelajaran',
      sortable: true,
      filter: true,
      width: 180,
      minWidth: 160
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

  const onFilterTextBoxChanged = useCallback((e) => {
    setSearchText(e.target.value)
  }, [])

  const handleRefresh = useCallback(() => {
    fetchSoals(currentPage, pageSize, searchText)
  }, [currentPage, pageSize, searchText, fetchSoals])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Soal</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari soal..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <Button onClick={() => navigate('/akademik/soals/create')}>
            <Plus size={18} className="mr-2" />
            Tambah Soal
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
              animateRows={true}
              suppressPaginationPanel={false}
              cacheBlockSize={pageSize}
              theme="legacy"
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default SoalList