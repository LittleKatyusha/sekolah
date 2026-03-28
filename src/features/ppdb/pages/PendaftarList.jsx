import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Search, Plus, RefreshCw, Eye, Edit, Trash2, MoreVertical, CheckSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { pendaftarService } from '../services/ppdbService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const STATUS_MAP = {
  draft: { label: 'Draft', bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
  terverifikasi: { label: 'Terverifikasi', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  seleksi: { label: 'Seleksi', bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  diterima: { label: 'Diterima', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  cadangan: { label: 'Cadangan', bg: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  ditolak: { label: 'Ditolak', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const GENDER_MAP = {
  L: 'Laki-laki',
  P: 'Perempuan',
}

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
      if (isOutsideButton && isOutsideMenu) setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative">
      <button ref={buttonRef} onClick={handleButtonClick} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Actions">
        <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
      </button>
      {isOpen && createPortal(
        <div ref={menuRef} className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[10000]" style={{ top: `${position.top}px`, left: `${position.left}px` }}>
          <div className="py-1">
            <button onClick={() => handleAction(onDetail)} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
              <Eye size={16} className="text-blue-600" /> Detail
            </button>
            <button onClick={() => handleAction(onEdit)} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
              <Edit size={16} className="text-yellow-600" /> Edit
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button onClick={() => handleAction(onDelete)} className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
              <Trash2 size={16} /> Hapus
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const BATCH_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'terverifikasi', label: 'Terverifikasi' },
  { value: 'seleksi', label: 'Seleksi' },
  { value: 'diterima', label: 'Diterima' },
  { value: 'cadangan', label: 'Cadangan' },
  { value: 'ditolak', label: 'Ditolak' },
]

const PendaftarList = () => {
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [searchText, setSearchText] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [batchStatus, setBatchStatus] = useState('')
  const [batchLoading, setBatchLoading] = useState(false)

  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    search: searchText || '',
    filter: '{}',
  }), [searchText])

  const handleEdit = useCallback((data) => navigate(`/ppdb/pendaftaran/${data.id}/edit`), [navigate])
  const handleDetail = useCallback((data) => navigate(`/ppdb/pendaftaran/${data.id}`), [navigate])

  const handleDelete = useCallback(async (data) => {
    const label = `Pendaftar "${data.nama_lengkap || ''}"`
    const result = await showDeleteConfirm(label)
    if (result.isConfirmed) {
      const { error } = await pendaftarService.delete(data.id)
      if (!error) {
        showSuccess(`${label} berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus pendaftar')
      }
    }
  }, [])

  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
  }, [])

  const onFilterTextBoxChanged = useCallback((e) => {
    setSearchText(e.target.value)
  }, [])

  const handleSelectionChanged = useCallback((event) => {
    const rows = event.api.getSelectedRows()
    setSelectedIds(rows.map((r) => r.id))
  }, [])

  const handleBatchSeleksi = useCallback(async () => {
    if (!selectedIds.length || !batchStatus) {
      showError('Pilih pendaftar dan status terlebih dahulu')
      return
    }
    setBatchLoading(true)
    const { data, error } = await pendaftarService.batchSeleksi(selectedIds, batchStatus)
    if (data) {
      showSuccess(`${data.data?.updated ?? selectedIds.length} pendaftar berhasil diperbarui`)
      setSelectedIds([])
      setBatchStatus('')
      if (gridRef.current?.refreshGrid) gridRef.current.refreshGrid()
    } else {
      showError(error?.message || 'Gagal melakukan batch seleksi')
    }
    setBatchLoading(false)
  }, [selectedIds, batchStatus])

  const columnDefs = useMemo(() => [
    { checkboxSelection: true, headerCheckboxSelection: true, width: 48, minWidth: 48, maxWidth: 48, suppressSizeToFit: true, sortable: false, filter: false, resizable: false },
    { field: 'id', headerName: 'ID', sortable: true, filter: true, width: 80, minWidth: 70 },
    { field: 'no_pendaftaran', headerName: 'No. Pendaftaran', sortable: true, filter: true, width: 160, minWidth: 140, cellRenderer: (params) => params.value || '-' },
    { field: 'nama_lengkap', headerName: 'Nama Lengkap', sortable: true, filter: true, flex: 2, minWidth: 200, cellRenderer: (params) => params.value || '-' },
    { field: 'email', headerName: 'Email', sortable: true, filter: true, flex: 1.5, minWidth: 180, cellRenderer: (params) => params.value || '-' },
    {
      field: 'jenis_kelamin',
      headerName: 'JK',
      sortable: true,
      filter: true,
      width: 100,
      minWidth: 80,
      cellRenderer: (params) => GENDER_MAP[params.value] || params.value || '-'
    },
    {
      field: 'status_pendaftaran',
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 140,
      minWidth: 120,
      cellRenderer: (params) => {
        const status = params.value
        if (!status) return '-'
        const info = STATUS_MAP[status] || { label: status, bg: 'bg-gray-100 text-gray-800' }
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.bg}`}>{info.label}</span>
      }
    },
    { field: 'asal_sekolah', headerName: 'Asal Sekolah', sortable: true, filter: true, flex: 1, minWidth: 150, cellRenderer: (params) => params.value || '-' },
    {
      headerName: 'Aksi',
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      suppressSizeToFit: true,
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
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
  ], [handleDetail, handleEdit, handleDelete])

  const defaultColDef = useMemo(() => ({ resizable: true, sortable: true, filter: true }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pendaftar PPDB</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari pendaftar..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <Button onClick={() => navigate('/ppdb/pendaftaran/create')}>
            <Plus size={18} className="mr-2" />
            Tambah Pendaftar
          </Button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <Card>
          <div className="p-4 flex flex-wrap items-center gap-3">
            <CheckSquare size={18} className="text-primary-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {selectedIds.length} pendaftar dipilih
            </span>
            <select
              value={batchStatus}
              onChange={(e) => setBatchStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Pilih Status --</option>
              {BATCH_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <Button onClick={handleBatchSeleksi} disabled={batchLoading || !batchStatus}>
              {batchLoading ? 'Memproses...' : 'Terapkan'}
            </Button>
            <Button variant="secondary" onClick={() => { setSelectedIds([]); if (gridRef.current?.api) gridRef.current.api.deselectAll() }}>
              Batal Pilih
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <InfiniteGrid
          ref={gridRef}
          endpoint="/ppdb/pendaftaran/"
          staticParams={staticParams}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          requestMode="ag-grid"
          rowSelection="multiple"
          suppressRowClickSelection
          onSelectionChanged={handleSelectionChanged}
          cacheBlockSize={20}
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          height={600}
        />
      </Card>
    </div>
  )
}

export default PendaftarList