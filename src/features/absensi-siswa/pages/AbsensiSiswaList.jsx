import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, Plus, RefreshCw, Edit, Trash2, MoreVertical, Calendar, Eye } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { absensiSiswaService } from '../services/absensiSiswaService'
import { siswaService } from '../../siswa/services/siswaService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

// Actions Menu Component
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

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    hadir: {
      label: 'Hadir',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    },
    tidak_hadir: {
      label: 'Tidak Hadir',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    },
    izin: {
      label: 'Izin',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    },
    sakit: {
      label: 'Sakit',
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    }
  }

  const config = statusConfig[status] || {
    label: status || '-',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

const AbsensiSiswaList = () => {
  const navigate = useNavigate()
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filters, setFilters] = useState({
    tanggal_mulai: '',
    tanggal_akhir: ''
  })
  const [showFilter, setShowFilter] = useState(false)
  
  const [siswaOptions, setSiswaOptions] = useState([])
  const [selectedSiswaId, setSelectedSiswaId] = useState('')
  const [summaryData, setSummaryData] = useState(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalRows, setTotalRows] = useState(0)

  const fetchSiswaOptions = async () => {
    const { data } = await siswaService.getAll({ per_page: 1000 })
    if (data?.data) {
      const options = data.data.map(s => ({
        value: s.id,
        label: `${s.nis} - ${s.nama}`
      }))
      setSiswaOptions(options)
    }
  }

  useEffect(() => {
    fetchSiswaOptions()
  }, [])

  const fetchAbsensi = useCallback(async (page = currentPage, size = pageSize) => {
    setLoading(true)
    const params = {
      page: page,
      per_page: size
    }
    
    if (filters.tanggal_mulai) {
      params.tanggal_mulai = filters.tanggal_mulai
    }
    if (filters.tanggal_akhir) {
      params.tanggal_akhir = filters.tanggal_akhir
    }
    if (searchText) {
      params.search = searchText
    }

    try {
      if (selectedSiswaId) {
        const { data, error } = await absensiSiswaService.getAbsensiBySiswa(selectedSiswaId, params)
        if (data) {
          setRowData(data.data || [])
          setTotalRows(data.meta?.total || data.data?.length || 0)
        } else {
          console.error('Error fetching absensi by siswa:', error)
          showError('Gagal mengambil data absensi siswa')
        }

        const { data: summaryRes } = await absensiSiswaService.getSummaryBySiswa(selectedSiswaId)
        if (summaryRes) {
          setSummaryData(summaryRes.data)
        }
      } else {
        const { data, error } = await absensiSiswaService.getAbsensiSiswa(params)
        if (data) {
          setRowData(data.data || [])
          setTotalRows(data.meta?.total || data.data?.length || 0)
        } else {
          console.error('Error fetching absensi:', error)
          showError('Gagal mengambil data absensi siswa')
        }
        setSummaryData(null)
      }
    } catch (err) {
      console.error(err)
      showError('Terjadi kesalahan')
    }
    
    setLoading(false)
  }, [filters, selectedSiswaId, searchText, currentPage, pageSize])

  useEffect(() => {
    fetchAbsensi()
  }, [fetchAbsensi])

  const handleSiswaChange = (e) => {
    setSelectedSiswaId(e.target.value)
    setCurrentPage(1) // Reset to first page when filter changes
  }

  const handleDetail = (data) => {
    navigate(`/absensi-siswa/${data.id}`)
  }

  const handleEdit = (data) => {
    navigate(`/absensi-siswa/edit/${data.id}`)
  }

  const handleDelete = async (data) => {
    const result = await showDeleteConfirm(data.siswa?.nama || 'absensi ini')
    if (result.isConfirmed) {
      const { error } = await absensiSiswaService.deleteAbsensiSiswa(data.id)
      if (!error) {
        showSuccess('Absensi berhasil dihapus!')
        fetchAbsensi()
      } else {
        showError('Gagal menghapus absensi')
      }
    }
  }

  const handleAdd = () => {
    navigate('/absensi-siswa/tambah')
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const applyFilters = () => {
    setCurrentPage(1) // Reset to first page when applying filters
    fetchAbsensi(1, pageSize)
  }

  const clearFilters = () => {
    setFilters({
      tanggal_mulai: '',
      tanggal_akhir: ''
    })
    setCurrentPage(1) // Reset to first page when clearing filters
    fetchAbsensi(1, pageSize)
  }

  const handleRefresh = () => {
    fetchAbsensi(currentPage, pageSize)
  }

  const onPaginationChanged = useCallback((params) => {
    const newPage = params.api.paginationGetCurrentPage() + 1
    const newPageSize = params.api.paginationGetPageSize()
    
    if (newPage !== currentPage || newPageSize !== pageSize) {
      setCurrentPage(newPage)
      setPageSize(newPageSize)
      fetchAbsensi(newPage, newPageSize)
    }
  }, [currentPage, pageSize, fetchAbsensi])

  const onFilterTextBoxChanged = useCallback((e) => {
    const value = e.target.value
    setSearchText(value)
    setCurrentPage(1) // Reset to first page when searching
    // Debounce the search by using a timeout
    const timeoutId = setTimeout(() => {
      fetchAbsensi(1, pageSize)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [pageSize, fetchAbsensi])

  const columnDefs = useMemo(() => [
    {
      field: 'siswa.nama',
      headerName: 'Nama Siswa',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => params.data.siswa?.nama || '-',
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'siswa.nis',
      headerName: 'NIS',
      sortable: true,
      filter: true,
      width: 160,
      minWidth: 130,
      valueGetter: (params) => params.data.siswa?.nis || '-',
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'tanggal',
      headerName: 'Tanggal',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => {
        if (!params.value) return '-'
        const date = new Date(params.value)
        return date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      }
    },
    {
      field: 'status_absensi',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 130,
      minWidth: 110,
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Absensi Siswa</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-64">
            <SearchableSelect
              name="siswa_id"
              value={selectedSiswaId}
              onChange={handleSiswaChange}
              options={siswaOptions}
              placeholder="Pilih Siswa..."
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari absensi..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button 
            onClick={() => setShowFilter(!showFilter)} 
            variant={showFilter ? 'primary' : 'secondary'}
            title="Filter Tanggal"
          >
            <Calendar size={18} />
          </Button>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <Button onClick={handleAdd}>
            <Plus size={18} className="mr-2" />
            Tambah Absensi
          </Button>
        </div>
      </div>

      {/* Summary Section */}
      {selectedSiswaId && summaryData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="text-center">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-400">Hadir</h3>
              <p className="text-2xl font-bold text-green-900 dark:text-green-300">{summaryData.hadir || 0}</p>
            </div>
          </Card>
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="text-center">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Izin</h3>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{summaryData.izin || 0}</p>
            </div>
          </Card>
          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <div className="text-center">
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-400">Sakit</h3>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">{summaryData.sakit || 0}</p>
            </div>
          </Card>
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="text-center">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Alpha</h3>
              <p className="text-2xl font-bold text-red-900 dark:text-red-300">{summaryData.alpha || 0}</p>
            </div>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400">Total</h3>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{summaryData.total || 0}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Filter Section */}
      {showFilter && (
        <Card className="bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-full sm:w-auto">
              <Input
                label="Tanggal Mulai"
                type="date"
                name="tanggal_mulai"
                value={filters.tanggal_mulai}
                onChange={handleFilterChange}
                className="bg-white dark:bg-gray-800"
              />
            </div>
            <div className="w-full sm:w-auto">
              <Input
                label="Tanggal Akhir"
                type="date"
                name="tanggal_akhir"
                value={filters.tanggal_akhir}
                onChange={handleFilterChange}
                className="bg-white dark:bg-gray-800"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={applyFilters}>
                Terapkan
              </Button>
              <Button variant="secondary" onClick={clearFilters}>
                Reset
              </Button>
            </div>
          </div>
        </Card>
      )}

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
              paginationNumberFormatter={(params) => `${params.value.toLocaleString()}`}
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

export default AbsensiSiswaList