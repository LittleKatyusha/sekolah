import { useState, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Edit, Eye, Trash2 } from 'lucide-react'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Button from '../../../components/ui/Button'
import { rolePermissionService } from '../services/rolesService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const ActionsCellRenderer = ({ data, onEdit, onDetail, onDelete }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onDetail(data)}
        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
        title="View Details"
      >
        <Eye size={16} />
      </button>
      <button
        onClick={() => onEdit(data)}
        className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
        title="Edit"
      >
        <Edit size={16} />
      </button>
      <button
        onClick={() => onDelete(data)}
        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        title="Delete"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

const RolePermissionsList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [searchText, setSearchText] = useState('')

  const staticParams = useMemo(() => ({
    search: searchText || undefined,
  }), [searchText])

  const handleEdit = useCallback((data) => navigate(`/admin/role-permissions/${data.id}/edit`), [navigate])
  const handleDetail = useCallback((data) => navigate(`/admin/role-permissions/${data.id}`), [navigate])

  const handleDelete = useCallback(async (data) => {
    const label = `Role "${data.name || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await rolePermissionService.delete(data.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        if (gridRef.current?.refreshData) {
          gridRef.current.refreshData()
        }
      } else {
        showError('Gagal menghapus role permission')
      }
    }
  }, [])

  const handleSearch = useCallback(() => {
    if (gridRef.current?.refreshData) {
      gridRef.current.refreshData()
    }
  }, [])

  const columnDefs = useMemo(() => [
    { field: 'id', headerName: 'ID', sortable: true, filter: true, width: 80, minWidth: 70 },
    { field: 'name', headerName: 'Nama Role', sortable: true, filter: true, flex: 2, minWidth: 200, cellRenderer: (params) => params.value || '-' },
    { field: 'guard_name', headerName: 'Guard', sortable: true, filter: true, flex: 1, minWidth: 120, cellRenderer: (params) => params.value || '-' },
    {
      headerName: 'Permissions',
      sortable: false,
      filter: false,
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const permissions = params.data?.permissions
        return Array.isArray(permissions) ? permissions.length : 0
      },
      cellRenderer: (params) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          {params.value} permissions
        </span>
      ),
    },
    {
      headerName: 'Actions',
      sortable: false,
      filter: false,
      width: 120,
      minWidth: 120,
      cellRenderer: (params) => (
        <ActionsCellRenderer
          data={params.data}
          onEdit={handleEdit}
          onDetail={handleDetail}
          onDelete={handleDelete}
        />
      ),
    },
  ], [handleEdit, handleDetail, handleDelete])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role Permissions</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <input
              type="text"
              placeholder="Cari role..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
          <Button onClick={() => navigate('/admin/role-permissions/create')}>
            <Plus size={18} className="mr-2" />
            Assign Permissions
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <InfiniteGrid
          key={`role-permissions-grid-${searchText}`}
          ref={gridRef}
          endpoint="/admin/role-permissions/"
          staticParams={staticParams}
          columnDefs={columnDefs}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
          }}
        />
      </div>
    </div>
  )
}

export default RolePermissionsList