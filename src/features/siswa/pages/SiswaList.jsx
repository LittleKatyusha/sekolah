import { useState, useEffect, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, Plus, Filter, RefreshCw, Eye, Edit, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { siswaService } from '../services/siswaService'
import { showDeleteConfirm, showSuccess, showError } from '../../../utils/sweetalert'

const SiswaList = () => {
  const navigate = useNavigate()
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')

  const fetchSiswa = async () => {
    setLoading(true)
    const { data, error } = await siswaService.getAll()
    if (data) {
      setRowData(data.data || []) // Adjust based on API response structure
    } else {
      console.error('Error fetching siswa:', error)
      showError('Gagal mengambil data siswa')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSiswa()
  }, [])

  const handleEdit = (data) => {
    navigate(`/siswa/${data.id}/edit`)
  }

  const handleDetail = (data) => {
    navigate(`/siswa/${data.id}`)
  }

  const handleDelete = async (data) => {
    const result = await showDeleteConfirm(data.nama)
    if (result.isConfirmed) {
      const { error } = await siswaService.delete(data.id)
      if (!error) {
        showSuccess(`${data.nama} berhasil dihapus!`)
        fetchSiswa()
      } else {
        showError('Gagal menghapus siswa')
      }
    }
  }

  const columnDefs = useMemo(() => [
    { 
      field: 'nis', 
      headerName: 'NIS',
      sortable: true,
      filter: true,
      width: 120
    },
    { 
      field: 'nisn', 
      headerName: 'NISN',
      sortable: true,
      filter: true,
      width: 120
    },
    { 
      field: 'nama', 
      headerName: 'Nama Lengkap',
      sortable: true,
      filter: true,
      flex: 1
    },
    { 
      field: 'kelas.nama_kelas', 
      headerName: 'Kelas',
      sortable: true,
      filter: true,
      width: 120
    },
    { 
      field: 'status_siswa', 
      headerName: 'Status',
      sortable: true,
      filter: true,
      width: 120,
      cellRenderer: (params) => {
        const status = params.value
        let colorClass = 'bg-gray-100 text-gray-800'
        
        if (status === 'aktif') colorClass = 'bg-green-100 text-green-800'
        else if (status === 'lulus') colorClass = 'bg-blue-100 text-blue-800'
        else if (status === 'keluar') colorClass = 'bg-red-100 text-red-800'
        else if (status === 'pindah') colorClass = 'bg-yellow-100 text-yellow-800'

        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass} capitalize`}>
            {status}
          </span>
        )
      }
    },
    {
      headerName: 'Aksi',
      width: 150,
      cellRenderer: (params) => {
        return (
          <div className="flex gap-2 h-full items-center">
            <button 
              onClick={() => handleDetail(params.data)}
              className="text-blue-600 hover:text-blue-800"
              title="Detail"
            >
              <Eye size={18} />
            </button>
            <button 
              onClick={() => handleEdit(params.data)}
              className="text-yellow-600 hover:text-yellow-800"
              title="Edit"
            >
              <Edit size={18} />
            </button>
            <button 
              onClick={() => handleDelete(params.data)}
              className="text-red-600 hover:text-red-800"
              title="Hapus"
            >
              <Trash2 size={18} />
            </button>
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

  const onFilterTextBoxChanged = useCallback((e) => {
    setSearchText(e.target.value)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Siswa</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari siswa..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none w-full sm:w-64"
            />
          </div>
          <Button onClick={fetchSiswa} variant="secondary" title="Refresh Data">
            <RefreshCw size={18} />
          </Button>
          <Button onClick={() => navigate('/siswa/create')}>
            <Plus size={18} className="mr-2" />
            Tambah Siswa
          </Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="ag-theme-alpine dark:ag-theme-alpine-dark w-full" style={{ height: 600 }}>
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              quickFilterText={searchText}
              animateRows={true}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default SiswaList