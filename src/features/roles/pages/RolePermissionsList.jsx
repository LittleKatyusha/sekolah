import { useState, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import { rolePermissionService } from '../services/rolesService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const RolePermissionsList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)

  const staticParams = useMemo(() => ({}), [])

  const handleEdit = useCallback((data) => navigate(`/admin/role-permissions/${data.id}/edit`), [navigate])
  const handleDetail = useCallback((data) => navigate(`/admin/role-permissions/${data.id}`), [navigate])

  const handleDelete = useCallback(async (data) => {
    const roleName = data.role?.name || data.name || ''
    const permissionName = data.permission?.name || ''
    const label = `Role Permission "${roleName} - ${permissionName}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await rolePermissionService.delete(data.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus role permission')
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
    { field: 'role.name', backendField: 'role.name', headerName: 'Nama Role', sortable: true, filter: true, flex: 2, minWidth: 200, cellRenderer: (params) => params.value || '-' },
    { field: 'role.code', backendField: 'role.code', headerName: 'Kode Role', sortable: true, filter: true, flex: 1, minWidth: 120, cellRenderer: (params) => params.value || '-' },
    { field: 'permission.name', backendField: 'permission.name', headerName: 'Nama Permission', sortable: true, filter: true, flex: 2, minWidth: 200, cellRenderer: (params) => params.value || '-' },
    { field: 'permission.code', backendField: 'permission.code', headerName: 'Kode Permission', sortable: true, filter: true, flex: 1, minWidth: 150, cellRenderer: (params) => params.value || '-' },
    { field: 'permission.module', backendField: 'permission.module', headerName: 'Modul', sortable: true, filter: true, flex: 1, minWidth: 120, cellRenderer: (params) => params.value || '-' },
    {
      headerName: 'Aksi',
      sortable: false,
      filter: false,
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      suppressSizeToFit: true,
      cellRenderer: (params) => (
        <div className="h-full flex items-center justify-center">
          <ActionsMenu
            onDetail={() => handleDetail(params.data)}
            onEdit={() => handleEdit(params.data)}
            onDelete={() => handleDelete(params.data)}
            detailPermission="role_permissions.view"
            editPermission="role_permissions.update"
            deletePermission="role_permissions.delete"
          />
        </div>
      ),
    },
  ], [handleEdit, handleDetail, handleDelete])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role Permissions</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="role_permissions.create">
            <Button onClick={() => navigate('/admin/role-permissions/create')}>
              <Plus size={18} className="mr-2" />
              Assign Permissions
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/admin/role-permissions/"
          requestMode="ag-grid"
          staticParams={staticParams}
          columnDefs={columnDefs}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true,
          }}
          cacheBlockSize={20}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          height={600}
        />
      </Card>
    </div>
  )
}

export default RolePermissionsList
