
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Search, Plus, RefreshCw, Eye, Edit, Trash2, MoreVertical, ToggleRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { usersService } from '../services/usersService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

// Role options based on API response
const ROLE_OPTIONS = [
  { value: 1, label: 'Administrator', code: 'admin' },
  { value: 2, label: 'Guru', code: 'guru' },
  { value: 3, label: 'Staff', code: 'staff' },
]

// Get role label from role ID or role object
const getRoleLabel = (roleValue, roles = []) => {
  if (roles && roles.length > 0) {
    return roles[0].name || 'Unknown'
  }
  const role = ROLE_OPTIONS.find(r => r.value === roleValue)
  return role ? role.label : 'Unknown'
}

// Get role badge color
const getRoleBadgeColor = (roleValue, roles = []) => {
  const roleCode = roles && roles.length > 0 ? roles[0].code : null
  if (roleCode === 'admin' || roleValue === 1) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  }
  if (roleCode === 'guru' || roleValue === 2) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}

// Actions Menu Component
const ActionsMenu = ({ data, onDetail, onEdit, onDelete, onToggleStatus }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

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
              onClick={() => { setIsOpen(false); onDetail(); }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Eye size={16} className="text-blue-600" />
              Detail
            </button>
            <button
              onClick={() => { setIsOpen(false); onEdit(); }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Edit size={16} className="text-yellow-600" />
              Edit
            </button>
            <button
              onClick={() => { setIsOpen(false); onToggleStatus(); }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              {data?.is_active ? (
                <>
                  <ToggleRight size={16} className="text-orange-600" />
                  Nonaktifkan
                </>
              ) : (
                <>
                  <ToggleRight size={16} className="text-green-600" />
                  Aktifkan
                </>
              )}
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={() => { setIsOpen(false); onDelete(); }}
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

const UsersList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [searchText, setSearchText] = useState('')

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    search: searchText || '',
    filter: '{}',
  }), [searchText])

  const handleEdit = useCallback((data) => {
    if (!data?.id) return
    navigate(`/admin/users/${data.id}/edit`)
  }, [navigate])

  const handleDetail = useCallback((data) => {
    if (!data?.id) return
    navigate(`/admin/users/${data.id}`)
  }, [navigate])

  const handleDelete = useCallback(async (data) => {
    if (!data?.id) {
      showError('Data user tidak valid')
      return
    }

    const result = await showDeleteConfirm(data.name || 'user ini')
    if (result.isConfirmed) {
      const { error } = await usersService.delete(data.id)
      if (!error) {
        showSuccess(`${data.name || 'User'} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus user')
      }
    }
  }, [])

  const handleToggleStatus = useCallback(async (data) => {
    if (!data?.id) {
      showError('Data user tidak valid')
      return
    }

    const newStatus = !data.is_active
    const { error } = await usersService.toggleStatus(data.id, newStatus)
    if (!error) {
      showSuccess(`User ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}!`)
      if (gridRef.current?.refreshGrid) {
        gridRef.current.refreshGrid()
      }
    } else {
      showError('Gagal mengubah status user')
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

  const columnDefs = useMemo(() => [
    {
      field: 'name',
      backendField: 'name',
      headerName: 'Nama',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 180
    },
    {
      field: 'email',
      backendField: 'email',
      headerName: 'Email',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 200
    },
    {
      field: 'role',
      headerName: 'Role',
      sortable: false,
      filter: false,
      width: 150,
      minWidth: 120,
      cellRenderer: (params) => {
        const roles = params.data?.roles || []
        const roleLabel = getRoleLabel(params.value, roles)
        const badgeColor = getRoleBadgeColor(params.value, roles)
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
            {roleLabel}
          </span>
        )
      }
    },
    {
      field: 'is_active',
      backendField: 'is_active',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => {
        return params.value ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Aktif
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Nonaktif
          </span>
        )
      }
    },
    {
      field: 'created_at',
      backendField: 'created_at',
      headerName: 'Dibuat',
      sortable: true,
      filter: true,
      width: 180,
      minWidth: 150,
      valueFormatter: (params) => {
        if (!params.value) return '-'
        const date = new Date(params.value)
        return date.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
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
        const row = params.data
        if (!row) return null

        return (
          <div className="h-full flex items-center justify-center">
            <ActionsMenu
              data={row}
              onDetail={() => handleDetail(row)}
              onEdit={() => handleEdit(row)}
              onDelete={() => handleDelete(row)}
              onToggleStatus={() => handleToggleStatus(row)}
            />
          </div>
        )
      }
    }
  ], [handleDetail, handleEdit, handleDelete, handleToggleStatus])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Users</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari users..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <Button onClick={() => navigate('/admin/users/create')}>
            <Plus size={18} className="mr-2" />
            Tambah User
          </Button>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/admin/users/"
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

export default UsersList