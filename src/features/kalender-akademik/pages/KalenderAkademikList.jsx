import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { kalenderAkademikService } from '../services/kalenderAkademikService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

// Status mapping for display
const STATUS_MAP = {
  0: { label: 'Cancelled', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  1: { label: 'Active', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  2: { label: 'Completed', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
}

const KalenderAkademikList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    filter: '{}',
  }), [])

  const handleEdit = useCallback((data) => {
    navigate(`/admin/kalender-akademik/${data.id}/edit`)
  }, [navigate])

  const handleDelete = useCallback(async (data) => {
    const label = `Kalender "${data.judul || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await kalenderAkademikService.delete(data.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus kalender akademik')
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

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const columnDefs = useMemo(() => [
    {
      field: 'id',
      headerName: 'ID',
      sortable: true,
      filter: true,
      width: 80,
      minWidth: 70
    },
    {
      field: 'judul',
      headerName: 'Judul',
      sortable: true,
      filter: true,
      flex: 2,
      minWidth: 200,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'tipe',
      backendField: 'tipe.nama',
      headerName: 'Tipe',
      sortable: true,
      filter: true,
      width: 140,
      minWidth: 120,
      valueGetter: (params) => params.data?.tipe?.nama || '-',
      cellRenderer: (params) => {
        const tipe = params.data?.tipe
        if (!tipe) return '-'
        const warna = tipe.warna || '#6b7280'
        return (
          <span
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${warna}20`, color: warna }}
          >
            {tipe.nama}
          </span>
        )
      }
    },
    {
      field: 'tanggal_mulai',
      headerName: 'Tanggal Mulai',
      sortable: true,
      filter: true,
      width: 140,
      minWidth: 120,
      cellRenderer: (params) => formatDate(params.value)
    },
    {
      field: 'tanggal_selesai',
      headerName: 'Tanggal Selesai',
      sortable: true,
      filter: true,
      width: 140,
      minWidth: 120,
      cellRenderer: (params) => formatDate(params.value)
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
        if (status === null || status === undefined) return '-'
        const statusInfo = STATUS_MAP[status] || { label: status, bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg}`}>
            {statusInfo.label}
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
                onDetail={() => navigate(`/admin/kalender-akademik/${params.data.id}`)}
                onEdit={() => handleEdit(params.data)}
                onDelete={() => handleDelete(params.data)}
                detailPermission="kalender-akademik.view"
                editPermission="kalender-akademik.manage"
                deletePermission="kalender-akademik.manage"
              />
            </div>
          )
        }
    }
  ], [handleEdit, handleDelete])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kalender Akademik</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="kalender-akademik.manage">
            <Button onClick={() => navigate('/admin/kalender-akademik/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Event
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/admin/kalender-akademik/"
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

export default KalenderAkademikList
