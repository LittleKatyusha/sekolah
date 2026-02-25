import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, Plus, RefreshCw, Edit, Trash2, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { menuService } from '../services/menuService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

// Actions Menu Component
const ActionsMenu = ({ data, onEdit, onDelete }) => {
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

const MenuList = () => {
  const navigate = useNavigate()
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')

  const fetchMenus = async () => {
    setLoading(true)
    const { data, error } = await menuService.getAll()
    if (data) {
      setRowData(data.data || [])
    } else {
      console.error('Error fetching menus:', error)
      showError('Gagal mengambil data menu')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMenus()
  }, [])

  const handleEdit = (data) => {
    navigate(`/admin/menus/${data.id}/edit`)
  }

  const handleDelete = async (data) => {
    const result = await showDeleteConfirm(data.nama_menu)
    if (result.isConfirmed) {
      const { error } = await menuService.delete(data.id)
      if (!error) {
        showSuccess(`${data.nama_menu} berhasil dihapus!`)
        fetchMenus()
      } else {
        showError('Gagal menghapus menu')
      }
    }
  }

  const columnDefs = useMemo(() => [
    {
      field: 'nama_menu',
      headerName: 'Nama Menu',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 150
    },
    {
      field: 'url',
      headerName: 'URL',
      sortable: true,
      filter: true,
      width: 150,
      minWidth: 120
    },
    {
      field: 'icon',
      headerName: 'Icon',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => {
        return (
          <div className="flex items-center gap-2">
            {params.value && <i className={`bi ${params.value}`}></i>}
            <span>{params.value || '-'}</span>
          </div>
        )
      }
    },
    {
      field: 'urutan',
      headerName: 'Urutan',
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 100,
      minWidth: 90
    },
    {
      field: 'is_active',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => {
        const isActive = params.value;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isActive 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {isActive ? 'Aktif' : 'Tidak Aktif'}
          </span>
        )
      }
    },
    {
      field: 'parent',
      headerName: 'Parent',
      sortable: true,
      filter: true,
      width: 150,
      minWidth: 120,
      valueGetter: (params) => params.data?.parent?.nama_menu || '-',
    },
    {
      field: 'permission',
      headerName: 'Permission',
      sortable: true,
      filter: true,
      width: 150,
      minWidth: 120,
      valueGetter: (params) => params.data?.permission?.name || '-',
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Menu</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari menu..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={fetchMenus} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <Button onClick={() => navigate('/admin/menus/create')}>
            <Plus size={18} className="mr-2" />
            Tambah Menu
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

export default MenuList