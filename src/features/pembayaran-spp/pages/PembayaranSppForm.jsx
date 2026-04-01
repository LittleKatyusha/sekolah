import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Calculator } from 'lucide-react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import SearchableSelect from '../../../components/ui/SearchableSelect'
import { pembayaranSppService } from '../services/pembayaranSppService'
import { tarifSppService } from '../../spp/services/sppService'
import { siswaService } from '../../siswa/services/siswaService'
import { showSuccess, showError } from '../../../utils/sweetalert'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatRupiah } from '../../../utils/formatters'

// Indonesian month names
const BULAN_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
]

// Payment method options
const METODE_PEMBAYARAN_OPTIONS = [
  { value: 'tunai', label: 'Tunai' },
  { value: 'transfer', label: 'Transfer Bank' },
  { value: 'qris', label: 'QRIS' },
  { value: 'e-wallet', label: 'E-Wallet' },
  { value: 'lainnya', label: 'Lainnya' },
]

// Generate year options (current year and surrounding years)
const generateYearOptions = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    years.push({ value: i, label: i.toString() })
  }
  return years
}

const PembayaranSppForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!id
  const pageTitle = isEditMode ? 'Edit Pembayaran SPP' : 'Tambah Pembayaran SPP'
  usePageTitle(pageTitle)

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [calculatingDenda, setCalculatingDenda] = useState(false)

  // Selected options for SearchableSelect
  const [selectedSiswaOption, setSelectedSiswaOption] = useState(null)
  const [tarifOptions, setTarifOptions] = useState([])

  const [formData, setFormData] = useState({
    siswa_id: '',
    tarif_spp_id: '',
    bulan: new Date().getMonth() + 1,
    tahun: new Date().getFullYear(),
    jumlah_bayar: '',
    metode_pembayaran: 'tunai',
    tanggal_bayar: new Date().toISOString().split('T')[0],
    denda: '',
    keterangan: '',
  })

  const [errors, setErrors] = useState({})

  // Fetch tarif options on mount
  useEffect(() => {
    fetchTarifOptions()
  }, [])

  // Fetch existing data in edit mode
  useEffect(() => {
    if (!isEditMode) return

    const controller = new AbortController()

    const fetchPembayaran = async () => {
      setFetchingData(true)
      try {
        const { data, error } = await pembayaranSppService.getPembayaranSppById(id)
        if (controller.signal.aborted) return

        if (data?.data) {
          const pembayaran = data.data
          setFormData({
            siswa_id: pembayaran.siswa_id || '',
            tarif_spp_id: pembayaran.tarif_spp_id || '',
            bulan: pembayaran.bulan || new Date().getMonth() + 1,
            tahun: pembayaran.tahun || new Date().getFullYear(),
            jumlah_bayar: pembayaran.jumlah_bayar || '',
            metode_pembayaran: pembayaran.metode_pembayaran || 'tunai',
            tanggal_bayar: pembayaran.tanggal_bayar || new Date().toISOString().split('T')[0],
            denda: pembayaran.denda || '',
            keterangan: pembayaran.keterangan || '',
          })

          // Set selected siswa option
          if (pembayaran.siswa) {
            setSelectedSiswaOption({
              value: pembayaran.siswa_id,
              label: `${pembayaran.siswa.nama} (${pembayaran.siswa.nis || pembayaran.siswa_id})`,
            })
          } else if (pembayaran.siswa_id) {
            setSelectedSiswaOption({
              value: pembayaran.siswa_id,
              label: `Siswa ID: ${pembayaran.siswa_id}`,
            })
          }
        } else {
          showError('Gagal mengambil data pembayaran')
          navigate('/keuangan/pembayaran-spp')
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('Error fetching pembayaran:', err)
          showError('Gagal mengambil data pembayaran')
          navigate('/keuangan/pembayaran-spp')
        }
      } finally {
        if (!controller.signal.aborted) {
          setFetchingData(false)
        }
      }
    }

    fetchPembayaran()

    return () => controller.abort()
  }, [id, isEditMode, navigate])

  const fetchTarifOptions = async () => {
    const { data, error } = await tarifSppService.getAll({ per_page: 100 })
    if (data?.data) {
      const options = data.data.map((tarif) => ({
        value: tarif.id,
        label: `${tarif.nama || `Tarif #${tarif.id}`} - ${formatRupiah(tarif.nominal)}`,
        nominal: tarif.nominal,
      }))
      setTarifOptions(options)
    }
    if (error) {
      console.error('Error fetching tarif options:', error)
    }
  }

  // Search siswa options for SearchableSelect
  const searchSiswaOptions = useCallback(async (keyword = '') => {
    const { data, error } = await siswaService.getAll({
      search: keyword || undefined,
      per_page: 20,
    })
    if (data?.data) {
      return data.data.map((siswa) => ({
        value: siswa.id,
        label: `${siswa.nama} (${siswa.nis || siswa.id})${siswa.kelas?.nama ? ` - Kelas ${siswa.kelas.nama}` : ''}`,
      }))
    }
    console.error('Error fetching siswa options:', error)
    return []
  }, [])

  // Calculate denda when relevant fields change
  const calculateDenda = useCallback(async () => {
    if (!formData.tarif_spp_id || !formData.bulan || !formData.tahun) return

    setCalculatingDenda(true)
    try {
      const params = {
        tarifSppId: formData.tarif_spp_id,
        bulan: formData.bulan,
        tahun: formData.tahun,
      }
      if (formData.tanggal_bayar) {
        params.tanggalBayar = formData.tanggal_bayar
      }

      const { data, error } = await pembayaranSppService.hitungDenda(params)
      if (data?.data !== undefined) {
        setFormData((prev) => ({
          ...prev,
          denda: data.data.denda || 0,
        }))
      }
      if (error) {
        console.error('Error calculating denda:', error)
      }
    } catch (err) {
      console.error('Error calculating denda:', err)
    } finally {
      setCalculatingDenda(false)
    }
  }, [formData.tarif_spp_id, formData.bulan, formData.tahun, formData.tanggal_bayar])

  // Handle tarif change to auto-fill jumlah_bayar
  useEffect(() => {
    if (formData.tarif_spp_id && !isEditMode) {
      const selectedTarif = tarifOptions.find((t) => t.value === formData.tarif_spp_id)
      if (selectedTarif?.nominal) {
        setFormData((prev) => ({
          ...prev,
          jumlah_bayar: selectedTarif.nominal,
        }))
      }
      // Also calculate denda
      calculateDenda()
    }
  }, [formData.tarif_spp_id, tarifOptions, isEditMode, calculateDenda])

  const handleChange = (e) => {
    const { name, value } = e.target
    const newValue = ['bulan', 'tahun', 'siswa_id', 'tarif_spp_id', 'jumlah_bayar', 'denda'].includes(name)
      ? (value ? Number(value) : '')
      : value

    setFormData((prev) => ({ ...prev, [name]: newValue }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  // Handle number input with Rupiah formatting display
  const handleRupiahChange = (e) => {
    const { name, value } = e.target
    // Remove non-numeric characters except dots and commas
    const numericValue = value.replace(/[^\d]/g, '')
    setFormData((prev) => ({ ...prev, [name]: numericValue ? Number(numericValue) : '' }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  // Format number for display in Rupiah fields
  const formatNumberForDisplay = (value) => {
    if (value === '' || value === null || value === undefined) return ''
    return Number(value).toLocaleString('id-ID')
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.siswa_id) newErrors.siswa_id = 'Siswa wajib dipilih'
    if (!formData.tarif_spp_id) newErrors.tarif_spp_id = 'Tarif SPP wajib dipilih'
    if (!formData.bulan) newErrors.bulan = 'Bulan wajib dipilih'
    if (!formData.tahun) newErrors.tahun = 'Tahun wajib diisi'
    if (!formData.jumlah_bayar || formData.jumlah_bayar <= 0) {
      newErrors.jumlah_bayar = 'Jumlah bayar wajib diisi dan lebih dari 0'
    }
    if (!formData.metode_pembayaran) newErrors.metode_pembayaran = 'Metode pembayaran wajib dipilih'
    if (!formData.tanggal_bayar) newErrors.tanggal_bayar = 'Tanggal bayar wajib diisi'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)

    const submitData = {
      ...formData,
      denda: formData.denda || 0,
    }

    let result
    if (isEditMode) {
      result = await pembayaranSppService.updatePembayaranSpp(id, submitData)
    } else {
      result = await pembayaranSppService.createPembayaranSpp(submitData)
    }

    const { error } = result

    if (!error) {
      showSuccess(`Pembayaran SPP berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`)
      navigate('/keuangan/pembayaran-spp')
    } else {
      console.error(error)
      if (error.errors) {
        setErrors(error.errors)
      } else {
        showError(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} pembayaran SPP`)
      }
    }
    setLoading(false)
  }

  const yearOptions = generateYearOptions()
  const isLoading = fetchingData

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/keuangan/pembayaran-spp')}>
          <ArrowLeft size={18} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Siswa */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Siswa <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  name="siswa_id"
                  options={selectedSiswaOption ? [selectedSiswaOption] : []}
                  value={formData.siswa_id}
                  onChange={handleChange}
                  loadOptions={searchSiswaOptions}
                  placeholder="Pilih Siswa"
                  searchPlaceholder="Cari nama siswa atau NIS..."
                  noOptionsText="Tidak ada siswa yang cocok"
                  error={errors.siswa_id}
                />
              </div>

              {/* Tarif SPP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tarif SPP <span className="text-red-500">*</span>
                </label>
                <select
                  name="tarif_spp_id"
                  value={formData.tarif_spp_id}
                  onChange={handleChange}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${
                    errors.tarif_spp_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Pilih Tarif SPP</option>
                  {tarifOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.tarif_spp_id && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.tarif_spp_id) ? errors.tarif_spp_id[0] : errors.tarif_spp_id}
                  </p>
                )}
              </div>

              {/* Metode Pembayaran */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Metode Pembayaran <span className="text-red-500">*</span>
                </label>
                <select
                  name="metode_pembayaran"
                  value={formData.metode_pembayaran}
                  onChange={handleChange}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${
                    errors.metode_pembayaran ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {METODE_PEMBAYARAN_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.metode_pembayaran && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.metode_pembayaran) ? errors.metode_pembayaran[0] : errors.metode_pembayaran}
                  </p>
                )}
              </div>

              {/* Bulan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bulan <span className="text-red-500">*</span>
                </label>
                <select
                  name="bulan"
                  value={formData.bulan}
                  onChange={handleChange}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${
                    errors.bulan ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {BULAN_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.bulan && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.bulan) ? errors.bulan[0] : errors.bulan}
                  </p>
                )}
              </div>

              {/* Tahun */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tahun <span className="text-red-500">*</span>
                </label>
                <select
                  name="tahun"
                  value={formData.tahun}
                  onChange={handleChange}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${
                    errors.tahun ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {yearOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.tahun && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.tahun) ? errors.tahun[0] : errors.tahun}
                  </p>
                )}
              </div>

              {/* Jumlah Bayar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jumlah Bayar <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    name="jumlah_bayar"
                    value={formatNumberForDisplay(formData.jumlah_bayar)}
                    onChange={handleRupiahChange}
                    placeholder="1.500.000"
                    className={`w-full pl-10 pr-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                      errors.jumlah_bayar ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>
                {errors.jumlah_bayar && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.jumlah_bayar) ? errors.jumlah_bayar[0] : errors.jumlah_bayar}
                  </p>
                )}
              </div>

              {/* Tanggal Bayar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tanggal Bayar <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggal_bayar"
                  value={formData.tanggal_bayar}
                  onChange={handleChange}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:bg-gray-800 dark:text-white ${
                    errors.tanggal_bayar ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.tanggal_bayar && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.tanggal_bayar) ? errors.tanggal_bayar[0] : errors.tanggal_bayar}
                  </p>
                )}
              </div>

              {/* Denda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Denda
                  <button
                    type="button"
                    onClick={calculateDenda}
                    disabled={calculatingDenda || !formData.tarif_spp_id}
                    className="ml-2 text-primary-600 hover:text-primary-700 disabled:opacity-50"
                    title="Hitung Denda Otomatis"
                  >
                    <Calculator size={14} className="inline" />
                  </button>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    name="denda"
                    value={formatNumberForDisplay(formData.denda)}
                    onChange={handleRupiahChange}
                    placeholder="0"
                    disabled={calculatingDenda}
                    className={`w-full pl-10 pr-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-800 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                      errors.denda ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {calculatingDenda && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                    </div>
                  )}
                </div>
                {errors.denda && (
                  <p className="mt-1 text-sm text-red-500">
                    {Array.isArray(errors.denda) ? errors.denda[0] : errors.denda}
                  </p>
                )}
              </div>

              {/* Keterangan */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Keterangan
                </label>
                <textarea
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Catatan tambahan (opsional)"
                />
                {errors.keterangan && <p className="mt-1 text-sm text-red-500">{errors.keterangan}</p>}
              </div>
            </div>

            {/* Summary */}
            {(formData.jumlah_bayar || formData.denda) && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ringkasan Pembayaran</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Jumlah Bayar:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatRupiah(formData.jumlah_bayar || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Denda:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatRupiah(formData.denda || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Total:</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">
                      {formatRupiah((Number(formData.jumlah_bayar) || 0) + (Number(formData.denda) || 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={() => navigate('/keuangan/pembayaran-spp')}>
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

export default PembayaranSppForm
