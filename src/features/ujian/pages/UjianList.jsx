import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, Plus, RefreshCw, Eye, Edit, Trash2, MoreVertical, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { ujianService } from '../services/ujianService'
import { kelasService } from '../../kelas/services/kelasService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

// Actions Menu Component
const ActionsMenu = ({ data, onDetail, onEdit, onDelete, onNilai }) => {
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
            <button
              onClick={() => handleAction(onNilai)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <FileText size={16} className="text-green-600" />
              Nilai
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

const UjianList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  
  // Kelas filter state
  const [selectedKelas, setSelectedKelas] = useState('')
  const [kelasList, setKelasList] = useState([])
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalRows, setTotalRows] = useState(0)

  // Helper function to map jenis values to labels
  const getJenisLabel = (value) => {
    if (!value) return '-'
    const jenisMap = {
      1: 'PTS',
      2: 'PAS',
      3: 'US',
      4: 'Tryout',
      5: 'Lainnya',
    }
    return jenisMap[value] || `Jenis ${value}`
  }

  // Helper function to get jenis badge color
  const getJenisColorClass = (value) => {
    const colorMap = {
      1: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      2: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      3: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      4: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      5: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    }
    return colorMap[value] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  // Helper function to capitalize semester
  const formatSemester = (value) => {
    if (!value) return '-'
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  // Fetch kelas list on component mount
  useEffect(() => {
    const fetchKelasList = async () => {
      const { data, error } = await kelasService.getAll({ per_page: 100 })
      if (data && data.data) {
        const options = data.data.map(kelas => ({
          value: kelas.id,
          label: kelas.nama_kelas
        }))
        setKelasList(options)
      } else {
        console.error('Error fetching kelas:', error)
      }
    }
    fetchKelasList()
  }, [])

  const fetchData = useCallback(async (page = 1, perPage = 10, search = '', kelasId = '') => {
    setLoading(true)
    
    let result
    if (kelasId) {
      // Use getByKelas when kelas is selected
      result = await ujianService.getByKelas(kelasId)
      if (result.data) {
        // Handle the response format from getByKelas
        const ujianData = result.data.data || result.data || []
        setRowData(Array.isArray(ujianData) ? ujianData : [ujianData])
        setTotalRows(Array.isArray(ujianData) ? ujianData.length : 1)
        setCurrentPage(1)
      }
    } else {
      // Use getAll with pagination and search
      const params = {
        per_page: perPage,
        page: page,
      }
      
      if (search && search.trim() !== '') {
        params.search = search.trim()
      }
      
      result = await ujianService.getAll(params)
      if (result.data) {
        setRowData(result.data.data || [])
        // Extract pagination info from meta
        if (result.data.meta) {
          setTotalRows(result.data.meta.total || 0)
          setCurrentPage(result.data.meta.current_page || page)
        }
      }
    }
    
    if (result.error) {
      console.error('Error fetching ujian:', result.error)
      showError('Gagal mengambil data ujian')
    }
    
    setLoading(false)
  }, [])

  // Initial load
  useEffect(() => {
    fetchData(currentPage, pageSize, searchText, selectedKelas)
  }, [])

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchData(1, pageSize, searchText, selectedKelas)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchText, pageSize, selectedKelas, fetchData])

  const handleEdit = (data) => {
    navigate(`/akademik/ujian/${data.id}/edit`)
  }

  const handleDetail = (data) => {
    navigate(`/akademik/ujian/${data.id}`)
  }

  const handleDelete = async (data) => {
    const result = await showDeleteConfirm(data.nama || `Ujian #${data.id}`)
    if (result.isConfirmed) {
      const { error } = await ujianService.delete(data.id)
      if (!error) {
        showSuccess(`Ujian berhasil dihapus!`)
        fetchData(currentPage, pageSize, searchText, selectedKelas)
      } else {
        showError('Gagal menghapus ujian')
      }
    }
  }

  const handleNilai = (data) => {
    navigate(`/akademik/ujian/${data.id}/nilai`)
  }

  const handleKelasChange = (e) => {
    const kelasId = e.target.value
    setSelectedKelas(kelasId)
    setCurrentPage(1)
  }

  const columnDefs = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
      sortable: true,
      filter: true
    },
    {
      field: 'mapel',
      headerName: 'Mapel',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        return params.data.mapel?.nama || params.data.mapel?.kode || '-'
      }
    },
    {
      field: 'kelas',
      headerName: 'Kelas',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      valueGetter: (params) => {
        return params.data.kelas?.nama_kelas || '-'
      }
    },
    {
      field: 'jenis',
      headerName: 'Jenis',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => {
        const label = getJenisLabel(params.value)
        const colorClass = getJenisColorClass(params.value)
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {label}
          </span>
        )
      }
    },
    {
      field: 'nama',
      headerName: 'Nama',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 150,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'tanggal',
      headerName: 'Tanggal',
      sortable: true,
      filter: true,
      width: 150,
      minWidth: 130,
      cellRenderer: (params) => formatDate(params.value)
    },
    {
      field: 'semester',
      headerName: 'Semester',
      sortable: true,
      filter: true,
      width: 110,
      minWidth: 100,
      cellRenderer: (params) => formatSemester(params.value)
    },
    {
      field: 'tahun_ajaran',
      headerName: 'Tahun Ajaran',
      sortable: true,
      filter: true,
      width: 130,
      minWidth: 110,
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
      cellRenderer: (params) => {
        return (
          <div className="h-full flex items-center justify-center">
            <ActionsMenu
              data={params.data}
              onDetail={() => handleDetail(params.data)}
              onEdit={() => handleEdit(params.data)}
              onDelete={() => handleDelete(params.data)}
              onNilai={() => handleNilai(params.data)}
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

  const onPaginationChanged = useCallback((params) => {
    if (params.api) {
      const newPage = params.api.paginationGetCurrentPage() + 1 // AG Grid uses 0-based index
      const newPageSize = params.api.paginationGetPageSize()
      
      // Only fetch if page or page size actually changed
      if (newPage !== currentPage || newPageSize !== pageSize) {
        setPageSize(newPageSize)
        setCurrentPage(newPage)
        fetchData(newPage, newPageSize, searchText, selectedKelas)
      }
    }
  }, [currentPage, pageSize, searchText, selectedKelas, fetchData])

  const handleRefresh = useCallback(() => {
    fetchData(currentPage, pageSize, searchText, selectedKelas)
  }, [currentPage, pageSize, searchText, selectedKelas, fetchData])

  // Prepare kelas options with "Semua Kelas" as default
  const kelasOptions = [
    { value: '', label: 'Semua Kelas' },
    ...kelasList
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Ujian</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari ujian..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <div className="w-full sm:w-48">
            <SearchableSelect
              name="kelas"
              value={selectedKelas}
              onChange={handleKelasChange}
              options={kelasOptions}
              placeholder="Pilih Kelas"
            />
          </div>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <Button onClick={() => navigate('/akademik/ujian/create')}>
            <Plus size={18} className="mr-2" />
            Tambah Ujian
          </Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : rowData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <FileText size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">Tidak ada data ujian</p>
            <p className="text-sm">Silakan tambah ujian baru atau ubah filter pencarian</p>
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
              paginationNumberFormatter={(params) => `${params.value.toLocaleString()}`}
              onPaginationChanged={onPaginationChanged}
              animateRows={true}
              suppressPaginationPanel={false}
              cacheBlockSize={pageSize}
              rowModelType="clientSide"
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default UjianList