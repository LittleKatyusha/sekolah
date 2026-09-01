import { useState, useMemo, useCallback, useRef } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import { roleService } from '../services/rolesService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const RolesList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    filter: '{}',
  }), [])

  const handleEdit = useCallback((data) => navigate(`/admin/roles/${data.id}/edit`), [navigate])
  const handleDetail = useCallback((data) => navigate(`/admin/roles/${data.id}`), [navigate])

  const handleDelete = useCallback(async (data) => {
    const label = `Role "${data.name || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await roleService.delete(data.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus role')
      }
    }
  }, [])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
    if (gridRef.current?.api) {
      gridRef.current.api.refreshInfiniteCache()
    }
  }, [])

  const columnDefs = useMemo(() => [
    { field: 'id', headerName: 'ID', sortable: true, filter: true, width: 80, minWidth: 70 },
    { field: 'name', headerName: 'Nama Role', sortable: true, filter: true, flex: 2, minWidth: 180, cellRenderer: (params) => params.value || '-' },
    { field: 'code', headerName: 'Code', sortable: true, filter: true, flex: 1, minWidth: 130, cellRenderer: (params) => params.value ? <span className="font-mono text-xs">{params.value}</span> : '-' },
    {
      headerName: 'Permissions',
      sortable: false,
      filter: false,
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => {
        const permissions = params.data?.permissions
        return Array.isArray(permissions) ? permissions.length : 0
      },
      cellRenderer: (params) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          {params.value} permissions
        </span>
      )
    },
    {
      headerName: 'Aksi',
      width: 80, minWidth: 80, maxWidth: 80,
      suppressSizeToFit: true, sortable: false, filter: false,
      cellRenderer: (params) => (
        <div className="h-full flex items-center justify-center">
          <ActionsMenu
            data={params.data}
            onDetail={() => handleDetail(params.data)}
            onEdit={() => handleEdit(params.data)}
            onDelete={() => handleDelete(params.data)}
            detailPermission="roles.view"
            editPermission="roles.update"
            deletePermission="roles.delete"
          />
        </div>
      )
    }
  ], [handleDelete, handleDetail, handleEdit])

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true, filter: true }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="roles.create">
            <Button onClick={() => navigate('/admin/roles/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Role
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/admin/roles/"
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

export default RolesList
