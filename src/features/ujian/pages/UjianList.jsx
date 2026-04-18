import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, RefreshCw, Eye, Edit, Trash2, MoreVertical, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { ujianService } from '../services/ujianService'
import { kelasService } from '../../kelas/services/kelasService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { formatJenisLabel, formatSemesterLabel, getJenisColorClass, getMapelLabel, getUjianName } from '../utils/ujianFormatters'

// Actions Menu Component
const ActionsMenu = ({ data, onDetail, onEdit, onDelete, onNilai }) => {
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
            <PermissionGuard permission="ujian.view">
              <button
                onClick={() => handleAction(onDetail)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Eye size={16} className="text-blue-600" />
                Detail
              </button>
            </PermissionGuard>
            <PermissionGuard permission="ujian.edit">
              <button
                onClick={() => handleAction(onEdit)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit size={16} className="text-yellow-600" />
                Edit
              </button>
            </PermissionGuard>
            <PermissionGuard permission="ujian.view">
              <button
                onClick={() => handleAction(onNilai)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FileText size={16} className="text-green-600" />
                Nilai
              </button>
            </PermissionGuard>
            <PermissionGuard permission="ujian.delete">
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

const UjianList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [selectedKelas, setSelectedKelas] = useState('')
  const [kelasList, setKelasList] = useState([])

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    filter: '{}',
  }), [])

  // Dynamic endpoint based on selected kelas filter
  const endpoint = selectedKelas 
    ? `/akademik/ujian/kelas/${selectedKelas}` 
    : '/akademik/ujian/'

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  useEffect(() => {
    const fetchKelasList = async () => {
      const { data, error } = await kelasService.getAll({ per_page: 100 })
      if (data && data.data) {
        const options = data.data.map(kelas => ({
          value: kelas.id,
          label: kelas.nama_kelas
        }))
        setKelasList(options)
      } else {
        console.error('Error fetching kelas:', error)
      }
    }
    fetchKelasList()
  }, [])

  const handleEdit = useCallback((data) => {
    navigate(`/akademik/ujian/${data.id}/edit`)
  }, [navigate])

  const handleDetail = useCallback((data) => {
    navigate(`/akademik/ujian/${data.id}`)
  }, [navigate])

  const handleDelete = useCallback(async (data) => {
    const result = await showDeleteConfirm(getUjianName(data))
    if (result.isConfirmed) {
      const { error } = await ujianService.delete(data.id)
      if (!error) {
        showSuccess('Ujian berhasil dihapus!')
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus ujian')
      }
    }
  }, [])

  const handleNilai = useCallback((data) => {
    navigate(`/akademik/ujian/${data.id}/nilai`)
  }, [navigate])

  const handleKelasChange = useCallback((e) => {
    setSelectedKelas(e.target.value)
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
      headerName: 'ID',
      width: 70,
      sortable: true,
      filter: true
    },
    {
      field: 'mapel',
      backendField: 'mapel.nama_mapel',
      headerName: 'Mapel',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => getMapelLabel(params.data?.mapel)
    },
    {
      field: 'kelas',
      backendField: 'kelas.nama_kelas',
      headerName: 'Kelas',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      valueGetter: (params) => {
        return params.data?.kelas?.nama_kelas || '-'
      }
    },
    {
      field: 'jenis',
      backendField: 'jenis',
      headerName: 'Jenis',
      sortable: true,
      filter: false,
      width: 120,
      minWidth: 100,
      cellRenderer: (params) => {
        const label = formatJenisLabel(params.value, { short: true })
        const colorClass = getJenisColorClass(params.value)
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {label}
          </span>
        )
      }
    },
    {
      field: 'nama',
      headerName: 'Nama',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 150,
      cellRenderer: (params) => getUjianName(params.data)
    },
    {
      field: 'tanggal',
      headerName: 'Tanggal',
      sortable: true,
      filter: true,
      width: 150,
      minWidth: 130,
      cellRenderer: (params) => formatDate(params.value)
    },
    {
      field: 'semester',
      backendField: 'semester',
      headerName: 'Semester',
      sortable: true,
      filter: false,
      width: 110,
      minWidth: 100,
      cellRenderer: (params) => formatSemesterLabel(params.value)
    },
    {
      field: 'tahun_ajaran',
      headerName: 'Tahun Ajaran',
      sortable: true,
      filter: true,
      width: 130,
      minWidth: 110,
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
              data={params.data}
              onDetail={() => handleDetail(params.data)}
              onEdit={() => handleEdit(params.data)}
              onDelete={() => handleDelete(params.data)}
              onNilai={() => handleNilai(params.data)}
            />
          </div>
        )
      }
    }
  ], [handleDelete, handleDetail, handleEdit, handleNilai])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  const kelasOptions = [
    { value: '', label: 'Semua Kelas' },
    ...kelasList
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Ujian</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-48">
            <SearchableSelect
              name="kelas"
              value={selectedKelas}
              onChange={handleKelasChange}
              options={kelasOptions}
              placeholder="Pilih Kelas"
            />
          </div>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="ujian.create">
            <Button onClick={() => navigate('/akademik/ujian/create')}>
              <Plus size={18} className="mr-2" />
              Tambah Ujian
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          key={endpoint}
          ref={gridRef}
          endpoint={endpoint}
          requestMode="ag-grid"
          staticParams={staticParams}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          cacheBlockSize={20}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          height={600}
          overlayNoRowsTemplate={'<span class="text-gray-500">Tidak ada data ujian</span>'}
        />
      </Card>
    </div>
  )
}

export default UjianList