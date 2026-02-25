import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, Plus, RefreshCw, Eye, Edit, Trash2, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { bkKasusService } from '../services/bkService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

// Status color classes (explicit for Tailwind purge)
const statusColorClasses = {
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  gray: 'bg-gray-100 text-gray-700',
}

const getStatusInfo = (status) => {
  const statusMap = {
    'dibuka': { label: 'Dibuka', color: 'blue' },
    'dalam_proses': { label: 'Dalam Proses', color: 'yellow' },
    'selesai': { label: 'Selesai', color: 'green' },
    'ditutup': { label: 'Ditutup', color: 'gray' },
    1: { label: 'Dibuka', color: 'blue' },
    2: { label: 'Dalam Proses', color: 'yellow' },
    3: { label: 'Selesai', color: 'green' },
    4: { label: 'Ditutup', color: 'gray' },
  }
  return statusMap[status] || { label: status || '-', color: 'gray' }
}

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

const BkKasusList = () => {
  const navigate = useNavigate()
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')

  const fetchData = async () => {
    setLoading(true)
    const { data, error } = await bkKasusService.getAll()
    if (data) {
      setRowData(data.data || [])
    } else {
      console.error('Error fetching kasus BK:', error)
      showError('Gagal mengambil data kasus BK')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleEdit = (data) => {
    navigate(`/bk/kasus/${data.id}/edit`)
  }

  const handleDetail = (data) => {
    navigate(`/bk/kasus/${data.id}`)
  }

  const handleDelete = async (data) => {
    const result = await showDeleteConfirm('kasus ini')
    if (result.isConfirmed) {
      const { error } = await bkKasusService.delete(data.id)
      if (!error) {
        showSuccess('Kasus BK berhasil dihapus!')
        fetchData()
      } else {
        showError('Gagal menghapus kasus BK')
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const columnDefs = useMemo(() => [
    {
      field: 'id',
      headerName: 'No',
      width: 70,
      valueGetter: (params) => params.node.rowIndex + 1,
      sortable: false,
      filter: false
    },
    {
      headerName: 'Siswa',
      flex: 2,
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        const data = params.data
        return data?.siswa?.nama || data?.siswa_id || '-'
      }
    },
    {
      headerName: 'Guru BK',
      flex: 2,
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        const data = params.data
        return data?.guru?.nama || data?.guru_id || '-'
      }
    },
    {
      headerName: 'Jenis',
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        const data = params.data
        return data?.jenis?.nama || data?.jenis_id || '-'
      }
    },
    {
      field: 'tanggal',
      headerName: 'Tanggal',
      flex: 1,
      sortable: true,
      filter: true,
      cellRenderer: (params) => formatDate(params.value)
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        const s = getStatusInfo(params.value)
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColorClasses[s.color]}`}>
            {s.label}
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

  const onFilterTextBoxChanged = useCallback((e) => {
    setSearchText(e.target.value)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Kasus BK</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari kasus BK..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={fetchData} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <Button onClick={() => navigate('/bk/kasus/create')}>
            <Plus size={18} className="mr-2" />
            Tambah Kasus
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
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              quickFilterText={searchText}
              animateRows={true}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default BkKasusList