import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, RefreshCw, Eye, Edit, Trash2, MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { rankingService } from '../services/rankingService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import usePermission from '../../../hooks/usePermission'
import PermissionGuard from '../../../components/guards/PermissionGuard'

// Actions Menu Component (portal-based dropdown)
const ActionsMenu = ({ data, onDetail, onEdit, onDelete, detailPermission, editPermission, deletePermission }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const { hasPermission } = usePermission()

  const showDetail = onDetail && (detailPermission ? hasPermission(detailPermission) : true)
  const showEdit = onEdit && (editPermission ? hasPermission(editPermission) : true)
  const showDelete = onDelete && (deletePermission ? hasPermission(deletePermission) : true)
  const hasVisibleActions = showDetail || showEdit || showDelete

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
      {hasVisibleActions && (
        <button
          ref={buttonRef}
          onClick={handleButtonClick}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Actions"
        >
          <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
        </button>
      )}

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
            {showDetail && (
              <button
                onClick={() => handleAction(onDetail)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Eye size={16} className="text-blue-600" />
                Detail
              </button>
            )}
            {showEdit && (
              <button
                onClick={() => handleAction(onEdit)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit size={16} className="text-yellow-600" />
                Edit
              </button>
            )}
            {showDelete && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                <button
                  onClick={() => handleAction(onDelete)}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Hapus
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const RankingList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    filter: '{}',
  }), [])

  const handleEdit = useCallback((data) => {
    navigate(`/akademik/ranking/${data.id}/edit`)
  }, [navigate])

  const handleDetail = useCallback((data) => {
    navigate(`/akademik/ranking/${data.id}`)
  }, [navigate])

  const handleDelete = useCallback(async (data) => {
    const siswaNama = typeof data.siswa === 'object' ? (data.siswa?.nama || '') : (data.siswa || '')
    const label = `Ranking "${siswaNama} - Peringkat ${data.peringkat || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await rankingService.delete(data.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus ranking')
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
      field: 'id',
      headerName: 'ID',
      sortable: true,
      filter: true,
      width: 80,
      minWidth: 70
    },
    {
      field: 'peringkat',
      headerName: 'Peringkat',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => {
        const peringkat = params.value
        if (!peringkat) return '-'
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            #{peringkat}
          </span>
        )
      }
    },
    {
      field: 'siswa',
      backendField: 'rapor.siswa.nama',
      headerName: 'Siswa',
      sortable: true,
      filter: true,
      flex: 1.5,
      minWidth: 180,
      valueGetter: (params) => {
        const siswa = params.data?.siswa
        if (!siswa) return '-'
        return siswa.nama || siswa || '-'
      }
    },
    {
      field: 'nis',
      backendField: 'rapor.siswa.nis',
      headerName: 'NIS',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      valueGetter: (params) => params.data?.siswa?.nis || params.data?.nis || '-'
    },
    {
      field: 'kelas',
      backendField: 'kelas.nama_kelas',
      headerName: 'Kelas',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => {
        const kelas = params.data?.kelas
        if (!kelas) return '-'
        return typeof kelas === 'object' ? (kelas.nama_kelas || '-') : kelas
      }
    },
    {
      field: 'semester_nama',
      backendField: 'rapor.semester',
      headerName: 'Semester',
      sortable: true,
      filter: false,
      width: 120,
      minWidth: 100,
      valueGetter: (params) => params.data?.semester_nama || params.data?.semester || '-',
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'tahun_ajaran',
      backendField: 'rapor.tahunAjaran.nama',
      headerName: 'Tahun Ajaran',
      sortable: true,
      filter: true,
      width: 140,
      minWidth: 120,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'rata_rata_nilai',
      backendField: 'rapor.rata_rata',
      headerName: 'Rata-rata',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => {
        const nilai = params.value
        if (nilai === null || nilai === undefined) return '-'
        return (
          <span className="font-medium">{Number(nilai).toFixed(2)}</span>
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
              onEdit={() => handleEdit(params.data)}
              onDelete={() => handleDelete(params.data)}
              detailPermission="ranking.view"
              editPermission="ranking.edit"
              deletePermission="ranking.delete"
            />
          </div>
        )
      }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ranking</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="ranking.create">
            <Button onClick={() => navigate('/akademik/ranking/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Ranking
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/akademik/ranking/"
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

export default RankingList