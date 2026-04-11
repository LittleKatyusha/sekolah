import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, RefreshCw, Eye, Edit, Trash2, MoreVertical, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { deleteSoal } from '../services/soalService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { useReferenceOptions } from '../../../hooks/useReferenceOptions'
import GenerateSoalModal from '../components/GenerateSoalModal'

const getLabel = (value, options) => {
  if (!value || !options?.length) return value ?? '-'
  const opt = options.find(o => o.value === String(value) || o.value === value)
  return opt ? opt.label : value
}

const getTingkatKesulitanColorClass = (value) => {
  if (value === '3' || value === 3) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  if (value === '2' || value === 2) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
}

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
            <PermissionGuard permission="soal.view">
              <button
                onClick={() => handleAction(onDetail)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Eye size={16} className="text-blue-600" />
                Detail
              </button>
            </PermissionGuard>
            <PermissionGuard permission="soal.edit">
              <button
                onClick={() => handleAction(onEdit)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit size={16} className="text-yellow-600" />
                Edit
              </button>
            </PermissionGuard>
            <PermissionGuard permission="soal.delete">
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
            </PermissionGuard>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const SoalList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const { options: tipeSoalOptions } = useReferenceOptions('tipe_soal')
  const { options: tingkatKesulitanOptions } = useReferenceOptions('tingkat_kesulitan')

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    filter: '{}',
  }), [])

  const handleEdit = useCallback((data) => {
    navigate(`/akademik/soals/${data.id}/edit`)
  }, [navigate])

  const handleDetail = useCallback((data) => {
    navigate(`/akademik/soals/${data.id}`)
  }, [navigate])

  const handleDelete = useCallback(async (data) => {
    const result = await showDeleteConfirm(`Soal #${data.id}`)
    if (result.isConfirmed) {
      const { error } = await deleteSoal(data.id)
      if (!error) {
        showSuccess(`Soal #${data.id} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus soal')
      }
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
      field: 'pertanyaan',
      headerName: 'Pertanyaan',
      sortable: true,
      filter: true,
      flex: 2,
      minWidth: 200,
      cellRenderer: (params) => {
        const pertanyaan = params.value || ''
        return pertanyaan.length > 100
          ? `${pertanyaan.substring(0, 100)}...`
          : pertanyaan
      }
    },
    {
      field: 'tipe',
      backendField: 'tipe',
      headerName: 'Tipe',
      sortable: true,
      filter: false,
      width: 160,
      minWidth: 140,
      cellRenderer: (params) => {
        const label = getLabel(params.value, tipeSoalOptions)
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
            {label}
          </span>
        )
      }
    },
    {
      field: 'tingkat_kesulitan',
      backendField: 'tingkat_kesulitan',
      headerName: 'Tingkat Kesulitan',
      sortable: true,
      filter: false,
      width: 160,
      minWidth: 140,
      cellRenderer: (params) => {
        const label = getLabel(params.value, tingkatKesulitanOptions)
        const colorClass = getTingkatKesulitanColorClass(params.value)
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {label}
          </span>
        )
      }
    },
    {
    field: 'mapel',
    backendField: 'mapel.nama_mapel',
    headerName: 'Mata Pelajaran',
    valueGetter: (params) => params.data?.mapel?.nama || params.data?.mapel?.nama_mapel || '-',
      sortable: true,
      filter: true,
      width: 180,
      minWidth: 160
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
            />
          </div>
        )
      }
    }
  ], [handleDelete, handleDetail, handleEdit, tipeSoalOptions, tingkatKesulitanOptions])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
    if (gridRef.current?.api) {
      gridRef.current.api.refreshInfiniteCache()
    }
  }, [])

  const handleGenerateSuccess = useCallback((soals) => {
    showSuccess(`${soals.length} soal berhasil di-generate dan disimpan ke bank soal!`)
    handleRefresh()
  }, [handleRefresh])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Soal</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="soal.create">
            <Button
              onClick={() => setGenerateModalOpen(true)}
              variant="secondary"
              className="border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-600 dark:text-violet-400 dark:hover:bg-violet-900/20"
            >
              <Sparkles size={18} className="mr-2" />
              Generate AI
            </Button>
            <Button onClick={() => navigate('/akademik/soals/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Soal
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/akademik/soals"
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

      <GenerateSoalModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onSuccess={handleGenerateSuccess}
      />
    </div>
  )
}

export default SoalList