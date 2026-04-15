import { useState, useMemo, useCallback, useRef } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { jabatanService } from '../services/organisasiService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const JabatanList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)

  const staticParams = useMemo(() => ({
    sort_by: 'urutan',
    sort_dir: 'asc',
    filter: '{}',
  }), [])

  const handleEdit = useCallback((data) => navigate(`/organisasi/jabatan/${data.id}/edit`), [navigate])
  const handleDetail = useCallback((data) => navigate(`/organisasi/jabatan/${data.id}`), [navigate])

  const handleDelete = useCallback(async (data) => {
    const label = `Jabatan "${data.nama || data.id}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await jabatanService.delete(data.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus jabatan')
      }
    }
  }, [])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
  }, [])

  const columnDefs = useMemo(() => [
    { field: 'id', headerName: 'ID', sortable: true, filter: true, width: 80, minWidth: 70 },
    {
      field: 'urutan',
      headerName: 'Urutan',
      sortable: true,
      filter: true,
      width: 100,
      minWidth: 80,
    },
    {
      field: 'nama',
      headerName: 'Nama Jabatan',
      sortable: true,
      filter: true,
      flex: 1.5,
      minWidth: 160,
    },
    {
      field: 'deskripsi',
      headerName: 'Deskripsi',
      sortable: false,
      filter: false,
      flex: 2,
      minWidth: 200,
      valueGetter: (params) => params.data?.deskripsi || '-',
    },
    {
      headerName: 'Aksi',
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      suppressSizeToFit: true,
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
        <div className="h-full flex items-center justify-center">
          <ActionsMenu
            onDetail={() => handleDetail(params.data)}
            onEdit={() => handleEdit(params.data)}
            onDelete={() => handleDelete(params.data)}
            detailPermission="organisasi.jabatan.view"
            editPermission="organisasi.jabatan.manage"
            deletePermission="organisasi.jabatan.manage"
          />
        </div>
      ),
    },
  ], [handleDelete, handleDetail, handleEdit])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jabatan Organisasi</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="organisasi.jabatan.manage">
            <Button onClick={() => navigate('/organisasi/jabatan/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Jabatan
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/organisasi/jabatan/"
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

export default JabatanList
