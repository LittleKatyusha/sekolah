import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, RefreshCw, MoreVertical, Calendar, X } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { kalenderHarianService } from '../services/kalenderHarianService'
import { tahunAjaranService } from '../../tahun-ajaran/services/tahunAjaranService'
import { semesterService } from '../../semester/services/semesterService'
import { showSuccess, showError } from '../../../utils/sweetalert'

const BOOLEAN_BADGE = {
  true: { label: 'Ya', bg: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  false: { label: 'Tidak', bg: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
}

const ActionsMenu = ({ data, onToggleOperasional, onToggleLibur, onToggleEfektif }) => {
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
              onClick={() => handleAction(onToggleOperasional)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <span className={`w-3 h-3 rounded-full ${data.is_operasional ? 'bg-green-500' : 'bg-red-500'}`} />
              Toggle Operasional
            </button>
            <button
              onClick={() => handleAction(onToggleLibur)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <span className={`w-3 h-3 rounded-full ${data.is_libur ? 'bg-green-500' : 'bg-red-500'}`} />
              Toggle Libur
            </button>
            <button
              onClick={() => handleAction(onToggleEfektif)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <span className={`w-3 h-3 rounded-full ${data.is_efektif ? 'bg-green-500' : 'bg-red-500'}`} />
              Toggle Efektif
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const GenerateModal = ({ isOpen, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    tanggal_mulai: '',
    tanggal_selesai: '',
    tahun_ajaran_id: '',
    semester_id: '',
  })
  const [tahunAjaranList, setTahunAjaranList] = useState([])
  const [semesterList, setSemesterList] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoadingOptions(true)
      Promise.all([
        tahunAjaranService.getAll({ per_page: 100 }),
        semesterService.getAll({ per_page: 100 }),
      ])
        .then(([tahunRes, semesterRes]) => {
          if (tahunRes.data) {
            setTahunAjaranList(tahunRes.data.data || [])
          }
          if (semesterRes.data) {
            setSemesterList(semesterRes.data.data || [])
          }
        })
        .catch(() => {
          showError('Gagal mengambil data referensi')
        })
        .finally(() => {
          setLoadingOptions(false)
        })
    }
  }, [isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.tanggal_mulai || !formData.tanggal_selesai || !formData.tahun_ajaran_id || !formData.semester_id) {
      showError('Semua field wajib diisi')
      return
    }
    if (formData.tanggal_selesai <= formData.tanggal_mulai) {
      showError('Tanggal selesai harus setelah tanggal mulai')
      return
    }
    onSubmit({
      ...formData,
      tahun_ajaran_id: parseInt(formData.tahun_ajaran_id),
      semester_id: parseInt(formData.semester_id),
    })
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Kalender Harian</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tanggal Mulai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="tanggal_mulai"
              value={formData.tanggal_mulai}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tanggal Selesai <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="tanggal_selesai"
              value={formData.tanggal_selesai}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tahun Ajaran <span className="text-red-500">*</span>
            </label>
            <select
              name="tahun_ajaran_id"
              value={formData.tahun_ajaran_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              required
              disabled={loadingOptions}
            >
              <option value="">-- Pilih Tahun Ajaran --</option>
              {tahunAjaranList.map((ta) => (
                <option key={ta.id} value={ta.id}>
                  {ta.nama || ta.kode || `Tahun Ajaran ${ta.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Semester <span className="text-red-500">*</span>
            </label>
            <select
              name="semester_id"
              value={formData.semester_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              required
              disabled={loadingOptions}
            >
              <option value="">-- Pilih Semester --</option>
              {semesterList.map((sem) => (
                <option key={sem.id} value={sem.id}>
                  {sem.nama || sem.kode || `Semester ${sem.id}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Calendar size={16} />
                  Generate
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

const KalenderHarianList = () => {
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)

  const [pageSize, setPageSize] = useState(10)
  const [totalRows, setTotalRows] = useState(0)

  const currentPageRef = useRef(1)
  const pageCursorsRef = useRef({ 1: null })
  const isFetchingRef = useRef(false)

  const gridRef = useRef(null)

  const fetchData = useCallback(async (page = 1, perPage = pageSize, searchQuery = searchText) => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    setLoading(true)

    const cursorValue = pageCursorsRef.current[page]
    const params = {
      per_page: perPage,
      ...(searchQuery && { search: searchQuery }),
      ...(cursorValue && { cursor: cursorValue })
    }

    const { data, error } = await kalenderHarianService.getAll(params)

    if (data) {
      setRowData(data.data || [])
      if (data.meta) {
        setTotalRows(data.meta.total || 0)
        currentPageRef.current = data.meta.current_page || page
        if (data.meta.next_cursor) {
          pageCursorsRef.current[page + 1] = data.meta.next_cursor
        }
      }
    } else {
      console.error('Error fetching kalender harian:', error)
      showError('Gagal mengambil data kalender harian')
    }

    setLoading(false)
    isFetchingRef.current = false
  }, [pageSize, searchText])

  useEffect(() => {
    pageCursorsRef.current = { 1: null }
    currentPageRef.current = 1
    fetchData(1, pageSize, searchText)
  }, [])

  const handleToggle = async (data, field) => {
    const newValue = !data[field]
    const { error } = await kalenderHarianService.update(data.id, { [field]: newValue })
    if (!error) {
      showSuccess(`${field.replace('is_', '').replace(/^\w/, c => c.toUpperCase())} berhasil diubah`)
      fetchData(currentPageRef.current, pageSize, searchText)
    } else {
      showError(`Gagal mengubah ${field.replace('is_', '')}`)
    }
  }

  const handleGenerate = async (formData) => {
    setGenerateLoading(true)
    const { error } = await kalenderHarianService.generate(formData)
    if (!error) {
      showSuccess('Kalender harian berhasil di-generate!')
      setShowGenerateModal(false)
      pageCursorsRef.current = { 1: null }
      currentPageRef.current = 1
      fetchData(1, pageSize, searchText)
    } else {
      showError('Gagal generate kalender harian')
    }
    setGenerateLoading(false)
  }

  const onPaginationChanged = useCallback((params) => {
    if (!gridRef.current || isFetchingRef.current) return
    const newPageNumber = params.api.paginationGetCurrentPage() + 1
    const newPageSize = params.api.paginationGetPageSize()

    if (newPageSize !== pageSize) {
      setPageSize(newPageSize)
      pageCursorsRef.current = { 1: null }
      currentPageRef.current = 1
      fetchData(1, newPageSize, searchText)
      return
    }

    if (newPageNumber !== currentPageRef.current) {
      fetchData(newPageNumber, pageSize, searchText)
    }
  }, [pageSize, searchText, fetchData])

  const onFilterTextBoxChanged = useCallback((e) => {
    const value = e.target.value
    setSearchText(value)
    pageCursorsRef.current = { 1: null }
    currentPageRef.current = 1
    if (gridRef.current) {
      gridRef.current.api.paginationGoToPage(0)
    }
    fetchData(1, pageSize, value)
  }, [fetchData, pageSize])

  const handleRefresh = useCallback(() => {
    fetchData(currentPageRef.current, pageSize, searchText)
  }, [fetchData, pageSize, searchText])

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const booleanCellRenderer = (params) => {
    const val = params.value
    if (val === null || val === undefined) return '-'
    const key = String(!!val)
    const info = BOOLEAN_BADGE[key] || { label: String(val), bg: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.bg}`}>
        {info.label}
      </span>
    )
  }

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
      field: 'tanggal',
      headerName: 'Tanggal',
      sortable: true,
      filter: true,
      flex: 1.5,
      minWidth: 180,
      cellRenderer: (params) => formatDate(params.value)
    },
    {
      field: 'is_operasional',
      headerName: 'Operasional',
      sortable: true,
      filter: true,
      width: 140,
      minWidth: 120,
      cellRenderer: booleanCellRenderer
    },
    {
      field: 'is_libur',
      headerName: 'Libur',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: booleanCellRenderer
    },
    {
      field: 'is_efektif',
      headerName: 'Efektif',
      sortable: true,
      filter: true,
      width: 120,
      minWidth: 100,
      cellRenderer: booleanCellRenderer
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
              onToggleOperasional={() => handleToggle(params.data, 'is_operasional')}
              onToggleLibur={() => handleToggle(params.data, 'is_libur')}
              onToggleEfektif={() => handleToggle(params.data, 'is_efektif')}
            />
          </div>
        )
      }
    }
  ], [])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kalender Harian</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari kalender harian..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <Button onClick={() => setShowGenerateModal(true)}>
            <Calendar size={18} className="mr-2" />
            Generate Kalender
          </Button>
        </div>
      </div>

      <Card>
        {loading && rowData.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="ag-theme-alpine dark:ag-theme-alpine-dark w-full" style={{ height: 600 }}>
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={pageSize}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              onPaginationChanged={onPaginationChanged}
              animateRows={true}
              suppressPaginationPanel={false}
              cacheBlockSize={pageSize}
              rowCount={totalRows}
            />
          </div>
        )}
      </Card>

      <GenerateModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onSubmit={handleGenerate}
        loading={generateLoading}
      />
    </div>
  )
}

export default KalenderHarianList