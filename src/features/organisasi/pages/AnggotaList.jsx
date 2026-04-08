import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'
import { anggotaService } from '../services/organisasiService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const getLabel = (value, options) => {
  if (!value) return '-'
  const opt = options.find(o => o.value === String(value))
  return opt ? opt.label : value
}

const getStatusColorClass = (value) => {
  const lower = String(value ?? '').toLowerCase()
  if (lower === 'aktif') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}


const AnggotaList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const { options: statusOptions } = useReferenceOptions('status_organisasi')

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    filter: '{}',
  }), [])

  const handleEdit = useCallback((data) => navigate(`/organisasi/anggota/${data.id}/edit`), [navigate])
  const handleDetail = useCallback((data) => navigate(`/organisasi/anggota/${data.id}`), [navigate])

  const handleDelete = useCallback(async (data) => {
    const label = `Anggota #${data.id}`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await anggotaService.delete(data.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus anggota')
      }
    }
  }, [])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
    // Also try to purge cache and reload if available
    if (gridRef.current?.api) {
      gridRef.current.api.refreshInfiniteCache()
    }
  }, [])

  const columnDefs = useMemo(() => [
    { field: 'id', headerName: 'ID', sortable: true, filter: true, width: 80, minWidth: 70 },
    {
      field: 'siswa',
      backendField: 'siswa.nama',
      headerName: 'Siswa',
      sortable: true,
      filter: true,
      flex: 1.5,
      minWidth: 160,
      valueGetter: (params) => params.data?.siswa?.nama || '-'
    },
    {
      field: 'organisasi',
      backendField: 'organisasi.nama',
      headerName: 'Organisasi',
      sortable: true,
      filter: true,
      flex: 1.5,
      minWidth: 160,
      valueGetter: (params) => params.data?.organisasi?.nama || '-'
    },
    {
      field: 'jabatan',
      backendField: 'jabatan.nama',
      headerName: 'Jabatan',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 130,
      valueGetter: (params) => params.data?.jabatan?.nama || '-'
    },
    {
      field: 'tanggal_mulai',
      headerName: 'Tanggal Mulai',
      sortable: true,
      filter: true,
      width: 150,
      minWidth: 130,
      cellRenderer: (params) => {
        if (!params.value) return '-'
        const date = new Date(params.value)
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => {
        const status = params.value
        if (!status) return '-'
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColorClass(status)}`}>
            {getLabel(status, statusOptions)}
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
      cellRenderer: (params) => (
        <div className="h-full flex items-center justify-center">
          <ActionsMenu
            onDetail={() => handleDetail(params.data)}
            onEdit={() => handleEdit(params.data)}
            onDelete={() => handleDelete(params.data)}
            detailPermission="anggota.view"
            editPermission="anggota.edit"
            deletePermission="anggota.delete"
          />
        </div>
      )
    }
  ], [handleDelete, handleDetail, handleEdit])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Anggota Organisasi</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="anggota.create">
            <Button onClick={() => navigate('/organisasi/anggota/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Anggota
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/organisasi/anggota/"
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

export default AnggotaList