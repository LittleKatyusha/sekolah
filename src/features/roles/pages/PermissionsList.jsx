import { useState, useMemo, useCallback, useRef } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import { permissionService } from '../services/rolesService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const PermissionsList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    filter: '{}',
  }), [])

  const handleEdit = useCallback((data) => navigate(`/admin/permissions/${data.id}/edit`), [navigate])
  const handleDetail = useCallback((data) => navigate(`/admin/permissions/${data.id}`), [navigate])

  const handleDelete = useCallback(async (data) => {
    const label = `Permission "${data.name || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await permissionService.delete(data.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus permission')
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
    { field: 'code', headerName: 'Code', sortable: true, filter: true, flex: 1, minWidth: 150, cellRenderer: (params) => params.value ? <span className="font-mono text-xs">{params.value}</span> : '-' },
    { field: 'name', headerName: 'Nama Permission', sortable: true, filter: true, flex: 2, minWidth: 200, cellRenderer: (params) => params.value || '-' },
    { field: 'module', headerName: 'Modul', sortable: true, filter: true, flex: 1, minWidth: 120, cellRenderer: (params) => params.value ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 capitalize">{params.value}</span> : '-' },
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
            detailPermission="permissions.view"
            editPermission="permissions.edit"
            deletePermission="permissions.delete"
          />
        </div>
      )
    }
  ], [handleDelete, handleDetail, handleEdit])

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true, filter: true }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Permissions</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="permissions.create">
            <Button onClick={() => navigate('/admin/permissions/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Permission
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/admin/permissions/"
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

export default PermissionsList