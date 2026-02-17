import { useState, useEffect, useMemo, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
// Only import the styles we actually use
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { Search, Download, Filter } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { apiService } from '../utils/api'
import { showInfo, showDeleteConfirm, showSuccess } from '../utils/sweetalert'

const DataGrid = () => {
  const [rowData, setRowData] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')

  // Column definitions with advanced features
  const columnDefs = useMemo(() => [
    { 
      field: 'id', 
      headerName: 'ID',
    },
    { 
      field: 'name', 
      headerName: 'Name',
      filter: 'agTextColumnFilter',
      sortable: true,
      editable: true,
    },
    { 
      field: 'email', 
      headerName: 'Email',
      filter: 'agTextColumnFilter',
      sortable: true,
      editable: true,
    },
    { 
      field: 'phone', 
      headerName: 'Phone',
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    { 
      field: 'company.name', 
      headerName: 'Company',
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    { 
      field: 'website', 
      headerName: 'Website',
      filter: 'agTextColumnFilter',
      cellRenderer: (params) => {
        return params.value ? (
          <a 
            href={`https://${params.value}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline"
          >
            {params.value}
          </a>
        ) : null
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      cellRenderer: (params) => {
        return (
          <div className="flex gap-2 h-full items-center">
            <button 
              onClick={() => handleEdit(params.data)}
              className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Edit
            </button>
            <button 
              onClick={() => handleDelete(params.data)}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        )
      }
    }
  ], [])

  // Default column definition
  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data, error } = await apiService.get('/users')
      if (data) {
        setRowData(data)
      } else {
        console.error('Error fetching data:', error)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  // Quick filter
  const onFilterTextBoxChanged = useCallback((e) => {
    setSearchText(e.target.value)
  }, [])

  // Export to CSV
  const onExportClick = useCallback(() => {
    const csv = convertToCSV(rowData)
    downloadCSV(csv, 'data-export.csv')
  }, [rowData])

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return ''
    
    const headers = Object.keys(data[0]).filter(key => key !== 'address' && key !== 'company')
    const csvRows = []
    
    csvRows.push(headers.join(','))
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]
        return typeof value === 'string' ? `"${value}"` : value
      })
      csvRows.push(values.join(','))
    }
    
    return csvRows.join('\n')
  }

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleEdit = (data) => {
    console.log('Edit:', data)
    showInfo(`You are editing: ${data.name}`, 'Edit User')
  }

  const handleDelete = async (data) => {
    console.log('Delete:', data)
    const result = await showDeleteConfirm(data.name)
    if (result.isConfirmed) {
      setRowData(prev => prev.filter(row => row.id !== data.id))
      showSuccess(`${data.name} has been deleted successfully!`, 'Deleted!')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold"></h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={onFilterTextBoxChanged}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
          <Button onClick={onExportClick} variant="secondary">
            <Download size={18} className="mr-2" />
            Export CSV
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
              rowSelection={{
                mode: 'multiRow',
                checkboxes: true,
                headerCheckbox: true,
              }}
              suppressRowClickSelection={true}
              quickFilterText={searchText}
              animateRows={true}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default DataGrid
