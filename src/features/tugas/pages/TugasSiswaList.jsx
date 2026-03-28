import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Search, Plus, RefreshCw, Eye, Trash2, MoreVertical, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { tugasSiswaService } from '../services/tugasService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import usePermission from '../../../hooks/usePermission'

// Submission status mapping
const STATUS_MAP = {
  'tepat waktu': { label: 'Tepat Waktu', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  belum: { label: 'Belum', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  terlambat: { label: 'Terlambat', bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  1: { label: 'Tepat Waktu', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  0: { label: 'Belum', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  2: { label: 'Terlambat', bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
}

// Actions Menu Component (portal-based dropdown)
const ActionsMenu = ({ data, onDetail, onGrade, onDelete,
  canEdit = true,
  canDelete = true
}) => {
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

  useEffect(() => {
    const handleClickOutside = (e) => {
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(e.target)
      const isOutsideMenu = !menuRef.current || !menuRef.current.contains(e.target)

      if (isOutsideButton && isOutsideMenu) {
        setIsOpen(false)
      }
    }

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
        <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && createPortal(
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
              <Eye size={16} className="text-blue-600" />
              Detail
            </button>
            <button
              onClick={() => handleAction(onGrade)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <Star size={16} className="text-yellow-600" />
              Nilai
            </button>
            {canEdit && canDelete && (
              <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            )}
            {canDelete && (
              <button
              onClick={() => handleAction(onDelete)}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
            >
              <Trash2 size={16} />
              Hapus
            </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const TugasSiswaList = () => {
  const { can } = usePermission()
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [searchText, setSearchText] = useState('')

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    search: searchText || '',
    filter: '{}',
  }), [searchText])

  const handleDetail = useCallback((data) => {
    navigate(`/akademik/tugas-siswa/${data.id}`)
  }, [navigate])

  const handleGrade = useCallback((data) => {
    navigate(`/akademik/tugas-siswa/${data.id}`, { state: { openGrade: true } })
  }, [navigate])

  const handleDelete = useCallback(async (data) => {
    const label = `Pengumpulan tugas #${data.id}`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await tugasSiswaService.delete(data.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus data')
      }
    }
  }, [])

  const onFilterTextBoxChanged = useCallback((e) => {
    setSearchText(e.target.value)
  }, [])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
  }, [])

  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

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
      headerName: 'Tugas',
      backendField: 'tugas.judul',
      sortable: true,
      filter: true,
      flex: 1.5,
      minWidth: 180,
      valueGetter: (params) => {
        return params.data?.tugas?.judul || '-'
      }
    },
    {
      headerName: 'Siswa',
      backendField: 'siswa.nama',
      sortable: true,
      filter: true,
      flex: 1.5,
      minWidth: 150,
      valueGetter: (params) => {
        return params.data?.siswa?.nama || params.data?.siswa?.name || '-'
      }
    },
    {
      field: 'waktu_kumpl',
      backendField: 'waktu_kumpul',
      headerName: 'Tanggal Kumpul',
      sortable: true,
      filter: true,
      width: 180,
      minWidth: 150,
      cellRenderer: (params) => formatDateTime(params.value)
    },
    {
      field: 'status_kumpl_label',
      backendField: 'status_kumpul',
      headerName: 'Status',
      sortable: true,
      filter: false,
      width: 160,
      minWidth: 140,
      cellRenderer: (params) => {
        const label = params.value
        if (!label) return '-'
        const statusKey = String(label).toLowerCase()
        const statusInfo = STATUS_MAP[statusKey] || { label: String(label), bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' }
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg}`}>
            {statusInfo.label}
          </span>
        )
      }
    },
    {
      field: 'nilai',
      backendField: 'nilai',
      headerName: 'Nilai',
      sortable: true,
      filter: true,
      width: 100,
      minWidth: 80,
      cellRenderer: (params) => {
        const nilai = params.value
        if (nilai === null || nilai === undefined) return '-'
        return (
          <span className="font-medium">{nilai}</span>
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
              onDetail={() => handleDetail(params.data)}
              onGrade={() => handleGrade(params.data)}
              onDelete={() => handleDelete(params.data)}
              canEdit={can('tugas-siswa.update')}
              canDelete={can('tugas-siswa.delete')}
            />
          </div>
        )
      }
    }
  ], [formatDateTime, handleDetail, handleGrade, handleDelete])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tugas Siswa</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari tugas siswa..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          {can('tugas-siswa.create') && (
            <Button onClick={() => navigate('/akademik/tugas-siswa/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Pengumpulan
            </Button>
          )}
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/akademik/tugas-siswa/"
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

export default TugasSiswaList