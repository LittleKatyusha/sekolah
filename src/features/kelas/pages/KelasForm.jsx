import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, ChevronDown, X, Search } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { kelasService } from '../services/kelasService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import api from '../../../utils/api'

const KelasForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  
  const [formData, setFormData] = useState({
    nama_kelas: '',
    tingkat: '',
    tahun_ajaran: '',
    kapasitas: '',
    wali_guru_id: ''
  })

  const [errors, setErrors] = useState({})

  // Searchable select state for Wali Guru
  const [guruOptions, setGuruOptions] = useState([])
  const [guruLoading, setGuruLoading] = useState(false)
  const [guruSearch, setGuruSearch] = useState('')
  const [isGuruOpen, setIsGuruOpen] = useState(false)
  const [selectedGuru, setSelectedGuru] = useState(null)
  const guruDropdownRef = useRef(null)
  const guruSearchTimeoutRef = useRef(null)

  // Options for tingkat
  const tingkatOptions = [
    { value: 10, label: 'Kelas 10' },
    { value: 11, label: 'Kelas 11' },
    { value: 12, label: 'Kelas 12' }
  ]

  // Options for tahun ajaran - generate current year and next 2 years
  const tahunAjaranOptions = (() => {
    const currentYear = new Date().getFullYear()
    return [
      { value: `${currentYear}/${currentYear + 1}`, label: `${currentYear}/${currentYear + 1}` },
      { value: `${currentYear - 1}/${currentYear}`, label: `${currentYear - 1}/${currentYear}` },
      { value: `${currentYear + 1}/${currentYear + 2}`, label: `${currentYear + 1}/${currentYear + 2}` }
    ]
  })()

  useEffect(() => {
    if (isEditMode) {
      fetchKelas()
    }
    // Fetch guru list on mount
    fetchGuruList()
  }, [id])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (guruDropdownRef.current && !guruDropdownRef.current.contains(event.target)) {
        setIsGuruOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update selected guru when formData.wali_guru_id changes and guruOptions are loaded
  useEffect(() => {
    if (formData.wali_guru_id && guruOptions.length > 0) {
      const guru = guruOptions.find(g => g.id === parseInt(formData.wali_guru_id))
      if (guru) {
        setSelectedGuru(guru)
      }
    }
  }, [formData.wali_guru_id, guruOptions])

  // Debounced search for guru
  useEffect(() => {
    if (guruSearchTimeoutRef.current) {
      clearTimeout(guruSearchTimeoutRef.current)
    }

    guruSearchTimeoutRef.current = setTimeout(() => {
      if (isGuruOpen) {
        fetchGuruList(guruSearch)
      }
    }, 300)

    return () => {
      if (guruSearchTimeoutRef.current) {
        clearTimeout(guruSearchTimeoutRef.current)
      }
    }
  }, [guruSearch, isGuruOpen])

  const fetchGuruList = async (search = '') => {
    setGuruLoading(true)
    try {
      const params = search ? { search } : {}
      const response = await api.get('/guru/', { params })
      
      if (response.data.success) {
        setGuruOptions(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching guru list:', error)
      showError('Gagal mengambil data guru')
    } finally {
      setGuruLoading(false)
    }
  }

  const fetchKelas = async () => {
    setFetchingData(true)
    const { data, error } = await kelasService.getById(id)
    if (data) {
      const kelas = data.data
      const waliGuruId = kelas.wali_guru?.id || ''
      setFormData({
        nama_kelas: kelas.nama_kelas || '',
        tingkat: kelas.tingkat || '',
        tahun_ajaran: kelas.tahun_ajaran || '',
        kapasitas: kelas.kapasitas || '',
        wali_guru_id: waliGuruId
      })
      // Set selectedGuru for the searchable dropdown display
      if (kelas.wali_guru) {
        setSelectedGuru(kelas.wali_guru)
      }
    } else {
      showError('Gagal mengambil data kelas')
      navigate('/kelas')
    }
    setFetchingData(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleWaliGuruChange = (guru) => {
    setSelectedGuru(guru)
    setFormData(prev => ({ ...prev, wali_guru_id: guru ? guru.id : '' }))
    setIsGuruOpen(false)
    setGuruSearch('')
    
    // Clear error
    if (errors.wali_guru_id) {
      setErrors(prev => ({ ...prev, wali_guru_id: null }))
    }
  }

  const handleClearGuru = (e) => {
    e.stopPropagation()
    setSelectedGuru(null)
    setFormData(prev => ({ ...prev, wali_guru_id: '' }))
    setGuruSearch('')
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.nama_kelas) newErrors.nama_kelas = 'Nama kelas wajib diisi'
    if (!formData.tingkat) newErrors.tingkat = 'Tingkat wajib dipilih'
    if (!formData.tahun_ajaran) newErrors.tahun_ajaran = 'Tahun ajaran wajib dipilih'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    setLoading(true)
    
    // Prepare data - convert empty strings to null
    const submitData = {
      nama_kelas: formData.nama_kelas,
      tingkat: parseInt(formData.tingkat),
      tahun_ajaran: formData.tahun_ajaran,
      kapasitas: formData.kapasitas ? parseInt(formData.kapasitas) : null,
      wali_guru_id: formData.wali_guru_id ? parseInt(formData.wali_guru_id) : null
    }

    let result
    
    if (isEditMode) {
      result = await kelasService.update(id, submitData)
    } else {
      result = await kelasService.create(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Kelas berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/kelas')
    } else {
      console.error(error)
      // Handle server-side validation errors
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} kelas`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/kelas')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Kelas' : 'Tambah Kelas Baru'}
        </h1>
      </div>

      <Card>
        {fetchingData ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Kelas */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nama Kelas <span className="text-red-500">*</span>
              </label>
              <Input
                name="nama_kelas"
                value={formData.nama_kelas}
                onChange={handleChange}
                placeholder="Contoh: X IPA 1"
                error={errors.nama_kelas}
              />
            </div>

            {/* Tingkat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tingkat <span className="text-red-500">*</span>
              </label>
              <select
                name="tingkat"
                value={formData.tingkat}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Pilih Tingkat</option>
                {tingkatOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.tingkat && <p className="mt-1 text-sm text-red-500">{errors.tingkat}</p>}
            </div>

            {/* Tahun Ajaran */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tahun Ajaran <span className="text-red-500">*</span>
              </label>
              <select
                name="tahun_ajaran"
                value={formData.tahun_ajaran}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Pilih Tahun Ajaran</option>
                {tahunAjaranOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.tahun_ajaran && <p className="mt-1 text-sm text-red-500">{errors.tahun_ajaran}</p>}
            </div>

            {/* Kapasitas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kapasitas Maksimal Siswa
              </label>
              <Input
                type="number"
                name="kapasitas"
                value={formData.kapasitas}
                onChange={handleChange}
                placeholder="Contoh: 40"
                error={errors.kapasitas}
              />
            </div>

            {/* Wali Guru - Searchable Select */}
            <div ref={guruDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Wali Kelas
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsGuruOpen(!isGuruOpen)}
                  className={`w-full rounded-md border ${
                    errors.wali_guru_id 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                  } bg-white px-3 py-2 text-sm text-left focus:outline-none focus:ring-1 dark:border-gray-600 dark:bg-gray-800 dark:text-white flex items-center justify-between`}
                >
                  <span className={selectedGuru ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                    {selectedGuru ? `${selectedGuru.nama}${selectedGuru.nip ? ` (${selectedGuru.nip})` : ''}` : 'Pilih Wali Kelas'}
                  </span>
                  <div className="flex items-center gap-1">
                    {selectedGuru && (
                      <X
                        size={16}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        onClick={handleClearGuru}
                      />
                    )}
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${isGuruOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {/* Dropdown */}
                {isGuruOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800 max-h-60 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-gray-300 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="Cari guru..."
                          value={guruSearch}
                          onChange={(e) => setGuruSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-48 overflow-y-auto">
                      {guruLoading ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                          Memuat data...
                        </div>
                      ) : guruOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                          Tidak ada data guru
                        </div>
                      ) : (
                        guruOptions.map((guru) => (
                          <button
                            key={guru.id}
                            type="button"
                            onClick={() => handleWaliGuruChange(guru)}
                            className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex flex-col ${
                              selectedGuru?.id === guru.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                            }`}
                          >
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {guru.nama}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              NIP: {guru.nip} {guru.nuptk && `| NUPTK: ${guru.nuptk}`}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.wali_guru_id && <p className="mt-1 text-sm text-red-500">{errors.wali_guru_id}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="secondary" onClick={() => navigate('/kelas')}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              <Save size={18} className="mr-2" />
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
        )}
      </Card>
    </div>
  )
}

export default KelasForm