import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, RefreshCw, Eye, Edit, Trash2, MoreVertical, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import PermissionGuard from '../../../components/guards/PermissionGuard'
import { ujianUserService } from '../services/ujianUserService'
import { ujianService } from '../../ujian/services/ujianService'
import { siswaService } from '../../siswa/services/siswaService'
import { showDeleteConfirm, showSuccess, showError, showConfirm } from '../../../utils/sweetalert'

// Actions Menu Component
const ActionsMenu = ({ data, onDetail, onEdit, onDelete, onMulai }) => {
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

  // Determine if mulai button should be shown (status 0 = belum mulai)
  const canStart = data?.status === 0 || data?.status === null

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
            <PermissionGuard permission="ujian-user.view">
              <button
                onClick={() => handleAction(onDetail)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Eye size={16} className="text-blue-600" />
                Detail
              </button>
            </PermissionGuard>
            <PermissionGuard permission="ujian-user.edit">
              <button
                onClick={() => handleAction(onEdit)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit size={16} className="text-yellow-600" />
                Edit
              </button>
            </PermissionGuard>
            {canStart && (
              <PermissionGuard permission="ujian-user.edit">
                <button
                  onClick={() => handleAction(onMulai)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Play size={16} className="text-green-600" />
                  Mulai Ujian
                </button>
              </PermissionGuard>
            )}
            <PermissionGuard permission="ujian-user.delete">
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

const UjianUserList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  // Filter states
  const [selectedUjian, setSelectedUjian] = useState('')
  const [selectedSiswa, setSelectedSiswa] = useState('')
  const [ujianList, setUjianList] = useState([])
  const [siswaList, setSiswaList] = useState([])

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    filter: '{}',
    ...(selectedUjian ? { trx_ujian_id: selectedUjian } : {}),
    ...(selectedSiswa ? { mst_siswa_id: selectedSiswa } : {}),
  }), [selectedUjian, selectedSiswa])

  // Helper function to get status label
  const getStatusLabel = (value) => {
    if (value === null || value === undefined) return 'Belum Mulai'
    const statusMap = {
      0: 'Belum Mulai',
      1: 'Sedang Mengerjakan',
      2: 'Selesai',
      3: 'Dinilai',
    }
    return statusMap[value] || `Status ${value}`
  }

  // Helper function to get status badge color
  const getStatusColorClass = (value) => {
    const colorMap = {
      0: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      1: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      3: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    }
    return colorMap[value] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  // Helper function to format date
  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Fetch ujian list for filter
  useEffect(() => {
    const fetchUjianList = async () => {
      const { data, error } = await ujianService.getAll({ per_page: 100 })
      if (data && data.data) {
        const options = data.data.map(ujian => ({
          value: ujian.id,
          label: ujian.nama || `Ujian #${ujian.id}`
        }))
        setUjianList(options)
      } else {
        console.error('Error fetching ujian:', error)
      }
    }
    fetchUjianList()
  }, [])

  // Fetch siswa list for filter
  useEffect(() => {
    const fetchSiswaList = async () => {
      const { data, error } = await siswaService.getAll({ per_page: 100 })
      if (data && data.data) {
        const options = data.data.map(siswa => ({
          value: siswa.id,
          label: `${siswa.nama} (${siswa.nis})`
        }))
        setSiswaList(options)
      } else {
        console.error('Error fetching siswa:', error)
      }
    }
    fetchSiswaList()
  }, [])

  const handleEdit = useCallback((data) => {
    navigate(`/akademik/ujian-user/${data.id}/edit`)
  }, [navigate])

  const handleDetail = useCallback((data) => {
    navigate(`/akademik/ujian-user/${data.id}`)
  }, [navigate])

  const handleDelete = useCallback(async (data) => {
    const siswaName = data.siswa?.nama || 'Siswa'
    const ujianName = data.ujian?.nama || `Ujian #${data.trx_ujian_id}`
    const result = await showDeleteConfirm(`${siswaName} - ${ujianName}`)
    if (result.isConfirmed) {
      const { error } = await ujianUserService.delete(data.id)
      if (!error) {
        showSuccess('Ujian user berhasil dihapus!')
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus ujian user')
      }
    }
  }, [])

  const handleMulai = useCallback(async (data) => {
    const siswaName = data.siswa?.nama || 'Siswa'
    const ujianName = data.ujian?.nama || `Ujian #${data.trx_ujian_id}`
    const result = await showConfirm(
      `Apakah Anda yakin ingin memulai ujian ${ujianName} untuk ${siswaName}?`,
      'Konfirmasi Mulai Ujian'
    )
    if (result.isConfirmed) {
      const { error } = await ujianUserService.mulaiUjian(data.id)
      if (!error) {
        showSuccess('Ujian berhasil dimulai!')
        navigate(`/akademik/ujian-user/${data.id}`)
      } else {
        showError('Gagal memulai ujian')
      }
    }
  }, [navigate])

  const handleUjianChange = useCallback((e) => {
    setSelectedUjian(e.target.value)
  }, [])

  const handleSiswaChange = useCallback((e) => {
    setSelectedSiswa(e.target.value)
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
      field: 'ujian',
      backendField: 'ujian.nama',
      headerName: 'Nama Ujian',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const row = params.data
        if (!row) return '-'
        return row.ujian?.nama || `Ujian #${row.trx_ujian_id ?? '-'}`
      }
    },
    {
      field: 'siswa',
      backendField: 'siswa_display',
      headerName: 'Siswa',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => {
        const row = params.data
        if (!row) return '-'
        const siswa = row.siswa
        if (siswa) {
          return `${siswa.nama} (${siswa.nis})`
        }
        return `Siswa #${row.mst_siswa_id ?? '-'}`
      }
    },
    {
      field: 'status',
      backendField: 'status',
      headerName: 'Status',
      sortable: true,
      filter: false,
      width: 150,
      minWidth: 130,
      cellRenderer: (params) => {
        const label = getStatusLabel(params.value)
        const colorClass = getStatusColorClass(params.value)
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
            {label}
          </span>
        )
      }
    },
    {
      field: 'waktu_mulai',
      headerName: 'Waktu Mulai',
      sortable: true,
      filter: true,
      width: 150,
      minWidth: 130,
      cellRenderer: (params) => formatDateTime(params.value)
    },
    {
      field: 'waktu_selesai',
      headerName: 'Waktu Selesai',
      sortable: true,
      filter: true,
      width: 150,
      minWidth: 130,
      cellRenderer: (params) => formatDateTime(params.value)
    },
    {
      field: 'nilai_akhir',
      headerName: 'Nilai Akhir',
      sortable: true,
      filter: true,
      width: 110,
      minWidth: 100,
      cellRenderer: (params) => {
        const nilai = params.value
        if (nilai === null || nilai === undefined) return '-'
        return (
          <span className={`font-semibold ${
            parseFloat(nilai) >= 70
              ? 'text-green-600'
              : parseFloat(nilai) >= 60
                ? 'text-yellow-600'
                : 'text-red-600'
          }`}
          >
            {nilai}
          </span>
        )
      }
    },
    {
      field: 'total_benar',
      headerName: 'Benar',
      sortable: true,
      filter: true,
      width: 80,
      minWidth: 70,
      cellRenderer: (params) => params.value ?? '-'
    },
    {
      field: 'total_salah',
      headerName: 'Salah',
      sortable: true,
      filter: true,
      width: 80,
      minWidth: 70,
      cellRenderer: (params) => params.value ?? '-'
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
              data={row}
              onDetail={() => handleDetail(row)}
              onEdit={() => handleEdit(row)}
              onDelete={() => handleDelete(row)}
              onMulai={() => handleMulai(row)}
            />
          </div>
        )
      }
    }
  ], [handleDelete, handleDetail, handleEdit, handleMulai])

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

  // Prepare options with "Semua" as default
  const ujianOptions = [
    { value: '', label: 'Semua Ujian' },
    ...ujianList
  ]

  const siswaOptions = [
    { value: '', label: 'Semua Siswa' },
    ...siswaList
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Ujian User</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-48">
            <SearchableSelect
              name="ujian"
              value={selectedUjian}
              onChange={handleUjianChange}
              options={ujianOptions}
              placeholder="Pilih Ujian"
            />
          </div>
          <div className="w-full sm:w-48">
            <SearchableSelect
              name="siswa"
              value={selectedSiswa}
              onChange={handleSiswaChange}
              options={siswaOptions}
              placeholder="Pilih Siswa"
            />
          </div>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <PermissionGuard permission="ujian-user.create">
            <Button onClick={() => navigate('/akademik/ujian-user/create')}>
              <Plus size={18} className="mr-2" />
              Tambah
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/akademik/ujian-user/"
          requestMode="ag-grid"
          staticParams={staticParams}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          cacheBlockSize={20}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          height={600}
          overlayNoRowsTemplate={'<span class="text-gray-500">Tidak ada data ujian user</span>'}
        />
      </Card>
    </div>
  )
}

export default UjianUserList
