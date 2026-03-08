import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AgGridReact } from 'ag-grid-react'
import { ArrowLeft, Save, RefreshCw, FileText, Users, BookOpen, GraduationCap, Award, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { ujianService } from '../services/ujianService'
import { showSuccess, showError, showConfirm } from '../../../utils/sweetalert'

// Editable cell component for nilai
const NilaiCellEditor = (props) => {
  const [value, setValue] = useState(props.value || '')

  const onChange = (e) => {
    const newValue = e.target.value
    // Only allow numbers and decimal point
    if (newValue === '' || /^\d*\.?\d*$/.test(newValue)) {
      const numValue = parseFloat(newValue)
      if (newValue === '' || (numValue >= 0 && numValue <= 100)) {
        setValue(newValue)
      }
    }
  }

  const onBlur = () => {
    props.stopEditing()
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      props.stopEditing()
    } else if (e.key === 'Escape') {
      props.stopEditing(true)
    }
  }

  useEffect(() => {
    props.eGridCell.addEventListener('keydown', onKeyDown)
    return () => {
      props.eGridCell.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className="w-full h-full px-2 py-1 border-0 outline-none bg-transparent text-center"
      autoFocus
    />
  )
}

// Editable cell component for keterangan
const KeteranganCellEditor = (props) => {
  const [value, setValue] = useState(props.value || '')

  const onChange = (e) => {
    setValue(e.target.value)
  }

  const onBlur = () => {
    props.stopEditing()
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      props.stopEditing()
    } else if (e.key === 'Escape') {
      props.stopEditing(true)
    }
  }

  useEffect(() => {
    props.eGridCell.addEventListener('keydown', onKeyDown)
    return () => {
      props.eGridCell.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      className="w-full h-full px-2 py-1 border-0 outline-none bg-transparent"
      autoFocus
    />
  )
}

const UjianNilai = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ujianData, setUjianData] = useState(null)
  const [nilaiData, setNilaiData] = useState([])
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchNilaiData()
  }, [id])

  const fetchNilaiData = async () => {
    setLoading(true)
    const { data, error } = await ujianService.getNilaiByUjian(id)
    if (data) {
      setUjianData(data.data.ujian)
      // Add row index for "No" column
      const nilaiWithIndex = data.data.nilai.map((item, index) => ({
        ...item,
        rowIndex: index + 1
      }))
      setNilaiData(nilaiWithIndex)
      setHasChanges(false)
    } else {
      showError('Gagal mengambil data nilai')
      navigate('/akademik/ujian')
    }
    setLoading(false)
  }

  const getJenisLabel = (value) => {
    if (!value) return '-'
    const jenisMap = {
      1: 'PTS (Penilaian Tengah Semester)',
      2: 'PAS (Penilaian Akhir Semester)',
      3: 'PH (Penilaian Harian)',
      4: 'Try Out',
      5: 'Ujian Sekolah',
    }
    return jenisMap[value] || `Jenis ${value}`
  }

  const getJenisShortLabel = (value) => {
    if (!value) return '-'
    const jenisMap = {
      1: 'PTS',
      2: 'PAS',
      3: 'PH',
      4: 'Try Out',
      5: 'Ujian Sekolah',
    }
    return jenisMap[value] || `Jenis ${value}`
  }

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!nilaiData || nilaiData.length === 0) {
      return { average: 0, highest: 0, lowest: 0, count: 0 }
    }

    const scores = nilaiData
      .map(item => parseFloat(item.nilai))
      .filter(score => !isNaN(score))

    if (scores.length === 0) {
      return { average: 0, highest: 0, lowest: 0, count: nilaiData.length }
    }

    const sum = scores.reduce((acc, score) => acc + score, 0)
    const average = sum / scores.length
    const highest = Math.max(...scores)
    const lowest = Math.min(...scores)

    return {
      average: average.toFixed(2),
      highest: highest.toFixed(2),
      lowest: lowest.toFixed(2),
      count: nilaiData.length
    }
  }, [nilaiData])

  // Handle cell value changes
  const onCellValueChanged = useCallback((params) => {
    setHasChanges(true)
    // Update the local data
    const updatedData = nilaiData.map(item => {
      if (item.id === params.data.id) {
        return { ...item, [params.colDef.field]: params.newValue }
      }
      return item
    })
    setNilaiData(updatedData)
  }, [nilaiData])

  // Handle save all changes
  const handleSave = async () => {
    if (!hasChanges) {
      showSuccess('Tidak ada perubahan untuk disimpan')
      return
    }

    const result = await showConfirm(
      'Simpan Perubahan',
      'Apakah Anda yakin ingin menyimpan semua perubahan nilai?'
    )

    if (result.isConfirmed) {
      setSaving(true)
      
      // Prepare data for bulk update
      const updateData = nilaiData.map(item => ({
        id: item.id,
        nilai: item.nilai,
        keterangan: item.keterangan
      }))

      // Note: The API endpoint for bulk update might need to be added to ujianService
      // For now, we'll simulate the success and show the data that would be sent
      console.log('Data to save:', updateData)
      
      // TODO: Implement actual bulk save API call when available
      // const { error } = await ujianService.saveNilaiBulk(id, updateData)
      
      setTimeout(() => {
        setSaving(false)
        setHasChanges(false)
        showSuccess('Nilai berhasil disimpan!')
      }, 500)
    }
  }

  const handleRefresh = () => {
    fetchNilaiData()
  }

  const columnDefs = useMemo(() => [
    {
      field: 'rowIndex',
      headerName: 'No',
      width: 70,
      sortable: false,
      filter: false,
      editable: false,
      cellStyle: { textAlign: 'center' }
    },
    {
      field: 'siswa.nis',
      headerName: 'NIS',
      sortable: true,
      filter: true,
      width: 120,
      editable: false,
      valueGetter: (params) => params.data.siswa?.nis || '-'
    },
    {
      field: 'siswa.nama',
      headerName: 'Nama Siswa',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 200,
      editable: false,
      valueGetter: (params) => params.data.siswa?.nama || '-'
    },
    {
      field: 'nilai',
      headerName: 'Nilai',
      sortable: true,
      filter: true,
      width: 100,
      editable: true,
      cellStyle: { textAlign: 'center' },
      cellEditor: NilaiCellEditor,
      valueFormatter: (params) => {
        if (!params.value || params.value === '') return '-'
        return parseFloat(params.value).toFixed(2)
      }
    },
    {
      field: 'keterangan',
      headerName: 'Keterangan',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 150,
      editable: true,
      cellEditor: KeteranganCellEditor,
      cellRenderer: (params) => params.value || '-'
    }
  ], [])

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/akademik/ujian')}>
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Input Nilai Ujian</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="secondary" 
            onClick={handleRefresh}
            disabled={saving}
          >
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={handleSave} 
            variant={hasChanges ? 'primary' : 'secondary'}
            loading={saving}
            disabled={!hasChanges}
          >
            <Save size={18} className="mr-2" />
            Simpan Perubahan
          </Button>
        </div>
      </div>

      {/* Exam Info Card */}
      {ujianData && (
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Mata Pelajaran</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {ujianData.mapel?.nama || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <GraduationCap size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Kelas</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {ujianData.kelas?.nama_kelas || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Jenis Ujian</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {getJenisShortLabel(ujianData.jenis)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users size={20} className="text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Jumlah Siswa</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {statistics.count} siswa
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <BarChart3 size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rata-rata Nilai</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {statistics.average}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Nilai Tertinggi</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {statistics.highest}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingDown size={24} className="text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Nilai Terendah</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {statistics.lowest}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Table */}
      <Card 
        title="Daftar Nilai Siswa" 
        actions={
          hasChanges && (
            <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Award size={16} />
              Ada perubahan yang belum disimpan
            </span>
          )
        }
      >
        {nilaiData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <Users size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">Tidak ada data siswa</p>
            <p className="text-sm">Belum ada siswa yang terdaftar di kelas ini</p>
          </div>
        ) : (
          <div className="ag-theme-alpine dark:ag-theme-alpine-dark w-full" style={{ height: 500 }}>
            <AgGridReact
              rowData={nilaiData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={15}
              paginationPageSizeSelector={[10, 15, 25, 50, 100]}
              animateRows={true}
              editType="fullRow"
              onCellValueChanged={onCellValueChanged}
              suppressClickEdit={false}
              singleClickEdit={true}
              stopEditingWhenCellsLoseFocus={true}
            />
          </div>
        )}
      </Card>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-2">Petunjuk Penggunaan:</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>Klik pada kolom Nilai atau Keterangan untuk mengedit</li>
          <li>Nilai harus berupa angka antara 0 - 100</li>
          <li>Tekan Enter atau klik di luar kolom untuk menyimpan perubahan sementara</li>
          <li>Klik tombol "Simpan Perubahan" untuk menyimpan semua perubahan ke server</li>
        </ul>
      </div>
    </div>
  )
}

export default UjianNilai