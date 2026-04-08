import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { jadwalPelajaranService } from '../services/jadwalPelajaranService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

// Day mapping for display
const HARI_MAP = {
  MON: 'Senin',
  TUE: 'Selasa',
  WED: 'Rabu',
  THU: 'Kamis',
  FRI: 'Jumat',
  SAT: 'Sabtu',
  SUN: 'Minggu'
}

const JadwalPelajaranList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    filter: '{}',
  }), [])

  const handleEdit = useCallback((data) => {
    navigate(`/jadwal-pelajaran/${data.id}/edit`)
  }, [navigate])

  const handleDetail = useCallback((data) => {
    navigate(`/jadwal-pelajaran/${data.id}`)
  }, [navigate])

  const handleDelete = useCallback(async (data) => {
    const label = `Jadwal ${data.kelas?.nama_kelas || ''} - ${HARI_MAP[data.hari] || data.hari}`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await jadwalPelajaranService.delete(data.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus jadwal pelajaran')
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
      field: 'id',
      backendField: 'id',
      headerName: 'ID',
      sortable: true,
      filter: true,
      width: 80,
      minWidth: 70
    },
    {
      field: 'kelas.nama_kelas',
      backendField: 'kelas.nama_kelas',
      headerName: 'Kelas',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 120,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'hari',
      backendField: 'hari',
      headerName: 'Hari',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => {
        const hari = params.value
        if (!hari) return '-'
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            {HARI_MAP[hari] || hari}
          </span>
        )
      }
    },
    {
      field: 'jam_mulai',
      backendField: 'jam_mulai',
      headerName: 'Jam Mulai',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'jam_selesai',
      backendField: 'jam_selesai',
      headerName: 'Jam Selesai',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'guru_mapel.mapel.nama',
      backendField: 'guru_mapel.mapel.nama',
      headerName: 'Mata Pelajaran',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const mapel = params.data?.guru_mapel?.mapel
        return mapel?.nama || mapel?.nama_mapel || '-'
      },
    },
    {
      field: 'guru_mapel.guru.nama',
      backendField: 'guru_mapel.guru.nama',
      headerName: 'Guru',
      sortable: true,
      filter: true,
      flex: 1,
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
        return (
          <div className="h-full flex items-center justify-center">
            <ActionsMenu
              onDetail={() => handleDetail(params.data)}
              onEdit={() => handleEdit(params.data)}
              onDelete={() => handleDelete(params.data)}
              detailPermission="jadwal-pelajaran.view"
              editPermission="jadwal-pelajaran.edit"
              deletePermission="jadwal-pelajaran.delete"
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Jadwal Pelajaran</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="jadwal-pelajaran.create">
            <Button onClick={() => navigate('/jadwal-pelajaran/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Jadwal
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/jadwal-pelajaran/"
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

export default JadwalPelajaranList