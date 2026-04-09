import { useState, useMemo, useCallback, useRef, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { absensiGuruService } from '../services/absensiGuruService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const formatDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatTime = (value) => {
  if (!value) return '-'
  return String(value).slice(0, 5)
}

ActionsMenu.displayName = 'ActionsMenu'

const StatusBadge = memo(({ status }) => {
  const statusConfig = {
    1: { label: 'Hadir', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    2: { label: 'Sakit', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    3: { label: 'Izin', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    4: { label: 'Alpha', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    hadir: { label: 'Hadir', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
    sakit: { label: 'Sakit', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
    izin: { label: 'Izin', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
    alpha: { label: 'Alpha', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
    alpa: { label: 'Alpha', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  }
  const normalizedStatus = typeof status === 'string' ? status.trim().toLowerCase() : status
  const config = statusConfig[normalizedStatus] || { label: status || '-', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400' }
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>{config.label}</span>
})

StatusBadge.displayName = 'StatusBadge'

const AbsensiGuruList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    filter: '{}',
  }), [])

  const handleDetail = useCallback((data) => {
    if (!data?.id) return
    navigate(`/absensi-guru/${data.id}`)
  }, [navigate])

  const handleEdit = useCallback((data) => {
    if (!data?.id) return
    navigate(`/absensi-guru/edit/${data.id}`)
  }, [navigate])

  const handleDelete = useCallback(async (data) => {
    if (!data?.id) {
      showError('Data absensi guru tidak valid')
      return
    }

    const result = await showDeleteConfirm(data.guru?.nama || 'absensi ini')
    if (result.isConfirmed) {
      const { error } = await absensiGuruService.deleteById(data.id)
      if (!error) {
        showSuccess('Absensi guru berhasil dihapus!')
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus absensi guru')
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
    {
      field: 'guru.nama',
      backendField: 'guru.nama',
      headerName: 'Nama Guru',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => params.data?.guru?.nama || '-',
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'guru.nip',
      backendField: 'guru.nip',
      headerName: 'NIP',
      sortable: true,
      filter: true,
      width: 160,
      minWidth: 130,
      valueGetter: (params) => params.data?.guru?.nip || '-',
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'tanggal',
      backendField: 'tanggal',
      headerName: 'Tanggal',
      sortable: true,
      filter: true,
      width: 130,
      minWidth: 110,
      cellRenderer: (params) => formatDate(params.value)
    },
    {
      field: 'status',
      backendField: 'status',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      valueGetter: (params) => params.data?.status_absensi || params.data?.status || '-',
      cellRenderer: (params) => <StatusBadge status={params.value} />
    },
    {
      field: 'jam_masuk',
      backendField: 'jam_masuk',
      headerName: 'Jam Masuk',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 110,
      cellRenderer: (params) => formatTime(params.value)
    },
    {
      field: 'jam_keluar',
      backendField: 'jam_keluar',
      headerName: 'Jam Keluar',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 110,
      cellRenderer: (params) => formatTime(params.value)
    },
    {
      field: 'keterangan',
      backendField: 'keterangan',
      headerName: 'Keterangan',
      sortable: true,
      filter: true,
      width: 200,
      minWidth: 150,
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
        const row = params.data
        if (!row) return null

        return (
          <div className="h-full flex items-center justify-center">
            <ActionsMenu
              onDetail={() => handleDetail(row)}
              onEdit={() => handleEdit(row)}
              onDelete={() => handleDelete(row)}
              detailPermission="absensi-guru.view"
              editPermission="absensi-guru.edit"
              deletePermission="absensi-guru.delete"
            />
          </div>
        )
      }
    }
  ], [handleDelete, handleDetail, handleEdit])

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true, filter: true }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Absensi Guru</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="absensi-guru.view">
            <Button onClick={() => navigate('/absensi-guru/rekap-bulanan')} variant="outline">
              <BarChart2 size={18} className="mr-2" />
              Rekap Bulanan
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="absensi-guru.create">
            <Button onClick={() => navigate('/absensi-guru/tambah')}>
              <Plus size={18} className="mr-2" />
              Tambah Absensi
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/absensi-guru"
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

export default AbsensiGuruList