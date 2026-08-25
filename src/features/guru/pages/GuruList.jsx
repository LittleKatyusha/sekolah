import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, RefreshCw, Eye, Edit, Trash2, MoreVertical, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import usePermission from '../../../hooks/usePermission'
import { guruService } from '../services/guruService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'
import ImportGuruModal from './ImportGuruModal'

// Actions Menu Component
const ActionsMenu = ({ data, onDetail, onEdit, onDelete, detailPermission, editPermission, deletePermission }) => {
  const { hasPermission } = usePermission()
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
            {(!detailPermission || hasPermission(detailPermission)) && (
              <button
                onClick={() => handleAction(onDetail)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Eye size={16} className="text-blue-600" />
                Detail
              </button>
            )}
            {(!editPermission || hasPermission(editPermission)) && (
              <button
                onClick={() => handleAction(onEdit)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit size={16} className="text-yellow-600" />
                Edit
              </button>
            )}
            {(!deletePermission || hasPermission(deletePermission)) && (
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

const getLabel = (value, options) => {
  if (!value) return '-'
  const opt = options.find(o => o.value === String(value))
  return opt ? opt.label : value
}

const GuruList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [showImportModal, setShowImportModal] = useState(false)

  const { options: jkOptions } = useReferenceOptions('jenis_kelamin')
  const { options: pendidikanOptions } = useReferenceOptions('pendidikan_terakhir')

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    filter: '{}',
  }), [])

  const handleEdit = useCallback((data) => {
    navigate(`/guru/${data.id}/edit`)
  }, [navigate])

  const handleDetail = useCallback((data) => {
    navigate(`/guru/${data.id}`)
  }, [navigate])

  const handleDelete = useCallback(async (data) => {
    const result = await showDeleteConfirm(data.nama)
    if (result.isConfirmed) {
      const { error } = await guruService.delete(data.id)
      if (!error) {
        showSuccess(`${data.nama} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus guru')
      }
    }
  }, [])

  const getJenisKelaminLabel = useCallback((value) => getLabel(value, jkOptions), [jkOptions])

  const getPendidikanLabel = useCallback((value) => getLabel(value, pendidikanOptions), [pendidikanOptions])

  const columnDefs = useMemo(() => [
    {
      field: 'nip',
      headerName: 'NIP',
      sortable: true,
      filter: true,
      width: 160,
      minWidth: 130
    },
    {
      field: 'nuptk',
      headerName: 'NUPTK',
      sortable: true,
      filter: true,
      width: 130,
      minWidth: 100
    },
    {
      field: 'nama',
      headerName: 'Nama Lengkap',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 180
    },
    {
      field: 'jenis_kelamin',
      headerName: 'Jenis Kelamin',
      sortable: true,
      filter: true,
      width: 140,
      minWidth: 120,
      cellRenderer: (params) => {
        const jk = params.value
        const label = getJenisKelaminLabel(jk)
        const isLaki = (jk === 'Laki-Laki' || jk === 'Laki-laki' || jk === 1)
        const colorClass = isLaki
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400'

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {label}
          </span>
        )
      }
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
      field: 'email',
      headerName: 'Email',
      sortable: true,
      filter: true,
      width: 200,
      minWidth: 160,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'pendidikan_terakhir',
      headerName: 'Pendidikan',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => getPendidikanLabel(params.value)
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
              detailPermission="guru.view"
              editPermission="guru.edit"
              deletePermission="guru.delete"
            />
          </div>
        )
      }
    }
  ], [getJenisKelaminLabel, getPendidikanLabel, handleDetail, handleEdit, handleDelete])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
    // Also try to purge cache and reload if available
    if (gridRef.current?.api) {
      gridRef.current.api.refreshInfiniteCache()
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Guru</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="guru.create">
            <Button onClick={() => setShowImportModal(true)} variant="secondary">
              <Upload size={18} className="mr-2" />
              Import Excel
            </Button>
            <Button onClick={() => navigate('/guru/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Guru
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/guru/"
          staticParams={staticParams}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          cacheBlockSize={20}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          height={600}
        />
      </Card>

      {showImportModal && (
        <ImportGuruModal
          onClose={() => setShowImportModal(false)}
          onSuccess={(result) => {
            if (result.imported > 0) handleRefresh()
          }}
        />
      )}
    </div>
  )
}

export default GuruList