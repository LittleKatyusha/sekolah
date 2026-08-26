import { useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { siswaService } from '../services/siswaService'
import ImportSiswaModal from './ImportSiswaModal'

const SiswaList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [showImport, setShowImport] = useState(false)
  
  // Column definitions
  const columnDefs = useMemo(() => [
    { 
      field: 'nis', 
      headerName: 'NIS',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 120,
      minWidth: 100
    },
    { 
      field: 'nisn', 
      headerName: 'NISN',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 120,
      minWidth: 100,
      valueFormatter: (params) => params.value || '-'
    },
    { 
      field: 'nama', 
      backendField: 'nama',
      headerName: 'Nama Lengkap',
      sortable: true,
      filter: 'agTextColumnFilter',
      flex: 1,
      minWidth: 180
    },
    {
      field: 'jenis_kelamin',
      backendField: 'jenis_kelamin',
      headerName: 'Jenis Kelamin',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 140,
      minWidth: 120,
      cellRenderer: (params) => {
        const jk = params.value
        if (!jk) return '-'
        const isLaki = (jk === 'Laki-Laki' || jk === 'Laki-laki')
        const colorClass = isLaki
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400'

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {jk}
          </span>
        )
      }
    },
    { 
      field: 'kelas', 
      backendField: 'kelas.nama_kelas',
      headerName: 'Kelas',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 130,
      minWidth: 110,
      valueGetter: (params) => params.data?.kelas?.nama_kelas || '-',
      valueFormatter: (params) => params.value || '-'
    },
    { 
      field: 'status', 
      backendField: 'status',
      headerName: 'Status',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => {
        const status = params.value
        if (!status) return '-'
        let colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
        
        const statusLower = status.toLowerCase()
        if (statusLower === 'aktif') colorClass = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        else if (statusLower === 'lulus') colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
        else if (statusLower === 'keluar') colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        else if (statusLower === 'pindah') colorClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {status}
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
              onDetail={() => navigate(`/siswa/${params.data.id}`)}
              onEdit={() => navigate(`/siswa/${params.data.id}/edit`)}
              onDelete={() => handleDelete(params.data)}
              detailPermission="siswa.view"
              editPermission="siswa.edit"
              deletePermission="siswa.delete"
            />
          </div>
        )
      }
    }
  ], [navigate])

  // Default column definition
  const defaultColDef = useMemo(() => ({
    resizable: true,
  }), [])

  // Handle row click for navigation
  const handleRowClicked = useCallback((event) => {
    // Optional: navigate to detail on row click
    // navigate(`/siswa/${event.data.id}`)
  }, [])

  // Handle delete
  const handleDelete = async (data) => {
    const result = await showDeleteConfirm(data.nama)
    if (result.isConfirmed) {
      const { error } = await siswaService.delete(data.id)
      if (!error) {
        showSuccess(`${data.nama} berhasil dihapus!`)
        // Refresh the grid
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus siswa')
      }
    }
  }

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
    if (gridRef.current?.api) {
      gridRef.current.api.refreshInfiniteCache()
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Siswa</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <PermissionGuard permission="siswa.create">
            <Button onClick={() => setShowImport(true)} variant="secondary" title="Import Excel">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Import Excel
            </Button>
          </PermissionGuard>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </Button>
          <PermissionGuard permission="siswa.create">
            <Button onClick={() => navigate('/siswa/create')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Tambah Siswa
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {showImport && (
        <ImportSiswaModal
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false)
            if (gridRef.current?.refreshGrid) gridRef.current.refreshGrid()
          }}
        />
      )}

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/siswa/"
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          cacheBlockSize={20}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          onRowClicked={handleRowClicked}
          height={600}
        />
      </Card>
    </div>
  )
}

export default SiswaList