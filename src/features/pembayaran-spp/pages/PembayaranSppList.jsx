import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Search, Plus, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InfiniteGrid from '../../../components/ui/InfiniteGrid'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import ActionsMenu from '../../../components/ui/ActionsMenu'
import { pembayaranSppService } from '../services/pembayaranSppService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'
import { formatDateShort, formatRupiah } from '../../../utils/formatters'
import { usePageTitle } from '../../../hooks/usePageTitle'

// Month names in Indonesian
const BULAN_NAMES = {
  1: 'Januari',
  2: 'Februari',
  3: 'Maret',
  4: 'April',
  5: 'Mei',
  6: 'Juni',
  7: 'Juli',
  8: 'Agustus',
  9: 'September',
  10: 'Oktober',
  11: 'November',
  12: 'Desember'
}

// Payment method labels
const METODE_PEMBAYARAN_LABELS = {
  tunai: 'Tunai',
  transfer: 'Transfer Bank',
  debit: 'Kartu Debit',
  credit: 'Kartu Kredit',
  e_wallet: 'E-Wallet'
}

/**
 * Get status badge component for payment status
 * @param {string} status - Payment status ('lunas' or 'belum_lunas')
 * @returns {JSX.Element} Status badge component
 */
const getStatusBadge = (status) => {
  if (!status) return <span className="text-gray-500">-</span>
  
  const statusConfig = {
    lunas: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-300',
      label: 'Lunas'
    },
    belum_lunas: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-300',
      label: 'Belum Lunas'
    },
    sebagian: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-800 dark:text-yellow-300',
      label: 'Sebagian'
    }
  }

  const config = statusConfig[status] || statusConfig.belum_lunas

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}

/**
 * Get month name from month number
 * @param {number} bulan - Month number (1-12)
 * @returns {string} Month name in Indonesian
 */
const getBulanName = (bulan) => {
  return BULAN_NAMES[bulan] || '-'
}

/**
 * Get payment method label
 * @param {string} metode - Payment method code
 * @returns {string} Payment method label
 */
const getMetodeLabel = (metode) => {
  return METODE_PEMBAYARAN_LABELS[metode] || metode || '-'
}

const PembayaranSppList = () => {
  usePageTitle('Pembayaran SPP')
  const navigate = useNavigate()
  const gridRef = useRef(null)
  const [searchText, setSearchText] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchText])

  // Static params for API requests
  const staticParams = useMemo(() => ({
    sort_by: 'id',
    sort_dir: 'desc',
    search: debouncedSearch || '',
    filter: '{}',
  }), [debouncedSearch])

  // Navigation handlers
  const handleEdit = useCallback((data) => {
    navigate(`/keuangan/pembayaran-spp/${data.id}/edit`)
  }, [navigate])

  const handleDetail = useCallback((data) => {
    navigate(`/keuangan/pembayaran-spp/${data.id}`)
  }, [navigate])

  // Delete handler
  const handleDelete = useCallback(async (data) => {
    const siswaName = data.siswa?.nama || data.siswa_nama || 'pembayaran ini'
    const result = await showDeleteConfirm(`pembayaran SPP ${siswaName}`)
    
    if (result.isConfirmed) {
      const { error } = await pembayaranSppService.deletePembayaranSpp(data.id)
      if (!error) {
        showSuccess(`Pembayaran SPP berhasil dihapus!`)
        if (gridRef.current?.refreshGrid) {
          gridRef.current.refreshGrid()
        }
      } else {
        showError('Gagal menghapus pembayaran SPP')
      }
    }
  }, [])

  // Refresh handler
  const handleRefresh = useCallback(() => {
    if (gridRef.current?.refreshGrid) {
      gridRef.current.refreshGrid()
    }
  }, [])

  // Search input handler
  const onFilterTextBoxChanged = useCallback((e) => {
    setSearchText(e.target.value)
  }, [])

  // Column definitions for AG Grid
  const columnDefs = useMemo(() => [
    {
      field: 'id',
      headerName: 'No',
      width: 70,
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
      sortable: false,
      filter: false
    },
    {
      headerName: 'Nama Siswa',
      flex: 2,
      minWidth: 180,
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        const siswa = params.data?.siswa
        return siswa?.nama || params.data?.siswa_nama || '-'
      }
    },
    {
      field: 'bulan',
      headerName: 'Bulan',
      width: 120,
      sortable: true,
      filter: true,
      cellRenderer: (params) => getBulanName(params.value)
    },
    {
      field: 'tahun',
      headerName: 'Tahun',
      width: 100,
      sortable: true,
      filter: true,
      cellRenderer: (params) => params.value || '-'
    },
    {
      field: 'jumlah_bayar',
      headerName: 'Jumlah Bayar',
      width: 150,
      minWidth: 130,
      sortable: true,
      filter: 'agNumberColumnFilter',
      cellRenderer: (params) => formatRupiah(params.value)
    },
    {
      field: 'metode_pembayaran',
      headerName: 'Metode',
      width: 130,
      sortable: true,
      filter: true,
      cellRenderer: (params) => getMetodeLabel(params.value)
    },
    {
      field: 'tanggal_bayar',
      headerName: 'Tgl. Bayar',
      width: 120,
      sortable: true,
      filter: 'agDateColumnFilter',
      cellRenderer: (params) => formatDateShort(params.value)
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      sortable: true,
      filter: true,
      cellRenderer: (params) => (
        <div className="h-full flex items-center">
          {getStatusBadge(params.value)}
        </div>
      )
    },
    {
      field: 'denda',
      headerName: 'Denda',
      width: 120,
      sortable: true,
      filter: 'agNumberColumnFilter',
      cellRenderer: (params) => formatRupiah(params.value)
    },
    {
      field: 'keterangan',
      headerName: 'Keterangan',
      flex: 1,
      minWidth: 150,
      sortable: true,
      filter: true,
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

  // Default column definition
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Data Pembayaran SPP
        </h1>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari pembayaran..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          {/* Refresh Button */}
          <Button onClick={handleRefresh} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          {/* Add Payment Button */}
          <Button onClick={() => navigate('/keuangan/pembayaran-spp/create')}>
            <Plus size={18} className="mr-2" />
            Tambah Pembayaran
          </Button>
        </div>
      </div>

      {/* Grid Section */}
      <Card>
        <InfiniteGrid
          key="pembayaran-spp-grid"
          ref={gridRef}
          endpoint="/pembayaran-spp/"
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

export default PembayaranSppList
