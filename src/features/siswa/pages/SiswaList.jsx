import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { siswaService } from '../services/siswaService'

// Actions Menu Component
const ActionsMenu = ({ data, onDetail, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const handleAction = (action) => {
    setIsOpen(false)
    action()
  }

  const handleButtonClick = (e) => {
    e.stopPropagation()
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX - 192
      })
    }
    
    setIsOpen(!isOpen)
  }

  const handleClickOutside = (e) => {
    const isOutsideButton = buttonRef.current && !buttonRef.current.contains(e.target)
    const isOutsideMenu = !menuRef.current || !menuRef.current.contains(e.target)
    
    if (isOutsideButton && isOutsideMenu) {
      setIsOpen(false)
    }
  }

  // Handle click outside
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        title="Actions"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-400">
          <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
        </svg>
      </button>
      
      {isOpen && (
        <div
          ref={menuRef}
          className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[10000]"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`
          }}
        >
          <div className="py-1">
            <button
              onClick={() => handleAction(onDetail)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              Detail
            </button>
            <button
              onClick={() => handleAction(onEdit)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={() => handleAction(onDelete)}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Hapus
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const SiswaList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  
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
      headerName: 'Nama Lengkap',
      sortable: true,
      filter: 'agTextColumnFilter',
      flex: 1,
      minWidth: 180
    },
    {
      field: 'jenis_kelamin',
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
  }, [navigate])

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
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Siswa</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </Button>
          <Button onClick={() => navigate('/siswa/create')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Tambah Siswa
          </Button>
        </div>
      </div>

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