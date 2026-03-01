import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, Plus, RefreshCw, Eye, Edit, Trash2, MoreVertical, Play, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { ujianUserService } from '../services/ujianUserService'
import { ujianService } from '../../ujian/services/ujianService'
import { siswaService } from '../../siswa/services/siswaService'
import { showDeleteConfirm, showSuccess, showError, showConfirm } from '../../../utils/sweetalert'

// Actions Menu Component
const ActionsMenu = ({ data, onDetail, onEdit, onDelete, onMulai }) => {
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

  // Determine if mulai button should be shown (status 0 = belum mulai)
  const canStart = data.status === 0 || data.status === null

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
            {canStart && (
              <button
                onClick={() => handleAction(onMulai)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Play size={16} className="text-green-600" />
                Mulai Ujian
              </button>
            )}
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

const UjianUserList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  
  // Filter states
  const [selectedUjian, setSelectedUjian] = useState('')
  const [selectedSiswa, setSelectedSiswa] = useState('')
  const [ujianList, setUjianList] = useState([])
  const [siswaList, setSiswaList] = useState([])
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalRows, setTotalRows] = useState(0)

  // Helper function to get status label
  const getStatusLabel = (value) => {
    if (value === null || value === undefined) return 'Belum Mulai'
    const statusMap = {
      0: 'Belum Mulai',
      1: 'Sedang Mengerjakan',
      2: 'Selesai',
      3: 'Dinilai',
    }
    return statusMap[value] || `Status ${value}`
  }

  // Helper function to get status badge color
  const getStatusColorClass = (value) => {
    const colorMap = {
      0: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      1: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      3: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    }
    return colorMap[value] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  // Helper function to format date
  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Fetch ujian list for filter
  useEffect(() => {
    const fetchUjianList = async () => {
      const { data, error } = await ujianService.getAll({ per_page: 100 })
      if (data && data.data) {
        const options = data.data.map(ujian => ({
          value: ujian.id,
          label: ujian.nama || `Ujian #${ujian.id}`
        }))
        setUjianList(options)
      } else {
        console.error('Error fetching ujian:', error)
      }
    }
    fetchUjianList()
  }, [])

  // Fetch siswa list for filter
  useEffect(() => {
    const fetchSiswaList = async () => {
      const { data, error } = await siswaService.getAll({ per_page: 100 })
      if (data && data.data) {
        const options = data.data.map(siswa => ({
          value: siswa.id,
          label: `${siswa.nama} (${siswa.nis})`
        }))
        setSiswaList(options)
      } else {
        console.error('Error fetching siswa:', error)
      }
    }
    fetchSiswaList()
  }, [])

  const fetchData = useCallback(async (page = 1, perPage = 10, search = '') => {
    setLoading(true)
    
    const params = {
      per_page: perPage,
      page: page,
    }
    
    if (search && search.trim() !== '') {
      params.search = search.trim()
    }
    
    if (selectedUjian) {
      params.trx_ujian_id = selectedUjian
    }
    
    if (selectedSiswa) {
      params.mst_siswa_id = selectedSiswa
    }
    
    const { data, error } = await ujianUserService.getAll(params)
    
    if (data) {
      setRowData(data.data || [])
      // Extract pagination info from meta
      if (data.meta) {
        setTotalRows(data.meta.total || 0)
        setCurrentPage(data.meta.current_page || page)
      }
    } else {
      console.error('Error fetching ujian user:', error)
      showError('Gagal mengambil data ujian user')
    }
    
    setLoading(false)
  }, [selectedUjian, selectedSiswa])

  // Initial load
  useEffect(() => {
    fetchData(currentPage, pageSize, searchText)
  }, [])

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchData(1, pageSize, searchText)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchText, pageSize, selectedUjian, selectedSiswa, fetchData])

  const handleEdit = (data) => {
    navigate(`/akademik/ujian-user/${data.id}/edit`)
  }

  const handleDetail = (data) => {
    navigate(`/akademik/ujian-user/${data.id}`)
  }

  const handleDelete = async (data) => {
    const siswaName = data.siswa?.nama || 'Siswa'
    const ujianName = data.ujian?.nama || `Ujian #${data.trx_ujian_id}`
    const result = await showDeleteConfirm(`${siswaName} - ${ujianName}`)
    if (result.isConfirmed) {
      const { error } = await ujianUserService.delete(data.id)
      if (!error) {
        showSuccess(`Ujian user berhasil dihapus!`)
        fetchData(currentPage, pageSize, searchText)
      } else {
        showError('Gagal menghapus ujian user')
      }
    }
  }

  const handleMulai = async (data) => {
    const siswaName = data.siswa?.nama || 'Siswa'
    const ujianName = data.ujian?.nama || `Ujian #${data.trx_ujian_id}`
    const result = await showConfirm(
      `Apakah Anda yakin ingin memulai ujian ${ujianName} untuk ${siswaName}?`,
      'Konfirmasi Mulai Ujian'
    )
    if (result.isConfirmed) {
      const { data: responseData, error } = await ujianUserService.mulaiUjian(data.id)
      if (!error) {
        showSuccess('Ujian berhasil dimulai!')
        navigate(`/akademik/ujian-user/${data.id}/mulai`)
      } else {
        showError('Gagal memulai ujian')
      }
    }
  }

  const handleUjianChange = (e) => {
    setSelectedUjian(e.target.value)
    setCurrentPage(1)
  }

  const handleSiswaChange = (e) => {
    setSelectedSiswa(e.target.value)
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
      field: 'ujian',
      headerName: 'Nama Ujian',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        return params.data.ujian?.nama || `Ujian #${params.data.trx_ujian_id}`
      }
    },
    {
      field: 'siswa',
      headerName: 'Siswa',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => {
        const siswa = params.data.siswa
        if (siswa) {
          return `${siswa.nama} (${siswa.nis})`
        }
        return `Siswa #${params.data.mst_siswa_id}`
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 150,
      minWidth: 130,
      cellRenderer: (params) => {
        const label = getStatusLabel(params.value)
        const colorClass = getStatusColorClass(params.value)
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {label}
          </span>
        )
      }
    },
    {
      field: 'waktu_mulai',
      headerName: 'Waktu Mulai',
      sortable: true,
      filter: true,
      width: 150,
      minWidth: 130,
      cellRenderer: (params) => formatDateTime(params.value)
    },
    {
      field: 'waktu_selesai',
      headerName: 'Waktu Selesai',
      sortable: true,
      filter: true,
      width: 150,
      minWidth: 130,
      cellRenderer: (params) => formatDateTime(params.value)
    },
    {
      field: 'nilai_akhir',
      headerName: 'Nilai Akhir',
      sortable: true,
      filter: true,
      width: 110,
      minWidth: 100,
      cellRenderer: (params) => {
        const nilai = params.value
        if (nilai === null || nilai === undefined) return '-'
        return (
          <span className={`font-semibold ${
            parseFloat(nilai) >= 70 ? 'text-green-600' : 
            parseFloat(nilai) >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {nilai}
          </span>
        )
      }
    },
    {
      field: 'total_benar',
      headerName: 'Benar',
      sortable: true,
      filter: true,
      width: 80,
      minWidth: 70,
      cellRenderer: (params) => params.value ?? '-'
    },
    {
      field: 'total_salah',
      headerName: 'Salah',
      sortable: true,
      filter: true,
      width: 80,
      minWidth: 70,
      cellRenderer: (params) => params.value ?? '-'
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
              onMulai={() => handleMulai(params.data)}
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
        fetchData(newPage, newPageSize, searchText)
      }
    }
  }, [currentPage, pageSize, searchText, fetchData])

  const handleRefresh = useCallback(() => {
    fetchData(currentPage, pageSize, searchText)
  }, [currentPage, pageSize, searchText, fetchData])

  // Prepare options with "Semua" as default
  const ujianOptions = [
    { value: '', label: 'Semua Ujian' },
    ...ujianList
  ]

  const siswaOptions = [
    { value: '', label: 'Semua Siswa' },
    ...siswaList
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Ujian User</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari ujian user..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <div className="w-full sm:w-48">
            <SearchableSelect
              name="ujian"
              value={selectedUjian}
              onChange={handleUjianChange}
              options={ujianOptions}
              placeholder="Pilih Ujian"
            />
          </div>
          <div className="w-full sm:w-48">
            <SearchableSelect
              name="siswa"
              value={selectedSiswa}
              onChange={handleSiswaChange}
              options={siswaOptions}
              placeholder="Pilih Siswa"
            />
          </div>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <Button onClick={() => navigate('/akademik/ujian-user/create')}>
            <Plus size={18} className="mr-2" />
            Tambah
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
            <p className="text-lg font-medium">Tidak ada data ujian user</p>
            <p className="text-sm">Silakan tambah data baru atau ubah filter pencarian</p>
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
              theme="legacy"
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default UjianUserList