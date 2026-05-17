import { useMemo, useCallback, useRef } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { waliService } from '../services/waliService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { usePageTitle } from '../../../hooks/usePageTitle'

const WaliList = () => {
  usePageTitle('Data Wali')
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    filter: '{}',
  }), [])

  const handleEdit = useCallback((data) => {
    navigate(`/wali/${data.id}/edit`)
  }, [navigate])

  const handleDetail = useCallback((data) => {
    navigate(`/wali/${data.id}`)
  }, [navigate])

  const handleDelete = useCallback(async (data) => {
    const result = await showDeleteConfirm(data.nama)
    if (result.isConfirmed) {
      const { error } = await waliService.deleteWali(data.id)
      if (!error) {
        showSuccess(`Wali ${data.nama} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus wali')
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
    {
      field: 'nama',
      headerName: 'Nama',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 180
    },
    {
      field: 'nik',
      headerName: 'NIK',
      sortable: true,
      filter: true,
      width: 180,
      minWidth: 160,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'jenis_kelamin',
      headerName: 'Jenis Kelamin',
      sortable: true,
      filter: true,
      width: 150,
      minWidth: 140,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'no_hp',
      headerName: 'No. HP',
      sortable: true,
      filter: true,
      width: 140,
      minWidth: 120,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'alamat',
      headerName: 'Alamat',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 250,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'pendidikan_terakhir',
      headerName: 'Pendidikan Terakhir',
      sortable: true,
      filter: true,
      width: 180,
      minWidth: 170,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'pekerjaan',
      headerName: 'Pekerjaan',
      sortable: true,
      filter: true,
      width: 160,
      minWidth: 140,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'penghasilan',
      headerName: 'Penghasilan',
      sortable: true,
      filter: true,
      width: 160,
      minWidth: 140,
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
              detailPermission="wali.view"
              editPermission="wali.edit"
              deletePermission="wali.delete"
            />
          </div>
        )
      }
    }
  ], [handleDetail, handleEdit, handleDelete])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Wali</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="wali.create">
            <Button onClick={() => navigate('/wali/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Wali
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/wali/"
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

export default WaliList